import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {visibleCatalog} from '../../../../lib/fmic-category-membership';
import {discoverPart,discoverExtraPart,extraDiscoveryPaths,type DiscoveryRow} from '../../../../lib/power-builder-discovery';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 if(process.env.SITE_LOCK_ENABLED!=='1')return NextResponse.json({error:'Katalog jeszcze niedostępny'},{status:503,headers});
 try{
  // Restrict discovery to a reviewed category; never accept arbitrary SQL or user keywords.
  const slot=new URL(request.url).searchParams.get('slot');
  if(slot&&!Object.hasOwn(extraDiscoveryPaths,slot))return NextResponse.json({error:'Nieobsługiwana grupa'},{status:400,headers});
  const categories=slot?extraDiscoveryPaths[slot]:[['Układ dolotowy','Blow off','Blow offy uniwersalne'],['Układ paliwowy','Regulatory ciśnienia paliwa','Regulatory ciśnienia paliwa'],['Układ paliwowy','Filtry paliwa'],['Układ dolotowy','Intercooler','Uniwersalne']];
  const result=await getDbPool().query<DiscoveryRow & {target_category:string[]}>("SELECT c.sku,c.name,c.brand,c.target_category FROM jsonb_array_elements($1::jsonb) AS category(path) CROSS JOIN LATERAL (SELECT sku,name,data->>'brand' AS brand,target_category FROM rpm_fmic_catalog WHERE "+visibleCatalog+" AND available AND proposed_gross>0 AND target_category=ARRAY(SELECT jsonb_array_elements_text(category.path)) ORDER BY sku LIMIT $2) AS c",[JSON.stringify(categories),slot==='filter'?400:250]);
  const items=result.rows.flatMap(row=>{const candidate=slot?discoverExtraPart(row,row.target_category,slot):discoverPart(row,row.target_category);return candidate?[candidate]:[]});
  return NextResponse.json({items},{headers});
 }catch(e){console.error('Build discovery failed',e);return NextResponse.json({error:'Nie udało się przeszukać katalogu'},{status:503,headers})}
}
