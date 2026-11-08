import {getDbPool} from './db';
import {DEFAULT_PRICING_RULES,validPricingRules} from './supplier-pricing';
import type {SupplierOffer} from './supplier-matching';
import {planProcurement} from './procurement-plan';
import type {ProcurementOrder,ProcurementPlan} from './procurement-plan';
import type {PoolClient} from 'pg';

export type ProcurementStatus='draft'|'approved'|'placed_manually';
export type ProcurementRecord={
 id:string;orderId:string;status:ProcurementStatus;fingerprint:string;
 plan:ProcurementPlan;manualReference:string|null;
 createdAt:string;updatedAt:string;approvedAt:string|null;placedAt:string|null;
};
export class ProcurementInvalid extends Error{}
export class ProcurementConflict extends Error{}
export class ProcurementNotFound extends Error{}
let schema:Promise<void>|undefined;
async function ensure(){
 schema??=(async()=>{
  const db=getDbPool();
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_orders
   (id BIGSERIAL PRIMARY KEY,customer JSONB NOT NULL,items JSONB NOT NULL,
    total NUMERIC(12,2) NOT NULL,status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_supplier_offers
   (id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,supplier TEXT NOT NULL,
    supplier_sku TEXT NOT NULL,data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(supplier,supplier_sku))`);
  await db.query(`CREATE INDEX IF NOT EXISTS rpm_supplier_product_id_idx
   ON rpm_supplier_offers ((data->>'productId'))`);
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_shop_settings
   (key TEXT PRIMARY KEY,data JSONB NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_supplier_procurements (
   id BIGSERIAL PRIMARY KEY,order_id BIGINT NOT NULL UNIQUE REFERENCES rpm_orders(id),
   status TEXT NOT NULL CHECK(status IN ('draft','approved','placed_manually')),
   fingerprint TEXT NOT NULL,plan JSONB NOT NULL,
   manual_reference TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   approved_at TIMESTAMPTZ,placed_at TIMESTAMPTZ
  )`);
 })();
 try{await schema}catch(e){schema=undefined;throw e}
}
const recordSelect=`SELECT id::text AS "id", order_id::text AS "orderId",status,fingerprint,plan,
 manual_reference AS "manualReference",created_at AS "createdAt",
 updated_at AS "updatedAt",approved_at AS "approvedAt",placed_at AS "placedAt"
 FROM rpm_supplier_procurements WHERE order_id=$1`;
async function currentRecord(db:PoolClient,orderId:string){
 const result=await db.query<ProcurementRecord>(recordSelect+' FOR UPDATE',[orderId]);
 return result.rows[0]??null;
}
async function readCurrentPlan(db:PoolClient,orderId:string,lock:boolean):Promise<ProcurementPlan>{
 const order=await db.query<ProcurementOrder>(
  'SELECT id::text, status,total::float8 AS total,items FROM rpm_orders WHERE id=$1'+(lock?' FOR UPDATE':''),
  [orderId]
 );
 if(!order.rows[0])throw new ProcurementNotFound('Nie znaleziono zamówienia');
 if(!Array.isArray(order.rows[0].items))throw new ProcurementInvalid('Niepoprawna lista produktów zamówienia');
 const ids=[...new Set(order.rows[0].items.map(item=>item.productId))].filter(Number.isSafeInteger);
 const offers=ids.length?await db.query<{id:number;data:Omit<SupplierOffer,'id'>}>(
  `SELECT id,data FROM rpm_supplier_offers WHERE data->>'productId'=ANY($1::text[])`,
  [ids.map(String)]
 ):{rows:[]};
 const prices=await db.query<{data:unknown}>(`SELECT data FROM rpm_shop_settings WHERE key='supplier_pricing'`);
 const rules=validPricingRules(prices.rows[0]?.data)?prices.rows[0].data:DEFAULT_PRICING_RULES;
 return planProcurement(order.rows[0],offers.rows.map(o=>({...o.data,id:o.id})),rules.maxLeadDays);
}
function validateFingerprint(value:string){if(!/^[a-f0-9]{64}$/.test(value))throw new ProcurementInvalid('Nieprawidłowa wersja podglądu')}
function ensureReady(plan:ProcurementPlan){
 if(!plan.canDraft)throw new ProcurementInvalid(
  plan.counts.blocked?'Zamówienie ma pozycje bez dostępnej, zatwierdzonej oferty dostawcy':
  'Zamówienie musi mieć status Potwierdzone lub W realizacji'
 );
}

