import {NextResponse} from 'next/server';
import {getDbPool} from '../../../lib/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(r:Request){const sku=new URL(r.url).searchParams.get('sku')?.trim()??'';if(!sku||sku.length>120)return NextResponse.json({error:'Niepoprawny SKU'},{status:400,headers});try{const result=await getDbPool().query("SELECT sku,name,source_price::float8,proposed_gross::float8,available,mapping_status,target_category,data->>'brand' AS brand,data->>'mpn' AS mpn,data->>'ean' AS ean,data->>'url' AS source_url,updated_at FROM rpm_fmic_catalog WHERE sku=$1",[sku]);return result.rows[0]?NextResponse.json({product:result.rows[0]},{headers}):NextResponse.json({error:'Nie znaleziono produktu'},{status:404,headers})}catch{return NextResponse.json({error:'Nie udało się odczytać produktu'},{status:503,headers})}}
