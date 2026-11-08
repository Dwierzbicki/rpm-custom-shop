import {getDbPool} from './db';
import type {SupplierOffer} from './supplier-matching';
async function setup(){await getDbPool().query('CREATE TABLE IF NOT EXISTS rpm_supplier_offers (id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, supplier TEXT NOT NULL, supplier_sku TEXT NOT NULL, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(supplier,supplier_sku))');}
export async function getOffers():Promise<SupplierOffer[]>{await setup();const r=await getDbPool().query<{id:number;data:Omit<SupplierOffer,'id'>}>('SELECT id,data FROM rpm_supplier_offers ORDER BY id DESC LIMIT 1000');return r.rows.map(x=>({...x.data,id:x.id}));}
export async function saveOffer(value:Omit<SupplierOffer,'id'>){await setup();const r=await getDbPool().query<{id:number}>('INSERT INTO rpm_supplier_offers(supplier,supplier_sku,data) VALUES($1,$2,$3::jsonb) ON CONFLICT(supplier,supplier_sku) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW() RETURNING id',[value.supplier,value.supplierSku,JSON.stringify(value)]);return r.rows[0].id;}
export async function removeOffer(id:number){await setup();await getDbPool().query('DELETE FROM rpm_supplier_offers WHERE id=$1',[id]);}

/**
 * Feed imports are staged against the supplier offers table, never the public
 * product catalog. A short table lock makes the compare+write phase atomic
 * against any manual edits and concurrent feed imports.
 */
export async function getOffersForSupplierSkus(supplier:string,skus:string[]):Promise<SupplierOffer[]>{
 await setup();
 if(!skus.length)return [];
 const result=await getDbPool().query<{id:number;data:Omit<SupplierOffer,'id'>}>(
  'SELECT id,data FROM rpm_supplier_offers WHERE supplier=$1 AND UPPER(supplier_sku)=ANY($2::text[])',
  [supplier,skus.map(s=>s.toUpperCase())]
 );
 return result.rows.map(row=>({...row.data,id:row.id}));
}
export class FeedImportConflict extends Error{}
export class FeedImportInvalid extends Error{}

export async function commitSupplierFeed(
 preview:import('../../src/lib/supplier-csv-preview').SupplierCsvPreview,
 options:import('./supplier-feed').SupplierFeedOptions,
 expectedFingerprint:string
){
 const {planSupplierFeed}=await import('./supplier-feed');
 await setup();
 await getDbPool().query(`CREATE TABLE IF NOT EXISTS rpm_supplier_feed_imports (
  id BIGSERIAL PRIMARY KEY,
  supplier TEXT NOT NULL,
  fingerprint TEXT NOT NULL UNIQUE,
  row_count INTEGER NOT NULL,
  created_count INTEGER NOT NULL,
  updated_count INTEGER NOT NULL,
  unchanged_count INTEGER NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 )`);
 const pool=getDbPool(),client=await pool.connect();
 try{
  await client.query('BEGIN');
  await client.query('LOCK TABLE rpm_supplier_offers IN SHARE ROW EXCLUSIVE MODE');
  const keys=preview.rows.map(r=>r.sku.trim().toUpperCase()).filter(Boolean);
  const current=keys.length?await client.query<{id:number;data:Omit<SupplierOffer,'id'>}>(
   'SELECT id,data FROM rpm_supplier_offers WHERE supplier=$1 AND UPPER(supplier_sku)=ANY($2::text[])',
   [options.supplier,keys]
  ):{rows:[]};
  const existing=current.rows.map(row=>({...row.data,id:row.id}));
  const plan=planSupplierFeed(preview,existing,options);
  if(!plan.canImport)throw new FeedImportInvalid(plan.issues[0]?.message??'Nieprawidłowy feed lub brak potwierdzenia cen netto');
  if(plan.fingerprint!==expectedFingerprint)throw new FeedImportConflict('Oferty dostawcy zmieniły się od podglądu — odśwież podgląd');
  if(plan.changes.length){
   const payload=JSON.stringify(plan.changes);
   await client.query(`INSERT INTO rpm_supplier_offers(supplier,supplier_sku,data)
    SELECT $1, element.value->>'supplierSku', element.value
    FROM jsonb_array_elements($2::jsonb) AS element(value)
    ON CONFLICT (supplier,supplier_sku)
    DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()`,[options.supplier,payload]);
  }
  const saved=await client.query<{id:string}>(`INSERT INTO rpm_supplier_feed_imports
   (supplier,fingerprint,row_count,created_count,updated_count,unchanged_count)
   VALUES($1,$2,$3,$4,$5,$6)
   ON CONFLICT(fingerprint) DO UPDATE SET fingerprint=EXCLUDED.fingerprint RETURNING id`,
   [options.supplier,plan.fingerprint,preview.rows.length,plan.counts.create,plan.counts.update,plan.counts.unchanged]);
  await client.query('COMMIT');
  return {importId:saved.rows[0].id,rows:preview.rows.length,...plan.counts};
 }catch(error){
  await client.query('ROLLBACK').catch(()=>{});
  throw error;
 }finally{client.release()}
}
