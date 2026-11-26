import {getDbPool} from './db';
import {invalidateFmicSearchCache} from './fmic-search-performance';
import {variantCandidateSql,variantStatusSql} from './variant-sql';
import {variantBatchValidationSql} from './variant-batch-sql';
import {indexedListingVariantCtes,listingVariantCtes} from './listing-variants';
import {parseVariantReviewItems,type VariantReviewItem} from './variant-batch';
import type {VariantScope,VariantFilter,VariantDecision} from './variant-rules';
let setup:Promise<void>|undefined;
export function setupVariants():Promise<void>{
 if(!setup)setup=getDbPool().query(`CREATE TABLE IF NOT EXISTS rpm_variant_families (
 id text PRIMARY KEY,scope text NOT NULL,rule text NOT NULL,title text NOT NULL,category text[] NOT NULL,
 members jsonb NOT NULL,fingerprint text NOT NULL,present boolean NOT NULL DEFAULT true,
 decision text NOT NULL DEFAULT 'pending' CHECK(decision IN ('pending','approved','rejected')),
 reviewed_fingerprint text,reviewed_members jsonb,reviewed_at timestamptz,scanned_at timestamptz NOT NULL DEFAULT now()
 ); CREATE INDEX IF NOT EXISTS rpm_variant_families_scope_decision ON rpm_variant_families(scope,decision,id)`).then(()=>{}).catch((error:unknown)=>{setup=undefined;throw error});
 return setup;
}
export async function scanVariants(scope:VariantScope){
 await setupVariants();const c=await getDbPool().connect();
 try{
  await c.query('BEGIN');await c.query("SET LOCAL statement_timeout='25s'");await c.query("SET LOCAL lock_timeout='2s'");
  const feedLock=await c.query('SELECT pg_try_advisory_xact_lock(27391,1) AS ok');if(!feedLock.rows[0]?.ok)throw Error('Trwa import XML lub zmiana mapowania.');
 const lock=await c.query('SELECT pg_try_advisory_xact_lock(9382862) AS ok');if(!lock.rows[0]?.ok)throw Error('Trwa inna operacja wariantów.');
  // Full candidate detection once, incremental writes only; keep approved/rejected snapshots.
  const result=await c.query(`WITH candidates AS MATERIALIZED (${variantCandidateSql(scope)}),
 written AS (
 INSERT INTO rpm_variant_families(id,scope,rule,title,category,members,fingerprint)
 SELECT id,$1,rule,title,category,members,fingerprint FROM candidates
 ON CONFLICT(id) DO UPDATE SET rule=EXCLUDED.rule,title=EXCLUDED.title,category=EXCLUDED.category,members=EXCLUDED.members,fingerprint=EXCLUDED.fingerprint,present=true,scanned_at=now()
 WHERE NOT rpm_variant_families.present OR (rpm_variant_families.rule,rpm_variant_families.title,rpm_variant_families.category,rpm_variant_families.members,rpm_variant_families.fingerprint)
 IS DISTINCT FROM (EXCLUDED.rule,EXCLUDED.title,EXCLUDED.category,EXCLUDED.members,EXCLUDED.fingerprint)
 RETURNING id
 ), missing AS (
 UPDATE rpm_variant_families f SET present=false,scanned_at=now()
 WHERE scope=$1 AND present AND NOT EXISTS(SELECT 1 FROM candidates n WHERE n.id=f.id) RETURNING id
 ) SELECT (SELECT count(*)::int FROM candidates) AS groups,(SELECT count(*)::int FROM written) AS changed,(SELECT count(*)::int FROM missing) AS missing`,[scope]);
  await c.query("DELETE FROM rpm_variant_families WHERE scope=$1 AND NOT present AND decision='pending'",[scope]);
  await c.query('COMMIT');invalidateFmicSearchCache();return Number(result.rows[0].groups);
 }catch(error){await c.query('ROLLBACK');throw error}finally{c.release()}
}
export async function listVariants(scope:VariantScope,filter:VariantFilter,q:string,page:number,category:string[]=[],size=20){
 await setupVariants();const db=getDbPool();
 const where="scope=$1 AND ($2='' OR strpos(lower(title),lower($2))>0 OR EXISTS(SELECT 1 FROM jsonb_array_elements(members) m WHERE strpos(lower(m->>'sku'),lower($2))>0)) AND ($3='all' OR ("+variantStatusSql+")=$3) AND (cardinality($4::text[])=0 OR category[1:cardinality($4::text[])]=$4::text[])";
 const summary=await db.query(`SELECT (${variantStatusSql}) status,count(*)::int groups,COALESCE(sum(jsonb_array_length(members)) FILTER(WHERE present),0)::int skus,COALESCE(sum(jsonb_array_length(members)-1) FILTER(WHERE present),0)::int reduction,max(scanned_at) scanned_at FROM rpm_variant_families WHERE scope=$1 GROUP BY 1`,[scope]);
 const count=await db.query('SELECT count(*)::int total FROM rpm_variant_families WHERE '+where,[scope,q,filter,category]);
 const total:number=Number(count.rows[0].total);const current=Math.max(1,Math.min(page,Math.ceil(Number(total)/size)||1));
 const rows=await db.query(`SELECT id,scope,rule,title,category,members,fingerprint,reviewed_fingerprint,reviewed_members,(${variantStatusSql}) status,present,scanned_at,reviewed_at FROM rpm_variant_families WHERE ${where} ORDER BY title,id LIMIT $5 OFFSET $6`,[scope,q,filter,category,size,(current-1)*size]);
 const categoryRows=await db.query("SELECT DISTINCT category FROM rpm_variant_families WHERE scope=$1 AND present ORDER BY category",[scope]);
 const categories=[...new Map<string,string[]>(categoryRows.rows.flatMap(r=>(r.category as string[]).map((_,i)=>{const path=(r.category as string[]).slice(0,i+1);return [JSON.stringify(path),path] as [string,string[]]}))).values()];
 const ready=await db.query("SELECT to_regclass('rpm_variant_members_v1') IS NOT NULL AS ready");
 const active=await db.query(`WITH ${ready.rows[0]?.ready?indexedListingVariantCtes:listingVariantCtes}
 SELECT count(DISTINCT m.family_id)::int AS families,count(*)::int AS skus,(count(*)-count(DISTINCT m.family_id))::int AS reduction
 FROM variant_members m JOIN rpm_variant_families f ON f.id=m.family_id WHERE f.scope=$1`,[scope]);
 return {families:rows.rows,summary:summary.rows,total:Number(total),page:current,size,categories,active:active.rows[0]};
}
export async function reviewVariant(id:string,fingerprint:string,decision:VariantDecision){
 await setupVariants();const c=await getDbPool().connect();
 try{
  await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='2s'");
  const feedLock=await c.query('SELECT pg_try_advisory_xact_lock(27391,1) AS ok');if(!feedLock.rows[0]?.ok)throw Error('Trwa import XML lub zmiana mapowania.');
  const lock=await c.query('SELECT pg_try_advisory_xact_lock(9382862) AS ok');if(!lock.rows[0]?.ok)throw Error('Trwa skan. Spróbuj ponownie po zakończeniu.');
  // Do not accept browser-supplied membership or prices. Approve the exact reviewed snapshot.
  // Recheck identity against the live feed before approval; newly discovered members require a new scan.
  const result=await c.query(`UPDATE rpm_variant_families f SET decision=$3,reviewed_fingerprint=CASE WHEN $3='pending' THEN NULL ELSE fingerprint END,reviewed_members=CASE WHEN $3='pending' THEN NULL ELSE members END,reviewed_at=now()
   WHERE id=$1 AND fingerprint=$2 AND ($3='pending' OR present) AND ($3<>'approved' OR NOT EXISTS(
    SELECT 1 FROM jsonb_array_elements(f.members) m LEFT JOIN rpm_fmic_catalog p ON p.sku=m->>'sku'
    WHERE p.sku IS NULL OR jsonb_build_array(p.name,coalesce(p.data->>'brand',''),coalesce(p.data->>'mpn',''),coalesce(p.data->>'ean',''),p.target_category) IS DISTINCT FROM jsonb_build_array(m->>'name',m->>'brand',m->>'mpn',m->>'ean',m->'category')
    OR p.mapping_status NOT IN ('exact','normalized','manual')))
   RETURNING id`,[id,fingerprint,decision]);
  if(!result.rowCount){await c.query('ROLLBACK');return false}
  await c.query('COMMIT');invalidateFmicSearchCache();return true;
 }catch(error){await c.query('ROLLBACK');throw error}finally{c.release()}
}

