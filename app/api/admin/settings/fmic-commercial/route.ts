import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {DEFAULT_FMIC_COMMERCIAL,validFmicCommercial,previewFmicPrice,previewFmicDelivery} from '../../../../lib/fmic-commercial';
import {visibleCatalog} from '../../../../lib/fmic-category-membership';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers});
async function settings(){
 const r=await getDbPool().query("SELECT data FROM rpm_shop_settings WHERE key='fmic_commercial'");
 return validFmicCommercial(r.rows[0]?.data)?r.rows[0].data:DEFAULT_FMIC_COMMERCIAL;
}
export async function GET(request:Request){
 try{
  const sku=(new URL(request.url).searchParams.get('sku')??'').trim();
  if(sku.length>120)return fail('Niepoprawny indeks',400);
  const policy=await settings();
  if(!sku)return NextResponse.json({settings:policy},{headers});
  const r=await getDbPool().query("SELECT sku,name,source_price::float8 AS source_price,proposed_gross::float8 AS proposed_gross,data->>'price_kind' AS price_kind,data->>'shipping_weight_raw' AS weight FROM rpm_fmic_catalog WHERE sku=$1 AND "+visibleCatalog,[sku]);
  if(!r.rows[0])return fail('Nie znaleziono produktu',404);
  const p=r.rows[0];
  return NextResponse.json({settings:policy,product:p,pricePreview:previewFmicPrice(p.source_price,policy),deliveryPreview:previewFmicDelivery([{weight:p.weight,qty:1}],policy)},{headers});
 }catch{return fail('Nie udało się pobrać konfiguracji',503)}
}
export async function PUT(request:Request){
 try{
  const origin=request.headers.get('origin'),host=request.headers.get('host');
  if(!origin||!host||new URL(origin).host!==host)return fail('Niedozwolone pochodzenie',403);
  if(!(request.headers.get('content-type')??'').includes('application/json'))return fail('Wymagany JSON',415);
  const raw=await request.text();if(raw.length>12000)return fail('Zbyt duże żądanie',413);
  const value=JSON.parse(raw)?.settings;
  if(!validFmicCommercial(value))return fail('Sprawdź konfigurację cen i przedziałów wagowych',400);
  const policy={priceBasis:value.priceBasis,markupPercent:value.markupPercent,vatPercent:value.vatPercent,shippingMode:value.shippingMode,country:value.country,tiers:value.tiers.map(t=>({maxKg:t.maxKg,gross:t.gross}))};
  await getDbPool().query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES('fmic_commercial',$1::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()",[JSON.stringify(policy)]);
  return NextResponse.json({settings:policy},{headers});
 }catch{return fail('Nie udało się zapisać konfiguracji',503)}
}
