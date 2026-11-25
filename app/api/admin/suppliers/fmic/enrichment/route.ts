import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../../lib/db';
import {setupEnrichment,inspectProduct} from '../../../../../lib/fmic-enrichment';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){
 try{await setupEnrichment();const db=getDbPool();const r=await db.query('SELECT sku,source_url,data,fetched_at FROM rpm_fmic_enrichment ORDER BY fetched_at DESC LIMIT 20');return NextResponse.json({enabled:process.env.FMIC_ENRICHMENT_ALLOWED==='1',rows:r.rows},{headers})}
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
