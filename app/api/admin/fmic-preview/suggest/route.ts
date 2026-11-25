import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {setupImageAudit} from '../../../../lib/fmic-image-quality';
import {searchTokens} from '../../../../lib/header-search';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const q=(new URL(request.url).searchParams.get('q')??'').trim().slice(0,120);
 const headers={'Cache-Control':'private, no-store'};
 if(q.length<2)return NextResponse.json({items:[]},{headers});
 try{
 await setupImageAudit();
 const tokens=searchTokens(q);
 const result=await getDbPool().query(`SELECT sku,name,proposed_gross,available,
 (SELECT img.url FROM jsonb_array_elements_text(data->'images') WITH ORDINALITY AS img(url,pos)
 LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url
 WHERE COALESCE(a.status,'pending') NOT IN ('blank','missing') ORDER BY img.pos LIMIT 1) AS image
 FROM rpm_fmic_catalog
 WHERE mapping_status IN ('exact','normalized','manual')
 AND NOT EXISTS (SELECT 1 FROM unnest($1::text[]) AS token WHERE strpos(lower(concat_ws(' ',name,sku,data->>'ean',data->>'mpn')),token)=0)
 ORDER BY CASE WHEN lower(sku)=lower($2) OR data->>'ean'=$2 OR lower(data->>'mpn')=lower($2) THEN 0 WHEN strpos(lower(name),lower($2))=1 THEN 1 ELSE 2 END,available DESC,sku LIMIT 6`,[tokens,q]);
 return NextResponse.json({items:result.rows},{headers});
 }catch(e){console.error('FMIC suggestions failed',e);return NextResponse.json({error:'Nie udało się pobrać podpowiedzi'},{status:500,headers})}
}