export async function readProcurement(orderId:string){
 await ensure();
 const pool=getDbPool();
 const client=await pool.connect();
 try{
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const plan=await readCurrentPlan(client,orderId,false);
  const existing=await client.query<ProcurementRecord>(recordSelect,[orderId]);
  await client.query('COMMIT');
  return {plan,procurement:existing.rows[0]??null};
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
 finally{client.release()}
}

export async function saveProcurementDraft(orderId:string,expectedFingerprint:string){
 validateFingerprint(expectedFingerprint);
 await ensure();
 const client=await getDbPool().connect();
 try{
  await client.query('BEGIN');
  await client.query('LOCK TABLE rpm_supplier_offers IN SHARE MODE');
  await client.query('LOCK TABLE rpm_shop_settings IN SHARE MODE');
  const plan=await readCurrentPlan(client,orderId,true);
  ensureReady(plan);
  if(plan.fingerprint!==expectedFingerprint)throw new ProcurementConflict('Oferty lub zamówienie zmieniły się. Odśwież podgląd');
  const result=await client.query<ProcurementRecord>(`
   INSERT INTO rpm_supplier_procurements(order_id,status,fingerprint,plan)
   VALUES($1,'draft',$2,$3::jsonb)
   ON CONFLICT(order_id) DO UPDATE SET
    fingerprint=EXCLUDED.fingerprint,plan=EXCLUDED.plan,updated_at=NOW()
   WHERE rpm_supplier_procurements.status='draft'
   RETURNING id::text AS id, order_id::text AS "orderId",status,fingerprint,plan,
    manual_reference AS "manualReference",created_at AS "createdAt",
    updated_at AS "updatedAt",approved_at AS "approvedAt",placed_at AS "placedAt"`,
   [orderId,plan.fingerprint,JSON.stringify(plan)]);
  if(!result.rows[0])throw new ProcurementConflict('Zakup został już zatwierdzony. Nie tworzę duplikatu.');
  await client.query('COMMIT');
  return result.rows[0];
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
 finally{client.release()}
}

export async function changeProcurement(
 orderId:string,
 operation:'approve'|'recheck'|'mark_placed',
 expectedFingerprint:string,
 confirmations:{stock?:boolean;price?:boolean;variants?:boolean;manualOnly?:boolean;manualPlaced?:boolean},
 reference?:string
){
 validateFingerprint(expectedFingerprint);
 await ensure();
 const client=await getDbPool().connect();
 try{
  await client.query('BEGIN');
  await client.query('LOCK TABLE rpm_supplier_offers IN SHARE MODE');
  await client.query('LOCK TABLE rpm_shop_settings IN SHARE MODE');
  const plan=await readCurrentPlan(client,orderId,true);
  const existing=await currentRecord(client,orderId);
  if(!existing)throw new ProcurementNotFound('Brak zapisanego szkicu. Przygotuj go ponownie.');
  if(existing.fingerprint!==expectedFingerprint)throw new ProcurementConflict('Szkic zmienił się. Odśwież widok');
  if(operation==='recheck'){
   if(existing.status!=='approved')throw new ProcurementConflict('Ponowna kontrola jest możliwa tylko dla zatwierdzonego, niewysłanego szkicu');
   ensureReady(plan);
   const revised=await client.query<ProcurementRecord>(`UPDATE rpm_supplier_procurements
    SET status='draft',fingerprint=$2,plan=$3::jsonb,approved_at=NULL,updated_at=NOW()
    WHERE order_id=$1 RETURNING id::text AS id,order_id::text AS "orderId",
    status,fingerprint,plan,manual_reference AS "manualReference",created_at AS "createdAt",
    updated_at AS "updatedAt",approved_at AS "approvedAt",placed_at AS "placedAt"`,
    [orderId,plan.fingerprint,JSON.stringify(plan)]);
   await client.query('COMMIT');return revised.rows[0];
  }
  if(plan.fingerprint!==existing.fingerprint)throw new ProcurementConflict(
   'Cena, dostępność, konfiguracja lub status zmieniły się po zatwierdzeniu. Wymagany ponowny przegląd.'
  );
  ensureReady(plan);
  if(operation==='approve'){
   if(existing.status!=='draft')throw new ProcurementConflict('Ten zakup został już zatwierdzony');
   if(confirmations.stock!==true||confirmations.price!==true||confirmations.variants!==true||confirmations.manualOnly!==true)
    throw new ProcurementInvalid('Potwierdź ilości, cenę, warianty i brak automatycznego zamówienia');
   await client.query(`UPDATE rpm_supplier_procurements SET status='approved',approved_at=NOW(),updated_at=NOW()
    WHERE order_id=$1 AND status='draft'`,[orderId]);
  }else{
   if(operation!=='mark_placed'||existing.status!=='approved')
    throw new ProcurementConflict('Najpierw zatwierdź szkic. Zamówienie nie zostało wysłane automatycznie.');
   if(confirmations.manualPlaced!==true||typeof reference!=='string'||reference.trim().length<5||reference.trim().length>300)
    throw new ProcurementInvalid('Potwierdź ręczne złożenie zamówienia i podaj jego numer(y) referencyjne');
   await client.query(`UPDATE rpm_supplier_procurements SET status='placed_manually',
    manual_reference=$2,placed_at=NOW(),updated_at=NOW() WHERE order_id=$1 AND status='approved'`,
    [orderId,reference.trim()]);
  }
  const updated=await currentRecord(client,orderId);
  await client.query('COMMIT');
  return updated;
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
 finally{client.release()}
}
