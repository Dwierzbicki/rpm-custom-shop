import {getDbPool} from './db';
import {setupEnrichment,inspectProduct} from './fmic-enrichment';
let setup:Promise<unknown>|undefined;
export async function setupDescriptionQueue(){
 await setupEnrichment();
 if(!setup)setup=getDbPool().query(`CREATE TABLE IF NOT EXISTS rpm_fmic_description_queue (
 sku text PRIMARY KEY REFERENCES rpm_fmic_catalog(sku) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending', detail text, updated_at timestamptz NOT NULL DEFAULT NOW()
 ); CREATE INDEX IF NOT EXISTS rpm_fmic_description_queue_status_idx ON rpm_fmic_description_queue(status,sku);
 CREATE TABLE IF NOT EXISTS rpm_fmic_description_control (
 id integer PRIMARY KEY CHECK(id=1), enabled boolean NOT NULL DEFAULT false, heartbeat timestamptz, last_error text, next_request_at timestamptz
 ); INSERT INTO rpm_fmic_description_control(id) VALUES(1) ON CONFLICT DO NOTHING;`).catch(e=>{setup=undefined;throw e});
 await setup;
}
export async function seedDescriptionQueue(){
 await setupDescriptionQueue();
 const result=await getDbPool().query("INSERT INTO rpm_fmic_description_queue(sku) SELECT c.sku FROM rpm_fmic_catalog c WHERE NOT EXISTS (SELECT 1 FROM rpm_fmic_product_descriptions d WHERE d.sku=c.sku AND d.description<>'') ON CONFLICT DO NOTHING");
 return result.rowCount??0;
}
export async function assignDraft(sku:string){
 const db=getDbPool();
 const result=await db.query(`INSERT INTO rpm_fmic_product_descriptions(sku,description,brand,published)
 SELECT sku,trim(data->>'description'),left(COALESCE(data->>'brand',''),200),false FROM rpm_fmic_enrichment
 WHERE sku=$1 AND NULLIF(trim(data->>'description'),'') IS NOT NULL
 ON CONFLICT(sku) DO NOTHING RETURNING sku`,[sku]);
 return !!result.rowCount;
}
const g=globalThis as typeof globalThis & {rpmDescriptionLoop?:boolean};
export function startDescriptionWorker(){
 if(g.rpmDescriptionLoop||process.env.FMIC_ENRICHMENT_ALLOWED!=='1')return;
 g.rpmDescriptionLoop=true;
 void (async()=>{
 for(;;){
 let client:import('pg').PoolClient|undefined,locked=false;
 try{
 await setupDescriptionQueue();const db=getDbPool();
 const control=await db.query('SELECT enabled FROM rpm_fmic_description_control WHERE id=1 AND (next_request_at IS NULL OR next_request_at<=NOW())');
 if(control.rows[0]?.enabled){
 client=await db.connect();
 const lock=await client.query('SELECT pg_try_advisory_lock(27391,3) AS acquired');locked=lock.rows[0].acquired;
 if(locked){
 const state=await client.query('SELECT enabled FROM rpm_fmic_description_control WHERE id=1 AND (next_request_at IS NULL OR next_request_at<=NOW())');
 if(state.rows[0]?.enabled){
 await client.query('UPDATE rpm_fmic_description_control SET heartbeat=NOW() WHERE id=1');
 const row=(await client.query("SELECT q.sku,EXISTS(SELECT 1 FROM rpm_fmic_enrichment e WHERE e.sku=q.sku) AS fetched,EXISTS(SELECT 1 FROM rpm_fmic_product_descriptions d WHERE d.sku=q.sku) AS assigned FROM rpm_fmic_description_queue q WHERE status='pending' ORDER BY sku LIMIT 1")).rows[0];
 if(!row)await client.query('UPDATE rpm_fmic_description_control SET enabled=false WHERE id=1');
 else {
 try{
 if(!row.assigned){
 if(!row.fetched){
 await client.query("UPDATE rpm_fmic_description_control SET next_request_at=NOW()+interval '30 seconds' WHERE id=1");
 await inspectProduct(row.sku);
 }
 await assignDraft(row.sku);
 }
 const exists=await client.query("SELECT 1 FROM rpm_fmic_product_descriptions WHERE sku=$1 AND description<>''",[row.sku]);
 await client.query("UPDATE rpm_fmic_description_queue SET status=$2,detail=$3,updated_at=NOW() WHERE sku=$1",[row.sku,exists.rowCount?'done':'review',exists.rowCount?null:'Brak opisu lub istniejący pusty szkic']);
 await client.query('UPDATE rpm_fmic_description_control SET heartbeat=NOW(),last_error=NULL WHERE id=1');
 }catch(e){
 const msg=String(e).slice(0,400);
 if(/HTTP (403|429|503)/.test(msg)){await client.query('UPDATE rpm_fmic_description_control SET enabled=false,last_error=$1 WHERE id=1',[msg]);}
 else{await client.query("UPDATE rpm_fmic_description_queue SET status='review',detail=$2,updated_at=NOW() WHERE sku=$1",[row.sku,msg]);await client.query('UPDATE rpm_fmic_description_control SET last_error=$1 WHERE id=1',[msg]);}
 }
 }
 }
 }
 }
 }catch(e){console.error('FMIC description worker',e)}
 finally{if(client){if(locked)await client.query('SELECT pg_advisory_unlock(27391,3)').catch(()=>{});client.release()}}
 await new Promise(r=>setTimeout(r,5000));
 }
 })().catch(e=>{g.rpmDescriptionLoop=false;console.error('FMIC description loop stopped',e)});
}
