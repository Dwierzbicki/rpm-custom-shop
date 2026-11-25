import {getDbPool} from './db';
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
 return result.rowCount??0;
}
const runtime=globalThis as typeof globalThis & {rpmAuditLoop?:boolean};
const sleep=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
export function startAuditWorker(){
 if(runtime.rpmAuditLoop)return;
 runtime.rpmAuditLoop=true;
 void (async()=>{
 for(;;){
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
 const pending=await client.query("SELECT a.url FROM rpm_fmic_image_audit a LEFT JOIN rpm_fmic_audit_priority p ON p.url=a.url WHERE a.status='pending' ORDER BY (p.url IS NULL),a.url LIMIT $1",[1]);
 if(pending.rows.length){
 const outcomes=await Promise.all(pending.rows.map(async ({url})=>({url,...await inspectImage(url)})));
 await client.query('BEGIN');
 try{
 for(const result of outcomes.filter(x=>x.detail!=='HTTP 429'&&x.detail!=='HTTP 503'))await client.query("UPDATE rpm_fmic_image_audit SET status=$2,hash=$3,detail=$4,checked_at=NOW() WHERE url=$1 AND status='pending'",[result.url,result.status,result.hash,result.detail]);
 await client.query('UPDATE rpm_fmic_audit_control SET processed=processed+$1,heartbeat=NOW(),last_error=NULL WHERE id=1',[outcomes.filter(x=>x.detail!=='HTTP 429'&&x.detail!=='HTTP 503').length]);
 await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}
 delay=outcomes.some(x=>x.detail==='HTTP 429'||x.detail==='HTTP 503')?30000:5000;
 }
 }
 }
 }
 }catch(e){console.error('FMIC audit worker',e);delay=30000;await getDbPool().query('UPDATE rpm_fmic_audit_control SET last_error=$1 WHERE id=1',[String(e).slice(0,300)]).catch(()=>{})}
 finally{if(client){if(locked)await client.query('SELECT pg_advisory_unlock(27391,2)').catch(()=>{});client.release()}}
 await sleep(delay);
 }
 })().catch(e=>{runtime.rpmAuditLoop=false;console.error('FMIC audit loop stopped',e)});
}
