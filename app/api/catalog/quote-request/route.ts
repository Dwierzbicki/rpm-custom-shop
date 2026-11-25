import {NextResponse} from 'next/server';
import {getDbPool} from '../../../lib/db';
import {ensureFmicRequests} from '../../../lib/fmic-quote-requests';
import {visibleCatalog} from '../../../lib/fmic-category-membership';
import {isValidIdempotencyKey,orderRequestHash} from '../../../lib/order-idempotency';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers});
const clean=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length<=max?v.trim():null;
export async function POST(request:Request){
 try{
  // Keep this workflow behind the current test-store gate until public sales terms are ready.
  if(process.env.SITE_LOCK_ENABLED!=='1')return fail('NOT_ENABLED',503);
  const origin=request.headers.get('origin');
  if(!origin||new URL(origin).host!==request.headers.get('host'))return fail('ORIGIN',403);
  if(!(request.headers.get('content-type')??'').includes('application/json'))return fail('INVALID',415);
  const raw=await request.text();if(raw.length>16000)return fail('INVALID',413);
  const b=JSON.parse(raw);const key=request.headers.get('Idempotency-Key');
  if(!isValidIdempotencyKey(key))return fail('INVALID',400);
  const name=clean(b?.name,120),email=clean(b?.email,200),postalCode=clean(b?.postalCode,20),notes=clean(b?.notes,1000);
  if(!name||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||postalCode===null||notes===null||b?.consent!==true)return fail('INVALID',400);
  if(!Array.isArray(b.lines)||b.lines.length<1||b.lines.length>30)return fail('INVALID',400);
  const lines:{sku:string;qty:number;price:number}[]=[];const seen=new Set<string>();
  for(const l of b.lines){if(!l||typeof l.sku!=='string'||!l.sku||l.sku.length>120||seen.has(l.sku)||!Number.isSafeInteger(l.qty)||l.qty<1||l.qty>50||typeof l.price!=='number'||!Number.isFinite(l.price)||l.price<=0)return fail('INVALID',400);seen.add(l.sku);lines.push({sku:l.sku,qty:l.qty,price:l.price})}
  const customer={name,email,postalCode,notes,language:b.language==='en'?'en':'pl',consent:true};
  const hash=orderRequestHash({customer,lines});await ensureFmicRequests();const db=getDbPool();
  const replay=async()=>{const old=await db.query('SELECT id::text,request_hash,estimated_subtotal::float8 AS subtotal FROM rpm_fmic_quote_requests WHERE request_key=$1',[key]);if(!old.rows[0])return null;return old.rows[0].request_hash===hash?NextResponse.json({id:old.rows[0].id,subtotal:old.rows[0].subtotal},{headers}):fail('CONFLICT',409)};
  const existing=await replay();if(existing)return existing;
  const found=await db.query('SELECT sku,name,available,proposed_gross,updated_at FROM rpm_fmic_catalog WHERE sku=ANY($1::text[]) AND '+visibleCatalog,[lines.map(l=>l.sku)]);
  const map=new Map(found.rows.map(r=>[r.sku,r]));const items=[];
  for(const l of lines){const p=map.get(l.sku);if(!p||!p.available||Number(p.proposed_gross)!==l.price)return fail('CATALOG_CHANGED',409);items.push({sku:l.sku,name:p.name,qty:l.qty,unitPrice:Number(p.proposed_gross),catalogUpdatedAt:p.updated_at})}
  const subtotal=Math.round(items.reduce((sum,l)=>sum+l.qty*l.unitPrice,0)*100)/100;
  const inserted=await db.query('INSERT INTO rpm_fmic_quote_requests(request_key,request_hash,customer,items,estimated_subtotal) VALUES($1,$2,$3::jsonb,$4::jsonb,$5) ON CONFLICT(request_key) DO NOTHING RETURNING id::text',[key,hash,JSON.stringify(customer),JSON.stringify(items),subtotal]);
  if(!inserted.rowCount)return (await replay())??fail('CONFLICT',409);
  return NextResponse.json({id:inserted.rows[0].id,subtotal},{status:201,headers});
 }catch(e){console.error('FMIC quote request failed',e instanceof Error?e.name:'unknown');return fail('FAILED',503)}
}
