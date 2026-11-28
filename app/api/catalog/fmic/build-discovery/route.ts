import {NextResponse} from 'next/server';
import {imageOrderSql} from '../../../../lib/fmic-image-ranking';
import {getDbPool} from '../../../../lib/db';
import {visibleCatalog} from '../../../../lib/fmic-category-membership';
import {discoverPart,discoverExtraPart,extraDiscoveryPaths,compressorInletMm,discoverTurbo,turboDiscoveryCategory,type DiscoveryRow} from '../../../../lib/power-builder-discovery';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 if(process.env.SITE_LOCK_ENABLED!=='1')return NextResponse.json({error:'Katalog jeszcze niedostępny'},{status:503,headers});
 try{
  // Restrict discovery to a reviewed category; never accept arbitrary SQL or user keywords.
  const params=new URL(request.url).searchParams;
  const turboSku=params.get('turboSku');
  if(turboSku!==null){
   if(!/^[A-Za-z0-9._-]{1,120}$/.test(turboSku))return NextResponse.json({error:'Nieprawidłowe SKU'},{status:400,headers});
   const result=await getDbPool().query<{technical:unknown;description:string|null}>("SELECT d.technical,d.description FROM rpm_fmic_catalog c JOIN rpm_fmic_product_descriptions d ON d.sku=c.sku WHERE c.sku=$1 AND c.available AND c.target_category=ARRAY['Silnik i turbo','Turbosprężarki','Turbosprężarki tuningowe'] LIMIT 1",[turboSku]);
   const row=result.rows[0];
   return NextResponse.json({sku:turboSku,diameterMm:row?compressorInletMm(row.technical,row.description??''):null},{headers});
  }
  const slot=params.get('slot');
  if(slot==='turbo'){
   const raw=params.get('targetPs'),target=Number(raw);
   if(!raw||!Number.isFinite(target)||target<100||target>2500)return NextResponse.json({error:'Nieprawidłowa moc docelowa'},{status:400,headers});
   // Scan the whole eligible category; never truncate by SKU before sizing.
   const rows=await getDbPool().query<DiscoveryRow>("SELECT sku,name,data->>'brand' AS brand,proposed_gross FROM rpm_fmic_catalog WHERE "+visibleCatalog+" AND available AND proposed_gross>0 AND target_category=$1::text[] ORDER BY sku",[turboDiscoveryCategory]);
   const items=rows.rows.flatMap(row=>{const part=discoverTurbo(row,target);return part?[part]:[]});
   // Quote the screened result in one local DB query, rather than issuing
   // dozens of browser cart-quote requests. Cart additions still revalidate.
   const matched=items.length?await getDbPool().query("SELECT sku,name,proposed_gross,available,updated_at,(SELECT img.url FROM jsonb_array_elements_text(data->'images') WITH ORDINALITY AS img(url,pos) LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url WHERE COALESCE(a.status,'pending') NOT IN ('blank','missing') ORDER BY "+imageOrderSql+" LIMIT 1) AS image FROM rpm_fmic_catalog WHERE sku=ANY($1::text[]) AND "+visibleCatalog,[items.map(p=>p.sku)]):{rows:[]};
   const quotes=matched.rows.map(p=>({sku:p.sku,name:p.name,unitPrice:Number(p.proposed_gross),available:p.available===true,image:p.image,updatedAt:p.updated_at}));
   const current=new Set(quotes.filter(q=>q.available&&Number.isFinite(q.unitPrice)&&q.unitPrice>0).map(q=>q.sku+'|'+q.name));
   return NextResponse.json({items:items.filter(p=>current.has(p.sku+'|'+p.name)),quotes,scanned:rows.rows.length,targetPs:target},{headers});
  }
  if(slot&&!Object.hasOwn(extraDiscoveryPaths,slot))return NextResponse.json({error:'Nieobsługiwana grupa'},{status:400,headers});
  const categories=slot?extraDiscoveryPaths[slot]:[['Układ dolotowy','Blow off','Blow offy uniwersalne'],['Układ paliwowy','Regulatory ciśnienia paliwa','Regulatory ciśnienia paliwa'],['Układ paliwowy','Filtry paliwa'],['Układ dolotowy','Intercooler','Uniwersalne']];
  const result=await getDbPool().query<DiscoveryRow & {target_category:string[]}>("SELECT c.sku,c.name,c.brand,c.target_category FROM jsonb_array_elements($1::jsonb) AS category(path) CROSS JOIN LATERAL (SELECT sku,name,data->>'brand' AS brand,target_category FROM rpm_fmic_catalog WHERE "+visibleCatalog+" AND available AND proposed_gross>0 AND target_category=ARRAY(SELECT jsonb_array_elements_text(category.path)) ORDER BY sku LIMIT $2) AS c",[JSON.stringify(categories),slot==='filter'?400:250]);
  const items=result.rows.flatMap(row=>{const candidate=slot?discoverExtraPart(row,row.target_category,slot):discoverPart(row,row.target_category);return candidate?[candidate]:[]});
  return NextResponse.json({items},{headers});
 }catch(e){console.error('Build discovery failed',e);return NextResponse.json({error:'Nie udało się przeszukać katalogu'},{status:503,headers})}
}
