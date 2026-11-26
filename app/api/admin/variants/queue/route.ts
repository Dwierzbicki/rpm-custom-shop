import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {findReviewPreset,reviewPresets} from '../../../../lib/variant-review-presets';
import {heldVariantSkus,heldVariantSql} from '../../../../lib/variant-publication-holds';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 const key=new URL(request.url).searchParams.get('preset')??'';
 const preset=findReviewPreset(key);
 if(!preset&&key!=='all-reviewed'&&key!=='all-pending')return NextResponse.json({error:'Nieprawidłowy zakres'},{status:400,headers});
 try{
  const chosen=preset?[preset]:reviewPresets;
  const args=chosen.flatMap(p=>[p.scope,[...p.category]]);
  const clauses=chosen.map((_,i)=>"(scope=$"+(i*2+1)+" AND category[1:cardinality($"+(i*2+2)+"::text[])]=$"+(i*2+2)+"::text[])");
  const all=key==='all-pending';
  const params=all?[]:args;
  const holdPredicate=heldVariantSql('
  if(r.rows.length>10000)return NextResponse.json({error:'Zakres jest zbyt duży; użyj ręcznych partii.'},{status:400,headers});
  return NextResponse.json({scope:preset?.scope??null,items:r.rows,excluded:excluded.rows[0]??{families:0,skus:0}},{headers});
 }catch(error){console.error('Variant queue unavailable',error);return NextResponse.json({error:'Nie udało się pobrać kolejki.'},{status:503,headers})}
}
+(params.length+1));
  const where=" FROM rpm_variant_families WHERE decision='pending' AND present AND "+(all?"scope IN ('colors','hel')":"("+clauses.join(" OR ")+")");
  const db=getDbPool();
  const [r,excluded]=await Promise.all([
   db.query("SELECT id,scope,fingerprint,jsonb_array_length(members)::int skus"+where+" AND "+holdPredicate+" ORDER BY scope,category,title,id LIMIT 10001",[...params,[...heldVariantSkus]]),
   db.query("SELECT count(*)::int families,coalesce(sum(jsonb_array_length(members)),0)::int skus"+where+" AND NOT ("+holdPredicate+")",[...params,[...heldVariantSkus]])
  ]);
  if(r.rows.length>10000)return NextResponse.json({error:'Zakres jest zbyt duży; użyj ręcznych partii.'},{status:400,headers});
  return NextResponse.json({scope:preset?.scope??null,items:r.rows},{headers});
 }catch(error){console.error('Variant queue unavailable',error);return NextResponse.json({error:'Nie udało się pobrać kolejki.'},{status:503,headers})}
}
