import {canRunFmicWorker} from './fmic-worker-mode';
import {parseProductTechnical} from './fmic-technical';
import {getDbPool} from './db';
import {refreshSupplierDescription} from './fmic-description-refresh';
import {setupEnrichment,inspectProduct} from './fmic-enrichment';
let setup:Promise<unknown>|undefined;
export async function setupDescriptionQueue(){
 if(!setup)setup=(async()=>{await setupEnrichment();return getDbPool().query(`CREATE TABLE IF NOT EXISTS rpm_fmic_description_queue (
 sku text PRIMARY KEY REFERENCES rpm_fmic_catalog(sku) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending', detail text, updated_at timestamptz NOT NULL DEFAULT NOW()
 ); CREATE INDEX IF NOT EXISTS rpm_fmic_description_queue_status_idx ON rpm_fmic_description_queue(status,sku);
 CREATE TABLE IF NOT EXISTS rpm_fmic_description_control (
 id integer PRIMARY KEY CHECK(id=1), enabled boolean NOT NULL DEFAULT false, heartbeat timestamptz, last_error text, next_request_at timestamptz
 ); ALTER TABLE rpm_fmic_description_control ADD COLUMN IF NOT EXISTS manual_until timestamptz; INSERT INTO rpm_fmic_description_control(id) VALUES(1) ON CONFLICT DO NOTHING;`)})().catch(e=>{setup=undefined;throw e});
 await setup;
}
export async function seedDescriptionQueue(){
 await setupDescriptionQueue();
 const result=await getDbPool().query("INSERT INTO rpm_fmic_description_queue(sku) SELECT c.sku FROM rpm_fmic_catalog c WHERE NOT EXISTS (SELECT 1 FROM rpm_fmic_product_descriptions d WHERE d.sku=c.sku AND d.description<>'') ON CONFLICT DO NOTHING");
 return result.rowCount??0;
}
export async function assignDraft(sku:string){
 const db=getDbPool();
 const source=(await db.query("SELECT c.name,c.target_category,e.data->>'description' AS description FROM rpm_fmic_catalog c JOIN rpm_fmic_enrichment e ON e.sku=c.sku WHERE c.sku=$1",[sku])).rows[0];
 if(!source?.description?.trim())return false;
 const technical=parseProductTechnical(source.name,source.description.trim(),source.target_category??[],sku);
 const result=await db.query(`INSERT INTO rpm_fmic_product_descriptions(sku,description,brand,published,technical)
 SELECT sku,trim(data->>'description'),left(COALESCE(data->>'brand',''),200),false,$2::jsonb FROM rpm_fmic_enrichment
 WHERE sku=$1 AND NULLIF(trim(data->>'description'),'') IS NOT NULL
 ON CONFLICT(sku) DO NOTHING RETURNING sku`,[sku,JSON.stringify(technical)]);
 return !!result.rowCount;
}
const g=globalThis as typeof globalThis & {rpmDescriptionLoop?:boolean;rpmDescriptionStop?:boolean;rpmDescriptionTask?:Promise<void>};
export function startDescriptionWorker(){
 if(g.rpmDescriptionLoop||!canRunFmicWorker()||process.env.FMIC_ENRICHMENT_ALLOWED!=='1')return;
 g.rpmDescriptionLoop=true;
 g.rpmDescriptionStop=false;
 g.rpmDescriptionTask=(async()=>{
 while(!g.rpmDescriptionStop){
 let client:import('pg').PoolClient|undefined,locked=false;
 try{
 await setupDescriptionQueue();const db=getDbPool();
 const control=await db.query('SELECT enabled FROM rpm_fmic_description_control WHERE id=1 AND (manual_until IS NULL OR manual_until<=NOW()) AND (next_request_at IS NULL OR next_request_at<=NOW())');
 if(control.rows[0]?.enabled&&process.memoryUsage().rss<320*1024*1024){
 client=await db.connect();
 const lock=await client.query('SELECT pg_try_advisory_lock(27391,3) AS acquired');locked=lock.rows[0].acquired;
 if(locked){
 const state=await client.query('SELECT enabled FROM rpm_fmic_description_control WHERE id=1 AND (manual_until IS NULL OR manual_until<=NOW()) AND (next_request_at IS NULL OR next_request_at<=NOW())');
 if(state.rows[0]?.enabled){
 await client.query('UPDATE rpm_fmic_description_control SET heartbeat=NOW() WHERE id=1');
 const refresh=(await client.query("SELECT e.sku FROM rpm_fmic_enrichment e LEFT JOIN rpm_fmic_description_queue q ON q.sku=e.sku WHERE e.fetched_at<NOW()-interval '30 days' AND (q.updated_at IS NULL OR q.updated_at<NOW()-interval '1 day') ORDER BY e.fetched_at,e.sku LIMIT 1")).rows[0];
 if(refresh){
  await client.query("UPDATE rpm_fmic_description_control SET next_request_at=NOW()+interval '30 seconds' WHERE id=1");
  try{await refreshSupplierDescription(refresh.sku);await client.query('UPDATE rpm_fmic_description_control SET heartbeat=NOW(),last_error=NULL WHERE id=1')}
  catch(e){const msg=String(e).slice(0,400);if(/HTTP (403|429|503)/.test(msg)){await client.query('UPDATE rpm_fmic_description_control SET enabled=false,last_error=$1 WHERE id=1',[msg])}else{await client.query("INSERT INTO rpm_fmic_description_queue(sku,status,detail,updated_at) VALUES($1,'review',$2,NOW()) ON CONFLICT(sku) DO UPDATE SET status='review',detail=EXCLUDED.detail,updated_at=NOW()",[refresh.sku,msg]);await client.query('UPDATE rpm_fmic_description_control SET last_error=$1 WHERE id=1',[msg])}}
 }else{
 const row=(await client.query("SELECT q.sku,EXISTS(SELECT 1 FROM rpm_fmic_enrichment e WHERE e.sku=q.sku) AS fetched,EXISTS(SELECT 1 FROM rpm_fmic_product_descriptions d WHERE d.sku=q.sku) AS assigned FROM rpm_fmic_description_queue q WHERE status='pending' ORDER BY sku LIMIT 1")).rows[0];
 if(!row)await client.query("UPDATE rpm_fmic_description_control SET next_request_at=NOW()+interval '1 hour' WHERE id=1");
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
 }
 }catch(e){console.error('FMIC description worker',e)}
 finally{if(client){if(locked)await client.query('SELECT pg_advisory_unlock(27391,3)').catch(()=>{});client.release()}}
 if(!g.rpmDescriptionStop)await new Promise(r=>setTimeout(r,5000));
 }
 })().catch(e=>{console.error('FMIC description loop stopped',e)}).finally(()=>{g.rpmDescriptionLoop=false;g.rpmDescriptionTask=undefined});
}
export async function stopDescriptionWorker(){g.rpmDescriptionStop=true;await g.rpmDescriptionTask}

