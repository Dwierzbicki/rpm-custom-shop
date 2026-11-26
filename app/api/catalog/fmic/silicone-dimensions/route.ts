import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {siliconeChoice,siliconeAlternatives,type SiliconeRow} from '../../../../lib/silicone-dimensions';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){
 const sku=new URL(request.url).searchParams.get('sku')??'';
 if(!/^\d{5,10}(?:\/\d{1,3})?-[BGNPR]$/.test(sku))return NextResponse.json({choices:null},{headers});
 try{
  const db=getDbPool(),cols="sku,name,target_category category,coalesce(data->>'brand','') brand,proposed_gross::text price,available";
  const found=await db.query<SiliconeRow>("SELECT "+cols+" FROM rpm_fmic_catalog WHERE sku=$1 AND mapping_status IN ('exact','normalized','manual')",[sku]);
  const current=found.rows[0],parsed=current?siliconeChoice(current):null;
  if(!parsed)return NextResponse.json({choices:null},{headers});
  const result=await db.query<SiliconeRow>("SELECT "+cols+" FROM rpm_fmic_catalog WHERE mapping_status IN ('exact','normalized','manual') AND target_category[1]='Układ dolotowy' AND target_category[2]='Łączniki silikonowe' AND lower(trim(coalesce(data->>'brand','')))=lower(trim($1)) AND right(sku,2)=right($2,2) AND (sku LIKE $3 OR sku LIKE $4) LIMIT 501",[current.brand,sku,String(parsed.angle).padStart(4,'0')+'%','%'+parsed.diameter+(parsed.kind==='straight'?'00':'')+sku.slice(-2)]);
  return NextResponse.json({choices:result.rows.length>500?null:siliconeAlternatives(current,result.rows)},{headers});
 }catch(error){console.error('Silicone options unavailable',error);return NextResponse.json({choices:null},{headers})}
}
