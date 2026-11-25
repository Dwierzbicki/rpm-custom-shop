import pg from 'pg';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='require'?{rejectUnauthorized:true}:undefined});
try{
 await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
 await pool.query("CREATE INDEX CONCURRENTLY IF NOT EXISTS rpm_fmic_search_trgm_v1 ON rpm_fmic_catalog USING gin ((lower(name || ' ' || sku || CASE WHEN data->>'ean' IS NULL THEN '' ELSE ' ' || (data->>'ean') END || CASE WHEN data->>'mpn' IS NULL THEN '' ELSE ' ' || (data->>'mpn') END)) gin_trgm_ops) WHERE mapping_status IN ('exact','normalized','manual')");
 await pool.query('ANALYZE rpm_fmic_catalog');
 console.log('FMIC search index ready');
}finally{await pool.end()}
