import pg from 'pg';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='require'?{rejectUnauthorized:true}:undefined});
const name='rpm_fmic_search_trgm_v2';
const expression="lower(name || ' ' || sku || CASE WHEN data->>'ean' IS NULL THEN '' ELSE ' ' || (data->>'ean') END || CASE WHEN data->>'mpn' IS NULL THEN '' ELSE ' ' || (data->>'mpn') END)";
const visible="(mapping_status IN ('exact','normalized','manual') OR (mapping_status='parent_review' AND target_category=ARRAY['Układ dolotowy','Kolanka i rury nierdzewne']::text[] AND data->>'category_path'='Układ dolotowy > Kolanka i rury nierdzewne > Spawane kolanka nierdzewne welding porn'))";
const db=await pool.connect();
try{
 await db.query("SET lock_timeout='10s'");
 await db.query("SET statement_timeout='15min'");
 const lock=await db.query('SELECT pg_try_advisory_lock(27391,12) AS acquired');
 if(!lock.rows[0].acquired)throw Error('Index migration already running');
 await db.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
 const status=()=>db.query("SELECT indisvalid,indisready FROM pg_index WHERE indexrelid=to_regclass('public.'||$1)",[name]);
 const before=(await status()).rows[0];
 if(before&&!before.indisvalid)await db.query('DROP INDEX CONCURRENTLY IF EXISTS public.'+name);
 await db.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS '+name+' ON public.rpm_fmic_catalog USING gin (('+expression+') gin_trgm_ops) WHERE '+visible);
 const after=(await status()).rows[0];
 if(!after?.indisvalid||!after?.indisready)throw Error('New index is not valid; existing v1 retained');
 await db.query('ANALYZE public.rpm_fmic_catalog');
 console.log('FMIC search index v2 ready; v1 retained until benchmark verification');
}finally{db.release(true);await pool.end()}
