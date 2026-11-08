import type {PoolClient} from 'pg';
import {getDbPool} from './db';
import {readProcurement,readCurrentPlan,ProcurementConflict,ProcurementInvalid,ProcurementNotFound} from './procurement-db';
import {createB2BFixtureJob} from './b2b-fixture-job';
import {validateOfflineReport,InvalidOfflineReport} from './b2b-queue-report';
import type {OfflineReport} from './b2b-queue-report';

export type B2BSupplier='fmic'|'mtuning';
export type QueueStatus='queued'|'offline_reported'|'cancelled';
export type B2BTask={
 id:string;orderId:string;supplier:B2BSupplier;jobId:string;fingerprint:string;
 status:QueueStatus;createdAt:string;updatedAt:string;
};
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
 return {tasks:tasks.rows,events:events.rows};
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
 return {summary,tasks,events:events.rows,limit:100,asOf:new Date().toISOString()};
}
