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
  const [stats,groups,products,settings]=await Promise.all([
   db.query("SELECT count(*)::int AS total,count(*) FILTER (WHERE available)::int AS available,count(*) FILTER (WHERE mapping_status IN ('exact','normalized','manual'))::int AS mapped,max(updated_at) AS updated_at FROM rpm_fmic_catalog"),
   db.query("SELECT source_category,target_category,mapping_status,count(*)::int AS total FROM rpm_fmic_catalog GROUP BY 1,2,3 ORDER BY total DESC LIMIT 1000"),
   db.query("SELECT sku,name,source_price,proposed_gross,available,mapping_status FROM rpm_fmic_catalog WHERE $1='' OR strpos(lower(sku),lower($1))>0 OR strpos(lower(name),lower($1))>0 ORDER BY sku LIMIT 50",[q]),
   db.query("SELECT discount FROM rpm_fmic_settings WHERE id=1")
  ]);
  return NextResponse.json({discount:Number(settings.rows[0].discount),stats:stats.rows[0],groups:groups.rows,products:products.rows},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('FMIC catalog read failed',error);return NextResponse.json({error:'Nie udało się odczytać katalogu FMIC'},{status:500})}
}

export async function PUT(request:Request){
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 try{if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403})}catch{return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403})}
 let discount:unknown;
 try{discount=(await request.json()).discount}catch{return NextResponse.json({error:'Niepoprawne dane'},{status:400})}
 if(typeof discount!=='number'||!Number.isFinite(discount)||discount<0||discount>99.99||Math.abs(discount*100-Math.round(discount*100))>1e-7)return NextResponse.json({error:'Podaj procent od 0 do 99,99 (maks. dwa miejsca po przecinku)'},{status:400});
 try{
  await setupFmicCatalog();
  const client=await getDbPool().connect();
  try{
   await client.query('BEGIN');
   const lock=await client.query('SELECT pg_try_advisory_xact_lock(27391,1) AS acquired');
   if(!lock.rows[0].acquired){await client.query('ROLLBACK');return NextResponse.json({error:'Trwa import FMIC. Spróbuj ponownie później.'},{status:409})}
   await client.query('UPDATE rpm_fmic_settings SET discount=$1 WHERE id=1',[discount]);
   const result=await client.query('UPDATE rpm_fmic_catalog SET proposed_gross=ceil(source_price*(100-$1::numeric)/100) WHERE proposed_gross<>ceil(source_price*(100-$1::numeric)/100)',[discount]);
   await client.query('COMMIT');
   return NextResponse.json({discount,updated:result.rowCount??0});
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
 }catch(e){console.error('FMIC pricing update failed',e);return NextResponse.json({error:'Nie udało się zapisać reguły cenowej'},{status:500})}
}
