import {canRunFmicWorker} from './fmic-worker-mode';
import {getDbPool} from './db';
import {nextAuditCandidate,auditSupplierBlocked} from './fmic-audit-selection';
import {setupImageAudit,inspectImage} from './fmic-image-quality';

let setup:Promise<unknown>|undefined;
export async function setupAuditWorker(){
 await setupImageAudit();
 if(!setup)setup=getDbPool().query(`CREATE TABLE IF NOT EXISTS rpm_fmic_audit_control (
 id integer PRIMARY KEY CHECK(id=1), enabled boolean NOT NULL DEFAULT false,
 heartbeat timestamptz, last_error text, processed bigint NOT NULL DEFAULT 0
 ); ALTER TABLE rpm_fmic_audit_control ADD COLUMN IF NOT EXISTS intensity integer NOT NULL DEFAULT 2;
 INSERT INTO rpm_fmic_audit_control(id) VALUES(1) ON CONFLICT DO NOTHING;
 CREATE TABLE IF NOT EXISTS rpm_fmic_audit_priority(url text PRIMARY KEY);`).catch(e=>{setup=undefined;throw e});
 await setup;
}
export async function seedAuditQueue(){
 await setupAuditWorker();
 const db=getDbPool();
 const result=await db.query("INSERT INTO rpm_fmic_image_audit(url) SELECT DISTINCT image FROM rpm_fmic_catalog CROSS JOIN LATERAL jsonb_array_elements_text(data->'images') AS image ON CONFLICT DO NOTHING");
 await db.query("INSERT INTO rpm_fmic_audit_priority(url) SELECT DISTINCT data->'images'->>0 FROM rpm_fmic_catalog WHERE NULLIF(data->'images'->>0,'') IS NOT NULL ON CONFLICT DO NOTHING");
 resetAuditCandidates();
 return result.rowCount??0;
}
const runtime=globalThis as typeof globalThis & {rpmAuditLoop?:boolean;rpmAuditCandidates?:string[];rpmAuditStop?:boolean;rpmAuditTask?:Promise<void>};
const candidates=runtime.rpmAuditCandidates??=[];
export function resetAuditCandidates(){candidates.length=0}
const sleep=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
export function startAuditWorker(){
 if(runtime.rpmAuditLoop||!canRunFmicWorker())return;
 runtime.rpmAuditLoop=true;
 runtime.rpmAuditStop=false;
 runtime.rpmAuditTask=(async()=>{
 while(!runtime.rpmAuditStop){
 let client:import('pg').PoolClient|undefined;
 let locked=false,delay=5000;
 try{
 await setupAuditWorker();
 const db=getDbPool();
 const control=await db.query('SELECT enabled FROM rpm_fmic_audit_control WHERE id=1');
 if(control.rows[0]?.enabled&&process.memoryUsage().rss<320*1024*1024){
 client=await db.connect();
 const lock=await client.query('SELECT pg_try_advisory_lock(27391,2) AS acquired');
 locked=lock.rows[0].acquired;
 if(locked){
 const state=await client.query('SELECT enabled,intensity FROM rpm_fmic_audit_control WHERE id=1');
 if(state.rows[0]?.enabled){
 await client.query('UPDATE rpm_fmic_audit_control SET heartbeat=NOW() WHERE id=1');
 const url=await nextAuditCandidate(client,candidates);
 if(url){
 const outcomes=[{url,...await inspectImage(url)}];
 const blocked=outcomes.find(x=>auditSupplierBlocked(x.detail));
 const completed=outcomes.filter(x=>!auditSupplierBlocked(x.detail));
 await client.query('BEGIN');
 try{
 for(const result of completed)await client.query("UPDATE rpm_fmic_image_audit SET status=$2,hash=$3,detail=$4,checked_at=NOW() WHERE url=$1 AND status='pending'",[result.url,result.status,result.hash,result.detail]);
 await client.query('UPDATE rpm_fmic_audit_control SET processed=processed+$1,heartbeat=NOW(),last_error=$2,enabled=CASE WHEN $3::boolean THEN false ELSE enabled END WHERE id=1',[completed.length,blocked?.detail??null,blocked?.detail==='HTTP 403']);
 await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}
 if(completed.length&&candidates[0]===url)candidates.shift();
 delay=blocked?30000:5000;
 }
 }
 }
 }
 }catch(e){console.error('FMIC audit worker',e);delay=30000;await getDbPool().query('UPDATE rpm_fmic_audit_control SET last_error=$1 WHERE id=1',[String(e).slice(0,300)]).catch(()=>{})}
 finally{if(client){if(locked)await client.query('SELECT pg_advisory_unlock(27391,2)').catch(()=>{});client.release()}}
 if(!runtime.rpmAuditStop)await sleep(delay);
 }
 })().catch(e=>{console.error('FMIC audit loop stopped',e)}).finally(()=>{runtime.rpmAuditLoop=false;runtime.rpmAuditTask=undefined});
}
export async function stopAuditWorker(){runtime.rpmAuditStop=true;await runtime.rpmAuditTask}

