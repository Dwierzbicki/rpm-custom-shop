import {invalidateFmicSearchCache} from '../../../../lib/fmic-search-performance';
import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {setupImageAudit} from '../../../../lib/fmic-image-quality';
import {setupFmicCatalog} from '../../../../lib/fmic-catalog-db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{
  await setupFmicCatalog();await setupImageAudit();
  const db=getDbPool();
  const params=new URL(request.url).searchParams;
  if(params.get('pricing')==='1'){const result=await db.query('SELECT discount FROM rpm_fmic_settings WHERE id=1');if(!result.rows[0])return NextResponse.json({error:'Brak reguły cenowej'},{status:503});return NextResponse.json({discount:Number(result.rows[0].discount)},{headers:{'Cache-Control':'private, no-store'}})}
  if(params.get('summary')==='1'){const stats=await db.query("SELECT count(*)::int AS total,count(*) FILTER (WHERE available)::int AS available,count(*) FILTER (WHERE mapping_status IN ('exact','normalized','manual'))::int AS mapped,max(updated_at) AS updated_at FROM rpm_fmic_catalog");return NextResponse.json({stats:stats.rows[0]},{headers:{'Cache-Control':'no-store'}})}
  const q=(params.get('q')??'').trim().slice(0,120);
  const size=[25,50,100].includes(Number(params.get('size')))?Number(params.get('size')):25;
  const rawPage=Number(params.get('page')??1);
  const page=Number.isSafeInteger(rawPage)?Math.max(1,Math.min(100000,rawPage)):1;
  const availability=params.get('availability')??'all';
  const sort=({sku:'sku ASC',priceAsc:'proposed_gross ASC,sku ASC',priceDesc:'proposed_gross DESC,sku ASC',name:'name ASC,sku ASC'} as Record<string,string>)[params.get('sort')??'sku']??'sku ASC';
  const where="WHERE ($1='' OR strpos(lower(sku),lower($1))>0 OR strpos(lower(name),lower($1))>0) AND ($2='all' OR ($2='available' AND available) OR ($2='unavailable' AND NOT available))";
  const filter=['available','unavailable'].includes(availability)?availability:'all';
  const [stats,groups,products,settings,matched]=await Promise.all([
   db.query("SELECT count(*)::int AS total,count(*) FILTER (WHERE available)::int AS available,count(*) FILTER (WHERE mapping_status IN ('exact','normalized','manual'))::int AS mapped,max(updated_at) AS updated_at FROM rpm_fmic_catalog"),
   db.query("SELECT source_category,target_category,mapping_status,count(*)::int AS total FROM rpm_fmic_catalog GROUP BY 1,2,3 ORDER BY total DESC LIMIT 1000"),
   db.query("SELECT sku,name,source_price,proposed_gross,available,mapping_status,data->>'availability' AS feed_availability,data->>'url' AS supplier_url,(SELECT img.url FROM jsonb_array_elements_text(data->'images') WITH ORDINALITY img(url,pos) LEFT JOIN rpm_fmic_image_audit audit ON audit.url=img.url WHERE COALESCE(audit.status,'pending') NOT IN ('blank','missing') ORDER BY img.pos LIMIT 1) AS image FROM rpm_fmic_catalog "+where+" ORDER BY "+sort+" LIMIT $3 OFFSET $4",[q,filter,size,(page-1)*size]),
   db.query("SELECT discount FROM rpm_fmic_settings WHERE id=1"),
   db.query("SELECT count(*)::int AS total FROM rpm_fmic_catalog "+where,[q,filter])
  ]);
  return NextResponse.json({pagination:{page,size,total:matched.rows[0].total},discount:Number(settings.rows[0].discount),stats:stats.rows[0],groups:groups.rows,products:products.rows},{headers:{'Cache-Control':'no-store'}});
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
  invalidateFmicSearchCache();
   return NextResponse.json({discount,updated:result.rowCount??0});
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
 }catch(e){console.error('FMIC pricing update failed',e);return NextResponse.json({error:'Nie udało się zapisać reguły cenowej'},{status:500})}
}
