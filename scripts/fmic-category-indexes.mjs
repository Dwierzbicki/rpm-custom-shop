import pg from 'pg';
import {pathToFileURL} from 'node:url';
// Shared stainless components have two storefront paths, but one catalog row and SKU.
const steel="'Kolanka i rury nierdzewne'";
const roots="('Układ dolotowy','Układ wydechowy')";
const leaves="('Kolanka nierdzewne','Spawane kolanka nierdzewne','Rury nierdzewne','Redukcje nierdzewne')";
const welded="(mapping_status='parent_review' AND target_category=ARRAY['Układ dolotowy','Kolanka i rury nierdzewne']::text[] AND data->>'category_path'='Układ dolotowy > Kolanka i rury nierdzewne > Spawane kolanka nierdzewne welding porn')";
export const visibleCatalog="(mapping_status IN ('exact','normalized','manual') OR "+welded+")";
export const primaryCategory="(CASE WHEN "+welded+" THEN ARRAY['Układ dolotowy','Kolanka i rury nierdzewne','Spawane kolanka nierdzewne']::text[] ELSE target_category END)";
const shared="(("+primaryCategory+")[1] IN "+roots+" AND ("+primaryCategory+")[2]="+steel+" AND ("+primaryCategory+")[3] IN "+leaves+" AND cardinality("+primaryCategory+")=3)";
export const alternateCategory="(CASE WHEN "+shared+" THEN ARRAY[CASE WHEN ("+primaryCategory+")[1]='Układ dolotowy' THEN 'Układ wydechowy' ELSE 'Układ dolotowy' END,("+primaryCategory+")[2],("+primaryCategory+")[3]]::text[] END)";

export const listingRoot="(target_category[1])";
export const indexes=[
 ['rpm_fmic_root_available_sku_v1','USING btree ('+listingRoot+', available DESC, sku ASC)'],
 ['rpm_fmic_root_price_asc_v1','USING btree ('+listingRoot+', proposed_gross ASC, sku ASC)'],
 ['rpm_fmic_root_price_desc_v1','USING btree ('+listingRoot+', proposed_gross DESC, sku ASC)'],
 ['rpm_fmic_primary_category_gin_v1','USING gin (('+primaryCategory+'))'],
 ['rpm_fmic_alternate_category_gin_v1','USING gin (('+alternateCategory+'))'],
 ['rpm_fmic_visible_price_asc_v1','USING btree (proposed_gross ASC, sku ASC)']
];
async function run(){
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='require'?{rejectUnauthorized:true}:undefined});
 const db=await pool.connect();
 try{
  await db.query("SET lock_timeout='10s'");
  await db.query("SET statement_timeout='15min'");
  if(!(await db.query('SELECT pg_try_advisory_lock(27391,12) AS acquired')).rows[0].acquired)throw Error('Index migration already running');
  for(const [name,definition] of indexes){
   const status=()=>db.query("SELECT indisvalid,indisready FROM pg_index WHERE indexrelid=to_regclass('public.'||$1)",[name]);
   const before=(await status()).rows[0];
   if(before&&!before.indisvalid)await db.query('DROP INDEX CONCURRENTLY IF EXISTS public.'+name);
   await db.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS '+name+' ON public.rpm_fmic_catalog '+definition+' WHERE '+visibleCatalog);
   const after=(await status()).rows[0];
   if(!after?.indisvalid||!after?.indisready)throw Error('Index not valid: '+name);
   console.log(name+' ready');
  }
  await db.query('ANALYZE public.rpm_fmic_catalog');
  console.log('FMIC category and price indexes ready');
 }finally{db.release(true);await pool.end()}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await run();
