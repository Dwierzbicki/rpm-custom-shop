import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const sku=new URL(request.url).searchParams.get('sku')??'';
 const headers={'Cache-Control':'private, no-store'};
 if(!sku||sku.length>120)return NextResponse.json({error:'Nieprawidłowy SKU'},{status:400,headers});
 try{
 const db=getDbPool();
 const result=await db.query("SELECT sku,name,proposed_gross,available,target_category,data->'images' AS images,data->>'ean' AS ean,data->>'mpn' AS mpn,data->>'brand' AS brand,data->>'shipping_weight_raw' AS shipping_weight FROM rpm_fmic_catalog WHERE sku=$1 AND mapping_status IN ('exact','normalized','manual')",[sku]);
 const product=result.rows[0];
 if(!product)return NextResponse.json({error:'Nie znaleziono produktu'},{status:404,headers});
 const related=await db.query("SELECT sku,name,proposed_gross,available,data->'images'->>0 AS image FROM rpm_fmic_catalog WHERE target_category=$1::text[] AND sku<>$2 AND mapping_status IN ('exact','normalized','manual') ORDER BY available DESC,sku LIMIT 4",[product.target_category,sku]);
 return NextResponse.json({product,related:related.rows},{headers});
 }catch(e){console.error('FMIC product preview failed',e);return NextResponse.json({error:'Nie udało się pobrać produktu'},{status:500,headers})}
}
