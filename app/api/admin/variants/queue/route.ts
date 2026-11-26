import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {findReviewPreset} from '../../../../lib/variant-review-presets';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 const preset=findReviewPreset(new URL(request.url).searchParams.get('preset')??'');
 if(!preset)return NextResponse.json({error:'Nieprawidłowy zakres'},{status:400,headers});
 try{
  const r=await getDbPool().query("SELECT id,fingerprint,jsonb_array_length(members)::int skus FROM rpm_variant_families WHERE scope=$1 AND decision='pending' AND present AND category[1:cardinality($2::text[])]=$2::text[] ORDER BY title,id LIMIT 10001",[preset.scope,[...preset.category]]);
  if(r.rows.length>10000)return NextResponse.json({error:'Zakres jest zbyt duży; użyj ręcznych partii.'},{status:400,headers});
  return NextResponse.json({scope:preset.scope,items:r.rows},{headers});
 }catch(error){console.error('Variant queue unavailable',error);return NextResponse.json({error:'Nie udało się pobrać kolejki.'},{status:503,headers})}
}