/** Runs after successful XML commit, never rolls back the already committed feed. */
export async function syncVariantsAfterImport(){
 const results:Record<VariantScope,{ok:boolean;groups?:number}>={colors:{ok:false},hel:{ok:false}};
 for(const scope of ['colors','hel'] as const){
  try{results[scope]={ok:true,groups:await scanVariants(scope)}}catch(error){console.error('Variant sync failed for '+scope,error)}
 }
 return results;
}

/** All or nothing; only explicit pending snapshots, never approve by query/filter. */
export async function approveVariantBatch(scope:VariantScope,items:VariantReviewItem[]){
 if(!parseVariantReviewItems(items))throw Error('Invalid variant batch');
 await setupVariants();const c=await getDbPool().connect();
 try{
  await c.query('BEGIN');await c.query("SET LOCAL statement_timeout='25s'");await c.query("SET LOCAL lock_timeout='2s'");
  const feedLock=await c.query('SELECT pg_try_advisory_xact_lock(27391,1) AS ok');if(!feedLock.rows[0]?.ok)throw Error('Trwa import XML lub zmiana mapowania.');
  const lock=await c.query('SELECT pg_try_advisory_xact_lock(9382862) AS ok');if(!lock.rows[0]?.ok)throw Error('Trwa inna operacja wariantów.');
  // Require migration and enabled synchronization trigger for batch publishing.
  const ready=await c.query("SELECT to_regclass('rpm_variant_members_v1') IS NOT NULL AND EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='rpm_variant_families'::regclass AND tgname='rpm_variant_members_v1_sync' AND tgenabled IN ('O','A')) AS ok");
  if(!ready.rows[0]?.ok)throw Error('Indeks wariantów nieaktywny.');
  const checked=await c.query(variantBatchValidationSql(scope),[JSON.stringify(items),scope]);
  if(checked.rowCount!==items.length){
   const valid=new Set(checked.rows.map(r=>String(r.id)));
   await c.query('ROLLBACK');return {saved:false as const,conflicts:items.filter(i=>!valid.has(i.id)).map(i=>i.id)};
  }
  const updated=await c.query(`UPDATE rpm_variant_families f SET decision='approved',reviewed_fingerprint=f.fingerprint,reviewed_members=f.members,reviewed_at=now()
   FROM jsonb_to_recordset($1::jsonb) r(id text,fingerprint text)
   WHERE f.id=r.id AND f.fingerprint=r.fingerprint AND f.scope=$2 AND f.present AND f.decision='pending'
   RETURNING f.id`,[JSON.stringify(items),scope]);
  if(updated.rowCount!==items.length)throw Error('Variant batch changed during approval');
  const verified=await c.query(`SELECT count(*)::int AS members,count(DISTINCT family_id)::int AS families FROM rpm_variant_members_v1 WHERE family_id=ANY($1::text[])`,[items.map(i=>i.id)]);
  const skus=checked.rows.reduce((sum,r)=>sum+Number(r.skus),0);
  if(verified.rows[0]?.members!==skus||verified.rows[0]?.families!==items.length)throw Error('Variant membership sync mismatch');
  await c.query('COMMIT');invalidateFmicSearchCache();
  return {saved:true as const,groups:items.length,skus};
 }catch(error){await c.query('ROLLBACK').catch(()=>{});throw error}finally{c.release()}
}

