import type {PoolClient} from 'pg';
import {getDbPool} from './db';
import {readProcurement,readCurrentPlan,ProcurementConflict,ProcurementInvalid,ProcurementNotFound} from './procurement-db';
import {createB2BFixtureJob} from './b2b-fixture-job';
import {validateOfflineReport,InvalidOfflineReport} from './b2b-queue-report';
import type {OfflineReport} from './b2b-queue-report';
import {validateCartReview} from './b2b-cart-review';
import type {CartReview} from './b2b-cart-review';
import {validateB2BPreflight} from './b2b-cart-preflight';
import type {B2BPreflightPayload} from './b2b-cart-preflight';
import {validateAgentEvent,TERMINAL_AGENT_PHASES} from './b2b-agent-protocol';
import type {AgentEventPayload,AgentPhase,AgentMode} from './b2b-agent-protocol';

export type B2BPreflightRecord=B2BPreflightPayload&{
 id:string;taskId:string;createdAt:string;
};
export type B2BAgentEvent={
 id:string;taskId:string;jobId:string;orderId:string;supplier:'fmic';
 runId:string;seq:number;mode:AgentMode;phase:AgentPhase;
 stepIndex:number|null;createdAt:string;
};
export type B2BSupplier='fmic'|'mtuning';
export type QueueStatus='queued'|'offline_reported'|'cancelled';
export type B2BTask={
 id:string;orderId:string;supplier:B2BSupplier;jobId:string;fingerprint:string;
 status:QueueStatus;createdAt:string;updatedAt:string;
};
export type B2BCartRecord=CartReview&{id:string;taskId:string;createdAt:string};
export type B2BEvent={
 id:string;taskId:string;jobId:string;event:'queued'|'requeued'|'cancelled'|'offline_reported';
 runId:string|null;items:number|null;trace:OfflineReport['trace'];durationMs:number|null;createdAt:string;
};
const idOk=(value:string)=>/^[1-9][0-9]{0,17}$/.test(value);
const hashOk=(value:string)=>/^[a-f0-9]{64}$/.test(value);
export class QueueConflict extends Error{}
export class QueueInvalid extends Error{}
let setup:Promise<void>|undefined;
async function ensure(){
 setup??=(async()=>{
  const db=getDbPool();
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_orders
   (id BIGSERIAL PRIMARY KEY,customer JSONB NOT NULL,items JSONB NOT NULL,
    total NUMERIC(12,2) NOT NULL,status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_b2b_tasks(
   id BIGSERIAL PRIMARY KEY,order_id BIGINT NOT NULL REFERENCES rpm_orders(id),
   supplier TEXT NOT NULL CHECK(supplier IN ('fmic','mtuning')),
   job_id TEXT NOT NULL UNIQUE,fingerprint TEXT NOT NULL,
   status TEXT NOT NULL CHECK(status IN ('queued','offline_reported','cancelled')),
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   UNIQUE(order_id,supplier)
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_b2b_task_events(
   id BIGSERIAL PRIMARY KEY,task_id BIGINT NOT NULL REFERENCES rpm_b2b_tasks(id),
   job_id TEXT NOT NULL,
   event TEXT NOT NULL CHECK(event IN ('queued','requeued','cancelled','offline_reported')),
   run_id UUID,items INTEGER,trace JSONB NOT NULL DEFAULT '[]'::jsonb,
   duration_ms INTEGER,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   UNIQUE(task_id,run_id)
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_b2b_cart_reviews(
   id BIGSERIAL PRIMARY KEY,task_id BIGINT NOT NULL REFERENCES rpm_b2b_tasks(id),
   job_id TEXT NOT NULL,run_id UUID NOT NULL,
   verdict TEXT NOT NULL CHECK(verdict IN ('verified','needs_review')),
   items INTEGER NOT NULL,cart_add_requests INTEGER NOT NULL,
   duration_ms INTEGER NOT NULL,
   calculated_gross_pln NUMERIC(12,2),
   observed_subtotal_gross_pln NUMERIC(12,2),
   issues JSONB NOT NULL DEFAULT '[]'::jsonb,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   UNIQUE(task_id,run_id)
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_b2b_agent_events(
   id BIGSERIAL PRIMARY KEY,task_id BIGINT NOT NULL REFERENCES rpm_b2b_tasks(id),
   job_id TEXT NOT NULL,run_id UUID NOT NULL,seq INTEGER NOT NULL,
   mode TEXT NOT NULL CHECK(mode IN ('inspect','cart-only')),
   phase TEXT NOT NULL,step_index INTEGER,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   UNIQUE(task_id,run_id,seq)
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_b2b_cart_preflights(
   id BIGSERIAL PRIMARY KEY,
   task_id BIGINT NOT NULL REFERENCES rpm_b2b_tasks(id),
   job_id TEXT NOT NULL,run_id UUID NOT NULL,
   status TEXT NOT NULL CHECK(status IN ('empty','nonempty','unknown')),
   item_count INTEGER NOT NULL CHECK(item_count BETWEEN 0 AND 50),
   items JSONB NOT NULL DEFAULT '[]'::jsonb,
   reason TEXT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   UNIQUE(task_id,run_id)
  )`);
 })();
 try{await setup}catch(error){setup=undefined;throw error}
}
const cols=`id::text AS "id",order_id::text AS "orderId",supplier,
 job_id AS "jobId",fingerprint,status,created_at AS "createdAt",updated_at AS "updatedAt"`;
async function queueRows(client:PoolClient,orderId:string){
 const result=await client.query<B2BTask>(
  `SELECT ${cols} FROM rpm_b2b_tasks WHERE order_id=$1 ORDER BY supplier`,[orderId]);
 return result.rows;
}
export async function getB2BQueue(orderId:string){
 if(!idOk(orderId))throw new QueueInvalid('Nieprawidłowy numer zamówienia');
 await readProcurement(orderId); // ensure original schema and check order exists
 await ensure();
 const db=getDbPool();
 const [tasks,events]=await Promise.all([
  db.query<B2BTask>(`SELECT ${cols} FROM rpm_b2b_tasks WHERE order_id=$1 ORDER BY supplier`,[orderId]),
  db.query<B2BEvent>(`SELECT e.id::text AS "id", e.task_id::text AS "taskId",
   e.job_id AS "jobId",e.event,e.run_id::text AS "runId",
   e.items,e.trace,e.duration_ms AS "durationMs",e.created_at AS "createdAt"
   FROM rpm_b2b_task_events e
   JOIN rpm_b2b_tasks t ON t.id=e.task_id
   WHERE t.order_id=$1 ORDER BY e.id DESC LIMIT 50`,[orderId]),
 ]);
 const reviews=await db.query<B2BCartRecord>(`SELECT r.id::text AS "id",r.task_id::text AS "taskId",
   r.job_id AS "jobId",r.run_id::text AS "runId",
   t.order_id::text AS "orderId",t.supplier,
   r.verdict,r.items,r.cart_add_requests AS "cartAddRequests",
   r.duration_ms AS "durationMs",
   r.calculated_gross_pln::float8 AS "calculatedGrossPLN",
   r.observed_subtotal_gross_pln::float8 AS "observedSubtotalGrossPLN",
   r.issues,r.created_at AS "createdAt"
   FROM rpm_b2b_cart_reviews r
   JOIN rpm_b2b_tasks t ON t.id=r.task_id
   WHERE t.order_id=$1 ORDER BY r.id DESC LIMIT 40`,[orderId]);
 return {tasks:tasks.rows,events:events.rows,cartReviews:reviews.rows};
}

async function validatedJob(
 client:PoolClient,orderId:string,supplier:B2BSupplier,expectedFingerprint:string
){
 // Align locking order with the existing procurement workflow to avoid
 // races with vendor feed imports and concurrent approvals.
 await client.query('LOCK TABLE rpm_supplier_offers IN SHARE MODE');
 await client.query('LOCK TABLE rpm_shop_settings IN SHARE MODE');
 const plan=await readCurrentPlan(client,orderId,true);
 const result=await client.query<{status:string;fingerprint:string;plan:typeof plan}>(
  'SELECT status,fingerprint,plan FROM rpm_supplier_procurements WHERE order_id=$1 FOR UPDATE',[orderId]);
 const existing=result.rows[0];
 if(!existing||existing.status!=='approved')
  throw new QueueConflict('Wymagany zatwierdzony, niezrealizowany plan zakupowy');
 if(existing.fingerprint!==expectedFingerprint||plan.fingerprint!==expectedFingerprint)
  throw new QueueConflict('Szkic lub oferty zmieniły się. Wymagana ponowna kontrola');
 return createB2BFixtureJob(existing.plan,supplier);
}
function validateInput(orderId:string,supplier:B2BSupplier,expectedFingerprint:string){
 if(!idOk(orderId)||!['fmic','mtuning'].includes(supplier)||!hashOk(expectedFingerprint))
  throw new QueueInvalid('Nieprawidłowy numer zamówienia, dostawca lub fingerprint');
}
async function history(client:PoolClient,taskId:string,jobId:string,event:B2BEvent['event'],
 report?:OfflineReport){
 const result=await client.query<{id:string}>(`INSERT INTO rpm_b2b_task_events
  (task_id,job_id,event,run_id,items,trace,duration_ms)
  VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)
  ON CONFLICT(task_id,run_id) DO NOTHING RETURNING id::text AS id`,
  [taskId,jobId,event,report?.runId??null,report?.items??null,
   JSON.stringify(report?.trace??[]),report?.durationMs??null]);
 return result.rows[0]?.id??null;
}

/**
 * One task per order + supplier. Parallel clicks serialize on the order row;
 * repeated requests for an active job return the existing task, not a new one.
 * Only a cancelled task can be reused for a new, reviewed fingerprint.
 */
export async function enqueueB2BTask(orderId:string,supplier:B2BSupplier,expectedFingerprint:string){
 validateInput(orderId,supplier,expectedFingerprint);
 await readProcurement(orderId);await ensure();
 const client=await getDbPool().connect();
 try{
  await client.query('BEGIN');
  const job=await validatedJob(client,orderId,supplier,expectedFingerprint);
  const current=await client.query<B2BTask>(
   `SELECT ${cols} FROM rpm_b2b_tasks WHERE order_id=$1 AND supplier=$2 FOR UPDATE`,[orderId,supplier]);
  let task=current.rows[0];
  if(task&&task.status!=='cancelled'){
   if(task.jobId!==job.jobId)throw new QueueConflict(
    'Istnieje zadanie o innej wersji. Anuluj poprzednie przed ponownym dodaniem.');
   await client.query('COMMIT');
   return {task,created:false};
  }
  if(task){
   const updated=await client.query<B2BTask>(`UPDATE rpm_b2b_tasks
    SET job_id=$2,fingerprint=$3,status='queued',updated_at=NOW() WHERE id=$1
    RETURNING ${cols}`,[task.id,job.jobId,expectedFingerprint]);
   task=updated.rows[0];
   await history(client,task.id,job.jobId,'requeued');
  }else{
   const inserted=await client.query<B2BTask>(`INSERT INTO rpm_b2b_tasks
    (order_id,supplier,job_id,fingerprint,status) VALUES($1,$2,$3,$4,'queued')
    RETURNING ${cols}`,[orderId,supplier,job.jobId,expectedFingerprint]);
   task=inserted.rows[0];
   await history(client,task.id,job.jobId,'queued');
  }
  await client.query('COMMIT');
  return {task,created:true};
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
 finally{client.release()}
}

/** Cancelling cannot contact a supplier; it only changes an internal queue row. */
export async function cancelB2BTask(orderId:string,supplier:B2BSupplier,jobId:string){
 if(!idOk(orderId)||!['fmic','mtuning'].includes(supplier)||!hashOk(jobId))
  throw new QueueInvalid('Niepoprawne dane zadania');
 await readProcurement(orderId);await ensure();
 const client=await getDbPool().connect();
 try{
  await client.query('BEGIN');
  const current=await client.query<B2BTask>(
   `SELECT ${cols} FROM rpm_b2b_tasks WHERE order_id=$1 AND supplier=$2 FOR UPDATE`,[orderId,supplier]);
  const task=current.rows[0];
  if(!task)throw new ProcurementNotFound('Zadanie nie istnieje');
  if(task.jobId!==jobId)throw new QueueConflict('Identyfikator zadania uległ zmianie');
  if(task.status==='cancelled'){await client.query('COMMIT');return {task,created:false}}
  const result=await client.query<B2BTask>(`UPDATE rpm_b2b_tasks
   SET status='cancelled',updated_at=NOW() WHERE id=$1 RETURNING ${cols}`,[task.id]);
  await history(client,task.id,jobId,'cancelled');
  await client.query('COMMIT');
  return {task:result.rows[0],created:true};
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
 finally{client.release()}
}

/**
 * Recording is NOT proof of a successful browser run. An administrator
 * uploads a local Playwright report. We store only an event with a UUID,
 * not local screenshot paths, customer PII, or external vendor data.
 */
export async function recordB2BOfflineReport(
 orderId:string,supplier:B2BSupplier,expectedFingerprint:string,untrusted:unknown
){
 validateInput(orderId,supplier,expectedFingerprint);
 await readProcurement(orderId);await ensure();
 const client=await getDbPool().connect();
 try{
  await client.query('BEGIN');
  const job=await validatedJob(client,orderId,supplier,expectedFingerprint);
  const report=validateOfflineReport(untrusted,job);
  const current=await client.query<B2BTask>(
   `SELECT ${cols} FROM rpm_b2b_tasks WHERE order_id=$1 AND supplier=$2 FOR UPDATE`,[orderId,supplier]);
  const task=current.rows[0];
  if(!task)throw new ProcurementNotFound('Najpierw dodaj zadanie do kolejki');
  if(task.jobId!==job.jobId||task.status==='cancelled')
   throw new QueueConflict('Zadanie jest anulowane lub nieaktualne');
  const eventId=await history(client,task.id,job.jobId,'offline_reported',report);
  const updated=await client.query<B2BTask>(`UPDATE rpm_b2b_tasks
   SET status='offline_reported',updated_at=NOW() WHERE id=$1 RETURNING ${cols}`,[task.id]);
  await client.query('COMMIT');
  return {task:updated.rows[0],newReport:eventId!==null};
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
 finally{client.release()}
}

/**
 * Back-office overview for the dashboard. No customer PII, passwords or
 * supplier credentials are returned. This is a monitoring view only:
 * queued tasks are NOT actively processed by a live B2B worker yet.
 */
export async function getB2BQueueOverview(){
 await ensure();
 const db=getDbPool();
 const [counts,listing]=await Promise.all([
  db.query<{status:QueueStatus;count:number}>(`SELECT status,count(*)::integer AS count
   FROM rpm_b2b_tasks GROUP BY status`),
  db.query<B2BTask>(`SELECT ${cols} FROM rpm_b2b_tasks
   ORDER BY updated_at DESC,id DESC LIMIT 100`),
 ]);
 const tasks=listing.rows;
 const ids=tasks.map(task=>task.id);
 const events=ids.length?await db.query<B2BEvent>(`SELECT
   ranked.id::text AS "id",ranked.task_id::text AS "taskId",
   ranked.job_id AS "jobId",ranked.event,
   ranked.run_id::text AS "runId",ranked.items,ranked.trace,
   ranked.duration_ms AS "durationMs",ranked.created_at AS "createdAt"
   FROM (
    SELECT e.*,ROW_NUMBER() OVER(PARTITION BY e.task_id ORDER BY e.id DESC) AS rn
    FROM rpm_b2b_task_events e WHERE e.task_id=ANY($1::bigint[])
   ) ranked WHERE ranked.rn<=10 ORDER BY ranked.id DESC`,[ids]):{rows:[]};
 const summary={queued:0,offline_reported:0,cancelled:0,total:0};
 for(const row of counts.rows){
  if(row.status==='queued'||row.status==='offline_reported'||row.status==='cancelled')
   summary[row.status]=row.count;
  summary.total+=row.count;
 }
 const reviews=ids.length?await db.query<B2BCartRecord>(`SELECT r.id::text AS "id",r.task_id::text AS "taskId",
   r.job_id AS "jobId",r.run_id::text AS "runId",
   t.order_id::text AS "orderId",t.supplier,
   r.verdict,r.items,r.cart_add_requests AS "cartAddRequests",
   r.duration_ms AS "durationMs",
   r.calculated_gross_pln::float8 AS "calculatedGrossPLN",
   r.observed_subtotal_gross_pln::float8 AS "observedSubtotalGrossPLN",
   r.issues,r.created_at AS "createdAt"
   FROM rpm_b2b_cart_reviews r
   JOIN rpm_b2b_tasks t ON t.id=r.task_id
   WHERE r.task_id=ANY($1::bigint[]) ORDER BY r.id DESC LIMIT 200`,[ids]):{rows:[]};
 const agentEvents=ids.length?await db.query<B2BAgentEvent>(`SELECT
  a.id::text AS "id",a.task_id::text AS "taskId",a.job_id AS "jobId",
  t.order_id::text AS "orderId",t.supplier,a.run_id::text AS "runId",
  a.seq,a.mode,a.phase,a.step_index AS "stepIndex",a.created_at AS "createdAt"
  FROM rpm_b2b_agent_events a
  JOIN rpm_b2b_tasks t ON t.id=a.task_id
  WHERE a.task_id=ANY($1::bigint[])
  ORDER BY a.id DESC LIMIT 400`,[ids]):{rows:[]};
 const preflights=ids.length?await db.query<B2BPreflightRecord>(`
  SELECT p.id::text AS "id",p.task_id::text AS "taskId",
   p.job_id AS "jobId",p.run_id::text AS "runId",t.order_id::text AS "orderId",
   t.supplier,p.status,p.item_count AS "itemCount",p.items,p.reason,
   p.created_at AS "createdAt"
  FROM rpm_b2b_cart_preflights p JOIN rpm_b2b_tasks t ON t.id=p.task_id
  WHERE p.task_id=ANY($1::bigint[])
  ORDER BY p.id DESC LIMIT 150`,[ids]):{rows:[]};
 return {summary,tasks,events:events.rows,cartReviews:reviews.rows,
  agentEvents:agentEvents.rows,cartPreflights:preflights.rows,limit:100,
  asOf:new Date().toISOString()};
}

/**
 * Report of a *local* cart preparation attempt. Never a supplier-issued
 * order confirmation. No screenshot path, cookies, customer data or HTML.
 */
export async function recordFmicCartReview(
 orderId:string,supplier:B2BSupplier,expectedFingerprint:string,untrusted:unknown
){
 validateInput(orderId,supplier,expectedFingerprint);
 if(supplier!=='fmic')throw new QueueInvalid('Recenzja koszyka dotyczy tylko FMIC');
 await readProcurement(orderId);await ensure();
 const client=await getDbPool().connect();
 try{
  await client.query('BEGIN');
  const job=await validatedJob(client,orderId,supplier,expectedFingerprint);
  const review=validateCartReview(untrusted,job);
  const current=await client.query<B2BTask>(
   `SELECT ${cols} FROM rpm_b2b_tasks WHERE order_id=$1 AND supplier=$2 FOR UPDATE`,
   [orderId,supplier]);
  const task=current.rows[0];
  if(!task)throw new ProcurementNotFound('Najpierw dodaj zadanie do kolejki');
  if(task.status==='cancelled'||task.jobId!==job.jobId)
   throw new QueueConflict('Zadanie nieaktualne lub anulowane');
  const inserted=await client.query<{id:string}>(`INSERT INTO rpm_b2b_cart_reviews
   (task_id,job_id,run_id,verdict,items,cart_add_requests,duration_ms,
    calculated_gross_pln,observed_subtotal_gross_pln,issues)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
   ON CONFLICT(task_id,run_id) DO NOTHING RETURNING id::text AS id`,
   [task.id,job.jobId,review.runId,review.verdict,review.items,
    review.cartAddRequests,review.durationMs,review.calculatedGrossPLN,
    review.observedSubtotalGrossPLN,JSON.stringify(review.issues)]);
  await client.query('UPDATE rpm_b2b_tasks SET updated_at=NOW() WHERE id=$1',[task.id]);
  await client.query('COMMIT');
  return {taskId:task.id,newReport:inserted.rows.length===1,verdict:review.verdict,
   notice:'Zapisano deklarowany raport koszyka FMIC. Nie jest to potwierdzenie złożenia zamówienia.'};
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
 finally{client.release()}
}

/**
 * Authenticated local agent heartbeat. Events are intentionally narrow:
 * no passwords, customer data, URLs, HTML, screenshots or freeform logs.
 * Every event is linked to an active approved procurement plan and task.
 * Nothing in this function contacts a supplier or places an order.
 */
export async function recordB2BAgentEvent(payload:unknown){
 const event=validateAgentEvent(payload);
 await readProcurement(event.orderId);await ensure();
 const client=await getDbPool().connect();
 try{
  await client.query('BEGIN');
  const job=await validatedJob(client,event.orderId,event.supplier,event.fingerprint);
  if(job.jobId!==event.jobId)throw new QueueConflict('Identyfikator zadania różni się od bieżącego planu');
  const current=await client.query<B2BTask>(
   `SELECT ${cols} FROM rpm_b2b_tasks WHERE order_id=$1 AND supplier=$2 FOR UPDATE`,
   [event.orderId,event.supplier]);
  const task=current.rows[0];
  if(!task||task.status==='cancelled'||task.jobId!==event.jobId)
   throw new QueueConflict('Zadanie nie jest w aktywnej kolejce');
  const recent=await client.query<{
   id:string;runId:string;seq:number;mode:AgentMode;phase:AgentPhase;
   stepIndex:number|null
  }>(`SELECT id::text AS "id",run_id::text AS "runId",
   seq,mode,phase,step_index AS "stepIndex"
   FROM rpm_b2b_agent_events WHERE task_id=$1
   ORDER BY id DESC LIMIT 1`,[task.id]);
  const last=recent.rows[0];
  // Idempotence is keyed by this run + step, not by the newest auto id:
  // different attempts can use the sequence independently.
  const existingStep=await client.query<{
   id:string;runId:string;seq:number;mode:AgentMode;phase:AgentPhase;stepIndex:number|null
  }>(`SELECT id::text AS "id",run_id::text AS "runId",
   seq,mode,phase,step_index AS "stepIndex"
   FROM rpm_b2b_agent_events WHERE task_id=$1 AND run_id=$2 AND seq=$3`,
   [task.id,event.runId,event.seq]);
  const duplicate=existingStep.rows[0];
  if(duplicate){
   if(duplicate.mode!==event.mode||duplicate.phase!==event.phase||
      duplicate.stepIndex!==event.stepIndex){
    throw new QueueConflict('Ten numer etapu już istnieje z inną zawartością');
   }
   await client.query('COMMIT');
   return {accepted:true,created:false,eventId:duplicate.id};
  }
  if(event.phase==='started'){
   if(event.seq!==1||
      (last&&(!TERMINAL_AGENT_PHASES.includes(last.phase)||last.runId===event.runId))){
    throw new QueueConflict('Trwa lub zakończył się już ten przebieg automatu');
   }
  }else{
   // Use the exact previous sequence, not the last BIGSERIAL id. This
   // rejects skipped steps while tolerating non-monotonic ID allocation
   // across concurrent transactions and pooled PostgreSQL connections.
   const previous=await client.query<{seq:number;mode:AgentMode;phase:AgentPhase}>(
    `SELECT seq,mode,phase FROM rpm_b2b_agent_events
     WHERE task_id=$1 AND run_id=$2 AND seq=$3`,
    [task.id,event.runId,event.seq-1]);
   const earlier=previous.rows[0];
   if(!earlier||earlier.mode!==event.mode||
      TERMINAL_AGENT_PHASES.includes(earlier.phase)||
      (last&&last.runId!==event.runId)){
    throw new QueueConflict('Etap agenta jest nieaktualny, pominięty lub uruchomiono drugi przebieg');
   }
   if(event.mode==='cart-only'){
    if((event.phase==='check_cart'&&earlier.phase!=='started')||
       (earlier.phase==='started'&&event.phase!=='check_cart')||
       (earlier.phase==='check_cart'&&
        !['cart_empty','cart_nonempty','cart_unknown','stopped'].includes(event.phase))){
     throw new QueueConflict('Kontrola koszyka musi poprzedzać wszelkie dodawanie produktów');
    }
    const relevant:Record<string,string>={cart_empty:'empty',cart_nonempty:'nonempty',cart_unknown:'unknown'};
    if(relevant[event.phase]){
     const preflight=await client.query<{status:string}>(`
      SELECT status FROM rpm_b2b_cart_preflights
      WHERE task_id=$1 AND run_id=$2`,[task.id,event.runId]);
     if(preflight.rows[0]?.status!==relevant[event.phase])
      throw new QueueConflict('Brak zgłoszonego wyniku kontroli koszyka');
    }else if(!['started','check_cart','stopped'].includes(event.phase)){
     const verified=await client.query(`
      SELECT 1 FROM rpm_b2b_agent_events
      WHERE task_id=$1 AND run_id=$2 AND phase='cart_empty' LIMIT 1`,
      [task.id,event.runId]);
     if(!verified.rows.length)
      throw new QueueConflict('Brak potwierdzonego pustego koszyka FMIC');
    }
   }
  }
  const added=await client.query<{id:string}>(`INSERT INTO rpm_b2b_agent_events
   (task_id,job_id,run_id,seq,mode,phase,step_index)
   VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id::text AS id`,
   [task.id,event.jobId,event.runId,event.seq,event.mode,event.phase,event.stepIndex]);
  await client.query('UPDATE rpm_b2b_tasks SET updated_at=NOW() WHERE id=$1',[task.id]);
  await client.query('COMMIT');
  return {accepted:true,created:true,eventId:added.rows[0].id};
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
 finally{client.release()}
}

/**
 * Snapshot of FMIC cart BEFORE any cart mutation. Reported by the local
 * agent, not an FMIC attestation. No passwords, cookies, product titles,
 * customer details, screenshot paths or free-text messages are persisted.
 * No clear-cart operation exists here.
 */
export async function recordB2BCartPreflight(payload:unknown){
 const preflight=validateB2BPreflight(payload);
 await readProcurement(preflight.orderId);await ensure();
 const client=await getDbPool().connect();
 try{
  await client.query('BEGIN');
  const job=await validatedJob(client,preflight.orderId,'fmic',preflight.fingerprint);
  if(job.jobId!==preflight.jobId)throw new QueueConflict('Nieaktualne zadanie FMIC');
  const current=await client.query<B2BTask>(`
   SELECT ${cols} FROM rpm_b2b_tasks WHERE order_id=$1 AND supplier='fmic' FOR UPDATE`,
   [preflight.orderId]);
  const task=current.rows[0];
  if(!task||task.status==='cancelled'||task.jobId!==job.jobId)
   throw new QueueConflict('Zadanie FMIC nie jest aktywne');
  const last=await client.query<{phase:string;mode:string}>(`
   SELECT phase,mode FROM rpm_b2b_agent_events
   WHERE task_id=$1 AND run_id=$2 ORDER BY seq DESC LIMIT 1`,
   [task.id,preflight.runId]);
  if(last.rows[0]?.phase!=='check_cart'||last.rows[0]?.mode!=='cart-only')
   throw new QueueConflict('Agent musi najpierw zgłosić rozpoczęcie kontroli koszyka');
  const existing=await client.query<{id:string;status:string;itemCount:number;reason:string;items:B2BPreflightPayload['items']}>(`
   SELECT id::text AS "id",status,item_count AS "itemCount",reason,items
   FROM rpm_b2b_cart_preflights WHERE task_id=$1 AND run_id=$2 FOR UPDATE`,
   [task.id,preflight.runId]);
  const prior=existing.rows[0];
  if(prior){
   if(prior.status!==preflight.status||prior.itemCount!==preflight.itemCount||
     prior.reason!==preflight.reason||
     prior.items.length!==preflight.items.length||
     prior.items.some((row,index)=>row.sku!==preflight.items[index].sku||
      row.qty!==preflight.items[index].qty))
    throw new QueueConflict('Nie można zmienić już zgłoszonej zawartości koszyka');
   await client.query('COMMIT');
   return {accepted:true,created:false,preflightId:prior.id};
  }
  const created=await client.query<{id:string}>(`
   INSERT INTO rpm_b2b_cart_preflights
    (task_id,job_id,run_id,status,item_count,items,reason)
   VALUES($1,$2,$3,$4,$5,$6::jsonb,$7) RETURNING id::text AS id`,
   [task.id,job.jobId,preflight.runId,preflight.status,preflight.itemCount,
    JSON.stringify(preflight.items),preflight.reason]);
  await client.query('UPDATE rpm_b2b_tasks SET updated_at=NOW() WHERE id=$1',[task.id]);
  await client.query('COMMIT');
  return {accepted:true,created:true,preflightId:created.rows[0].id};
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
 finally{client.release()}
}
