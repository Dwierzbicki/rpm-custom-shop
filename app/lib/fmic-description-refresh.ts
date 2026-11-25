import {getDbPool} from './db';
import {inspectProduct} from './fmic-enrichment';
import {parseProductTechnical} from './fmic-technical';
const normalized=(v:unknown)=>typeof v==='string'?v.normalize('NFC').trim().replace(/\s+/g,' '):'';
export function sameRefreshIdentity(previous:Record<string,unknown>,next:Record<string,unknown>,sku:string,catalogName:string){
 return previous.sku===sku&&next.sku===sku&&!!normalized(previous.brand)&&!!normalized(previous.mpn)&&normalized(previous.brand)===normalized(next.brand)&&normalized(previous.mpn)===normalized(next.mpn)&&!!normalized(catalogName)&&normalized(previous.name)===normalized(catalogName)&&normalized(next.name)===normalized(catalogName);
}
export async function refreshSupplierDescription(sku:string){
 const db=getDbPool();
 const old=(await db.query("SELECT e.data,e.source_url,e.fetched_at,c.name,c.target_category,c.data->>'url' AS catalog_url FROM rpm_fmic_enrichment e JOIN rpm_fmic_catalog c USING(sku) WHERE e.sku=$1",[sku])).rows[0];
 if(!old)throw Error('Brak poprzedniego opisu');
 const next=await inspectProduct(sku,{persist:false});
 if(old.source_url!==next.source_url||old.catalog_url!==next.source_url||!sameRefreshIdentity(old.data,next.data,sku,old.name)||!next.data.description.trim())throw Error('Zmiana tożsamości produktu lub brak opisu — wymagana weryfikacja');
 const changed=old.data.description!==next.data.description||JSON.stringify(old.data.properties)!==JSON.stringify(next.data.properties);
 const technical=parseProductTechnical(old.name,next.data.description.trim(),old.target_category??[],sku);
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const updated=await client.query(`UPDATE rpm_fmic_enrichment e SET data=$2::jsonb,fetched_at=NOW() FROM rpm_fmic_catalog c
   WHERE e.sku=$1 AND c.sku=e.sku AND c.name=$3 AND c.data->>'url'=$4 AND e.fetched_at=$5 AND e.source_url=$4 RETURNING e.sku`,[sku,JSON.stringify(next.data),old.name,next.source_url,old.fetched_at]);
  if(!updated.rowCount)throw Error('Katalog zmienił się podczas odświeżania');
  // Only unedited, unpublished supplier drafts may be refreshed automatically.
  if(changed)await client.query("UPDATE rpm_fmic_product_descriptions SET description=$2,technical=$3::jsonb,updated_at=NOW() WHERE sku=$1 AND published=false AND description=$4 AND brand=$5",[sku,next.data.description.trim(),JSON.stringify(technical),String(old.data.description??'').trim(),String(old.data.brand??'').slice(0,200)]);
  const review=changed&&!!(await client.query("SELECT 1 FROM rpm_fmic_product_descriptions WHERE sku=$1 AND (published=true OR description<>$2 OR brand<>$3)",[sku,next.data.description.trim(),next.data.brand.slice(0,200)])).rowCount;
  // Preserve existing unresolved review states even if the source has not changed again.
  await client.query(`INSERT INTO rpm_fmic_description_queue(sku,status,detail,updated_at) VALUES($1,$2,$3,NOW())
   ON CONFLICT(sku) DO UPDATE SET status=CASE WHEN rpm_fmic_description_queue.status='review' THEN 'review' ELSE EXCLUDED.status END,
   detail=CASE WHEN rpm_fmic_description_queue.status='review' THEN rpm_fmic_description_queue.detail ELSE EXCLUDED.detail END,updated_at=NOW()`,[sku,review?'review':'done',review?'Zmieniony opis źródłowy — zatwierdź publikację':null]);
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
}
