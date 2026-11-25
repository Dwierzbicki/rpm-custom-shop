import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {setupFmicCatalog} from '../../../../lib/fmic-catalog-db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{
  await setupFmicCatalog();
  const db=getDbPool();
  const q=(new URL(request.url).searchParams.get('q')??'').trim().slice(0,120);
  const [stats,groups,products]=await Promise.all([
   db.query("SELECT count(*)::int AS total,count(*) FILTER (WHERE available)::int AS available,count(*) FILTER (WHERE mapping_status IN ('exact','normalized'))::int AS mapped,max(updated_at) AS updated_at FROM rpm_fmic_catalog"),
   db.query("SELECT source_category,target_category,mapping_status,count(*)::int AS total FROM rpm_fmic_catalog GROUP BY 1,2,3 ORDER BY total DESC LIMIT 1000"),
   db.query("SELECT sku,name,source_price,proposed_gross,available,mapping_status FROM rpm_fmic_catalog WHERE $1='' OR strpos(lower(sku),lower($1))>0 OR strpos(lower(name),lower($1))>0 ORDER BY sku LIMIT 50",[q])
  ]);
  return NextResponse.json({stats:stats.rows[0],groups:groups.rows,products:products.rows},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('FMIC catalog read failed',error);return NextResponse.json({error:'Nie udało się odczytać katalogu FMIC'},{status:500})}
}
