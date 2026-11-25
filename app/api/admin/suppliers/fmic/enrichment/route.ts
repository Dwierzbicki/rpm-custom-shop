import {NextResponse} from 'next/server';
import {parseProductTechnical} from '../../../../../lib/fmic-technical';
import {getDbPool} from '../../../../../lib/db';
import {setupEnrichment,inspectProduct} from '../../../../../lib/fmic-enrichment';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 try{await setupEnrichment();const db=getDbPool();const r=await db.query('SELECT sku,source_url,data,fetched_at FROM rpm_fmic_enrichment ORDER BY fetched_at DESC LIMIT 20');const sku=(new URL(request.url).searchParams.get('sku')??'').trim().slice(0,120);const [stats,product]=await Promise.all([db.query("SELECT (SELECT count(*)::int FROM rpm_fmic_catalog) AS total,(SELECT count(*)::int FROM rpm_fmic_enrichment) AS fetched,(SELECT count(*)::int FROM rpm_fmic_product_descriptions WHERE description<>'') AS assigned,(SELECT count(*)::int FROM rpm_fmic_product_descriptions WHERE published AND description<>'') AS published"),sku?db.query("SELECT c.sku,c.name,c.data->>'url' AS source_url,c.data->>'brand' AS feed_brand,e.data AS extracted,d.description,d.brand,d.published FROM rpm_fmic_catalog c LEFT JOIN rpm_fmic_enrichment e ON e.sku=c.sku LEFT JOIN rpm_fmic_product_descriptions d ON d.sku=c.sku WHERE c.sku=$1",[sku]):Promise.resolve({rows:[]})]);return NextResponse.json({enabled:process.env.FMIC_ENRICHMENT_ALLOWED==='1',rows:r.rows,stats:stats.rows[0],product:product.rows[0]??null},{headers})}
 catch(e){console.error('FMIC enrichment read',e);return NextResponse.json({error:'Błąd odczytu'}, {status:500,headers})}
}
export async function POST(request:Request){
 try{
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403,headers});
 if(process.env.FMIC_ENRICHMENT_ALLOWED!=='1')return NextResponse.json({error:'Pilotaż wymaga potwierdzenia zasad FMIC i konfiguracji FMIC_ENRICHMENT_ALLOWED=1'},{status:403,headers});
 const {sku}=await request.json();if(typeof sku!=='string'||!sku.trim()||sku.length>120)return NextResponse.json({error:'Podaj prawidłowe SKU'},{status:400,headers});
 await setupEnrichment();const client=await getDbPool().connect();let locked=false;
 try{const lock=await client.query('SELECT pg_try_advisory_lock(27391,3) AS acquired');locked=lock.rows[0].acquired;if(!locked)return NextResponse.json({error:'Pilotaż już trwa'},{status:409,headers});
 const recent=await client.query("SELECT 1 FROM rpm_fmic_enrichment WHERE fetched_at>NOW()-interval '30 seconds' LIMIT 1");if(recent.rowCount)return NextResponse.json({error:'Odczekaj 30 sekund pomiędzy próbami'},{status:429,headers});
 return NextResponse.json(await inspectProduct(sku.trim()),{headers});
 }finally{if(locked)await client.query('SELECT pg_advisory_unlock(27391,3)').catch(()=>{});client.release()}
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message.slice(0,250):'Błąd pilotażu'},{status:422,headers})}
}

export async function PUT(request:Request){
 try{
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403,headers});
 const {sku,description,brand,published}=await request.json();
 if(typeof sku!=='string'||!sku.trim()||sku.length>120||typeof description!=='string'||description.length>30000||typeof brand!=='string'||brand.length>200||typeof published!=='boolean'||(published&&!description.trim()))return NextResponse.json({error:'Nieprawidłowe dane opisu'},{status:400,headers});
 await setupEnrichment();const db=getDbPool();
 const source=(await db.query('SELECT name,target_category FROM rpm_fmic_catalog WHERE sku=$1',[sku.trim()])).rows[0];
 if(!source)return NextResponse.json({error:'Nie znaleziono SKU'},{status:404,headers});
 const technical=parseProductTechnical(source.name,description.trim(),source.target_category??[],sku.trim());
 const result=await db.query("INSERT INTO rpm_fmic_product_descriptions(sku,description,brand,published,technical) SELECT sku,$2,$3,$4,$5::jsonb FROM rpm_fmic_catalog WHERE sku=$1 ON CONFLICT(sku) DO UPDATE SET description=EXCLUDED.description,brand=EXCLUDED.brand,published=EXCLUDED.published,technical=EXCLUDED.technical,updated_at=NOW() RETURNING sku",[sku.trim(),description.trim(),brand.trim(),published,JSON.stringify(technical)]);
 if(!result.rowCount)return NextResponse.json({error:'Nie znaleziono SKU'},{status:404,headers});
 return NextResponse.json({ok:true},{headers});
 }catch(e){console.error('Save FMIC description',e);return NextResponse.json({error:'Nie udało się zapisać opisu'},{status:500,headers})}
}
