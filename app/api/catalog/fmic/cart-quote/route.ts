import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {visibleCatalog} from '../../../../lib/fmic-category-membership';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function POST(request:Request){
 try{
  if(process.env.SITE_LOCK_ENABLED!=='1')return NextResponse.json({error:'Katalog jeszcze niedostępny'},{status:503,headers});
  if(!(request.headers.get('content-type')??'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415,headers});
  const body=await request.json();
  const skus:unknown=body?.skus;
  if(!Array.isArray(skus)||skus.length<1||skus.length>30||!skus.every(s=>typeof s==='string'&&s.length>0&&s.length<=120))return NextResponse.json({error:'Niepoprawne indeksy'},{status:400,headers});
  const rows=await getDbPool().query("SELECT sku,name,proposed_gross,available,updated_at,(data->'images'->>0) AS image FROM rpm_fmic_catalog WHERE sku=ANY($1::text[]) AND "+visibleCatalog,[Array.from(new Set(skus))]);
  const items=rows.rows.map(p=>({sku:p.sku,name:p.name,unitPrice:Number(p.proposed_gross),available:p.available===true,image:p.image,updatedAt:p.updated_at}));
  return NextResponse.json({items,checkoutEnabled:false},{headers});
 }catch(e){console.error('FMIC cart quote failed',e);return NextResponse.json({error:'Nie udało się sprawdzić katalogu'},{status:503,headers})}
}
