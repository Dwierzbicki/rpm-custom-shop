import {getDbPool} from './db';
import {invalidateFmicSearchCache} from './fmic-search-performance';
import {variantCandidateSql,variantStatusSql} from './variant-sql';
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
  const lock=await c.query('SELECT pg_try_advisory_xact_lock(9382862) AS ok');if(!lock.rows[0]?.ok)throw Error('Trwa inna operacja wariantów.');
  // Scope-local snapshot. The feed tables are read only; prior decisions survive disappearance.
  await c.query('UPDATE rpm_variant_families SET present=false WHERE scope=$1',[scope]);
  const result=await c.query(`INSERT INTO rpm_variant_families(id,scope,rule,title,category,members,fingerprint)
 SELECT id,$1,rule,title,category,members,fingerprint FROM (${variantCandidateSql(scope)}) candidates
 ON CONFLICT(id) DO UPDATE SET rule=EXCLUDED.rule,title=EXCLUDED.title,category=EXCLUDED.category,members=EXCLUDED.members,fingerprint=EXCLUDED.fingerprint,present=true,scanned_at=now()`,[scope]);
  await c.query("DELETE FROM rpm_variant_families WHERE scope=$1 AND NOT present AND decision='pending'",[scope]);
  await c.query('COMMIT');invalidateFmicSearchCache();return result.rowCount??0;
 }catch(error){await c.query('ROLLBACK');throw error}finally{c.release()}
}
export async function listVariants(scope:VariantScope,filter:VariantFilter,q:string,page:number){
 await setupVariants();const db=getDbPool();
 const where="scope=$1 AND ($2='' OR strpos(lower(title),lower($2))>0 OR EXISTS(SELECT 1 FROM jsonb_array_elements(members) m WHERE strpos(lower(m->>'sku'),lower($2))>0)) AND ($3='all' OR ("+variantStatusSql+")=$3)";
 const summary=await db.query(`SELECT (${variantStatusSql}) status,count(*)::int groups,COALESCE(sum(jsonb_array_length(members)) FILTER(WHERE present),0)::int skus,COALESCE(sum(jsonb_array_length(members)-1) FILTER(WHERE present),0)::int reduction,max(scanned_at) scanned_at FROM rpm_variant_families WHERE scope=$1 GROUP BY 1`,[scope]);
 const count=await db.query('SELECT count(*)::int total FROM rpm_variant_families WHERE '+where,[scope,q,filter]);
 const total:number=Number(count.rows[0].total);const current=Math.max(1,Math.min(page,Math.ceil(Number(total)/20)||1));
 const rows=await db.query(`SELECT id,scope,rule,title,category,members,fingerprint,reviewed_fingerprint,reviewed_members,(${variantStatusSql}) status,present,scanned_at,reviewed_at FROM rpm_variant_families WHERE ${where} ORDER BY title,id LIMIT 20 OFFSET $4`,[scope,q,filter,(current-1)*20]);
 return {families:rows.rows,summary:summary.rows,total:Number(total),page:current};
}
export async function reviewVariant(id:string,fingerprint:string,decision:VariantDecision){
 await setupVariants();const c=await getDbPool().connect();
 try{
  await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='2s'");
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
