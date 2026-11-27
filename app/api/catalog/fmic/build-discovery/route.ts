import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {visibleCatalog} from '../../../../lib/fmic-category-membership';
import {discoverBov,type DiscoveryRow} from '../../../../lib/power-builder-discovery';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){
 if(process.env.SITE_LOCK_ENABLED!=='1')return NextResponse.json({error:'Katalog jeszcze niedostępny'},{status:503,headers});
 try{
  // Restrict discovery to a reviewed category; never accept arbitrary SQL or user keywords.
  const result=await getDbPool().query<DiscoveryRow>("SELECT sku,name FROM rpm_fmic_catalog WHERE "+visibleCatalog+" AND available AND proposed_gross>0 AND target_category=$1::text[] ORDER BY sku LIMIT 250",[['Układ dolotowy','Blow off','Blow offy uniwersalne']]);
  const items=result.rows.flatMap(row=>{const candidate=discoverBov(row);return candidate?[candidate]:[]});
  return NextResponse.json({items},{headers});
 }catch(e){console.error('Build discovery failed',e);return NextResponse.json({error:'Nie udało się przeszukać katalogu'},{status:503,headers})}
}