/** Revert only unchanged, explicitly selected approved families; atomically remove derived membership. */
export async function revertVariantBatch(scope:VariantScope,items:VariantReviewItem[]){
 if(!parseVariantReviewItems(items))throw Error('Invalid variant batch');
 await setupVariants();const c=await getDbPool().connect();
 try{
  await c.query('BEGIN');await c.query("SET LOCAL statement_timeout='25s'");await c.query("SET LOCAL lock_timeout='2s'");
  const feedLock=await c.query('SELECT pg_try_advisory_xact_lock(27391,1) AS ok');if(!feedLock.rows[0]?.ok)throw Error('Trwa import XML lub zmiana mapowania.');
  const lock=await c.query('SELECT pg_try_advisory_xact_lock(9382862) AS ok');if(!lock.rows[0]?.ok)throw Error('Trwa inna operacja wariantów.');
  const ready=await c.query("SELECT to_regclass('rpm_variant_members_v1') IS NOT NULL AND EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='rpm_variant_families'::regclass AND tgname='rpm_variant_members_v1_sync' AND tgenabled IN ('O','A')) AS ok");
  if(!ready.rows[0]?.ok)throw Error('Indeks wariantów nieaktywny.');
  const result=await c.query(`UPDATE rpm_variant_families f SET decision='pending',reviewed_fingerprint=NULL,reviewed_members=NULL,reviewed_at=now()
   FROM jsonb_to_recordset($1::jsonb) r(id text,fingerprint text)
   WHERE f.id=r.id AND f.scope=$2 AND f.present AND f.decision='approved' AND f.fingerprint=r.fingerprint AND f.reviewed_fingerprint=r.fingerprint
   RETURNING f.id,jsonb_array_length(f.members)::int AS skus`,[JSON.stringify(items),scope]);
  if(result.rowCount!==items.length){await c.query('ROLLBACK');return {saved:false as const}}
  const remaining=await c.query('SELECT count(*)::int AS n FROM rpm_variant_members_v1 WHERE family_id=ANY($1::text[])',[items.map(i=>i.id)]);
  if(remaining.rows[0]?.n!==0)throw Error('Variant membership removal mismatch');
  await c.query('COMMIT');invalidateFmicSearchCache();return {saved:true as const,groups:items.length,skus:result.rows.reduce((n,r)=>n+Number(r.skus),0)};
 }catch(error){await c.query('ROLLBACK').catch(()=>{});throw error}finally{c.release()}
}
