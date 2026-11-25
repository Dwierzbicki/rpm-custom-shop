import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {setupImageAudit} from '../../../../lib/fmic-image-quality';
import {cachedSearch,searchPatterns,searchConditions} from '../../../../lib/fmic-search-performance';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const q=(new URL(request.url).searchParams.get('q')??'').trim().slice(0,120);
 const headers={'Cache-Control':'private, no-store'};
 if(q.length<2)return NextResponse.json({items:[]},{headers});
 try{
 await setupImageAudit();
 const patterns=searchPatterns(q);
 const payload=await cachedSearch('suggest:'+q,15000,async()=>{
 const db=getDbPool();
 const [result,groups]=await Promise.all([db.query(`SELECT sku,name,proposed_gross,available,
 (SELECT img.url FROM jsonb_array_elements_text(data->'images') WITH ORDINALITY AS img(url,pos)
 LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url
 WHERE COALESCE(a.status,'pending') NOT IN ('blank','missing') ORDER BY img.pos LIMIT 1) AS image
 FROM rpm_fmic_catalog
 WHERE mapping_status IN ('exact','normalized','manual')
 AND ${searchConditions(patterns,2)}
 ORDER BY CASE WHEN lower(sku)=lower($1) OR data->>'ean'=$1 OR lower(data->>'mpn')=lower($1) THEN 0 WHEN strpos(lower(name),lower($1))=1 THEN 1 ELSE 2 END,available DESC,sku LIMIT 6`,[q,...patterns]),db.query(`SELECT target_category[1] AS name,count(*)::int AS count FROM rpm_fmic_catalog WHERE mapping_status IN ('exact','normalized','manual') AND cardinality(target_category)>0 AND ${searchConditions(patterns,1)} GROUP BY 1 ORDER BY count DESC,1`,patterns)]);
 return {items:result.rows,categories:groups.rows.slice(0,4),total:groups.rows.reduce((sum,row)=>sum+Number(row.count),0)};
 });
 return NextResponse.json(payload,{headers});
 }catch(e){console.error('FMIC suggestions failed',e);return NextResponse.json({error:'Nie udało się pobrać podpowiedzi'},{status:500,headers})}
}
