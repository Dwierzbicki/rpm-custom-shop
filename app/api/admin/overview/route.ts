import {NextResponse} from 'next/server';
import {getDbPool} from '../../../lib/db';
import {visibleCatalog} from '../../../lib/fmic-category-membership';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
type Row=Record<string,unknown>;
async function readSummary(){
 const client=await getDbPool().connect();
 try{
  await client.query('BEGIN READ ONLY');
  await client.query("SET LOCAL statement_timeout='5s'");
  const tables=['rpm_fmic_catalog','rpm_fmic_image_audit','rpm_fmic_audit_control','rpm_fmic_enrichment','rpm_fmic_product_descriptions','rpm_fmic_description_queue','rpm_fmic_description_control','rpm_verified_product_data','rpm_fmic_quote_requests','rpm_orders'];
  const present=new Set((await client.query<{name:string}>('SELECT name FROM unnest($1::text[]) AS name WHERE to_regclass(name) IS NOT NULL',[tables])).rows.map(r=>r.name));
  const one=async(table:string,sql:string):Promise<Row|null>=>present.has(table)?(await client.query(sql)).rows[0]??null:null;
  const counts=async(table:string)=>present.has(table)?Object.fromEntries((await client.query<{status:string;total:number}>('SELECT status,count(*)::int AS total FROM '+table+' GROUP BY status')).rows.map(r=>[r.status,r.total])):null;
  const catalog=await one('rpm_fmic_catalog',"SELECT count(*)::int AS total,count(*) FILTER (WHERE "+visibleCatalog+")::int AS visible,count(*) FILTER (WHERE available AND "+visibleCatalog+")::int AS available,max(updated_at) AS updated_at FROM rpm_fmic_catalog");
  const images=await counts('rpm_fmic_image_audit');
  const imageControl=await one('rpm_fmic_audit_control','SELECT enabled,heartbeat,last_error FROM rpm_fmic_audit_control WHERE id=1');
  const descriptions=await one('rpm_fmic_enrichment',"SELECT count(*)::int AS fetched,count(*) FILTER (WHERE fetched_at<NOW()-interval '30 days')::int AS stale,max(fetched_at) AS latest FROM rpm_fmic_enrichment");
  const published=await one('rpm_fmic_product_descriptions',"SELECT count(*) FILTER (WHERE description<>'')::int AS assigned,count(*) FILTER (WHERE published AND description<>'')::int AS published FROM rpm_fmic_product_descriptions");
  const descriptionQueue=await counts('rpm_fmic_description_queue');
  const descriptionControl=await one('rpm_fmic_description_control','SELECT enabled,heartbeat,last_error,next_request_at FROM rpm_fmic_description_control WHERE id=1');
  const verified=await one('rpm_verified_product_data',"SELECT count(*) FILTER (WHERE v.status='verified' AND c.name=v.catalog_name)::int AS total FROM rpm_verified_product_data v JOIN rpm_fmic_catalog c USING(sku)");
  const quotes=await counts('rpm_fmic_quote_requests');
  const orders=await counts('rpm_orders');
  await client.query('COMMIT');
  return {catalog,images,imageControl,descriptions,published,descriptionQueue,descriptionControl,verified,quotes,orders,checkedAt:new Date().toISOString(),descriptionAllowed:process.env.FMIC_ENRICHMENT_ALLOWED==='1'};
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
}
let cached:Awaited<ReturnType<typeof readSummary>>|undefined,expires=0,inFlight:ReturnType<typeof readSummary>|undefined;
export async function GET(){
 try{
  if(!cached||Date.now()>=expires){inFlight??=readSummary().then(r=>{cached=r;expires=Date.now()+30000;return r}).finally(()=>{inFlight=undefined});await inFlight}
  return NextResponse.json(cached,{headers});
 }catch(e){console.error('Admin summary read failed',e);return NextResponse.json({error:'Nie udało się odczytać pulpitu'},{status:503,headers})}
}
