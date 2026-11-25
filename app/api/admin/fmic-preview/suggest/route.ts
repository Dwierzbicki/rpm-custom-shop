import {imageOrderSql} from '../../../../lib/fmic-image-ranking';
import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../lib/db';
import {getCatalog} from '../../../../lib/catalog-db';
import {manualCategoryPath} from '../../../../category-routing';
import {matchesSearch} from '../../../../lib/header-search';
import {visibleCatalog,categoryExpansion} from '../../../../lib/fmic-category-membership';
import {cachedSearch,searchPatterns,searchConditions} from '../../../../lib/fmic-search-performance';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const q=(new URL(request.url).searchParams.get('q')??'').trim().slice(0,120);
 const headers={'Cache-Control':'private, no-store'};
 if(q.length<2)return NextResponse.json({items:[]},{headers});
 try{
 const patterns=searchPatterns(q);
 const payload=await cachedSearch('suggest:v3:'+q,15000,async()=>{
 const db=getDbPool();
 const [result,groups]=await Promise.all([db.query(`SELECT sku,name,proposed_gross,available,
 (SELECT img.url FROM jsonb_array_elements_text(data->'images') WITH ORDINALITY AS img(url,pos)
 LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url
 WHERE COALESCE(a.status,'pending') NOT IN ('blank','missing') ORDER BY ${imageOrderSql} LIMIT 1) AS image
 FROM rpm_fmic_catalog
 WHERE ${visibleCatalog}
 AND ${searchConditions(patterns,2)}
 ORDER BY CASE WHEN lower(sku)=lower($1) OR data->>'ean'=$1 OR lower(data->>'mpn')=lower($1) THEN 0 WHEN strpos(lower(name),lower($1))=1 THEN 1 ELSE 2 END,available DESC,sku LIMIT 6`,[q,...patterns]),db.query(`SELECT memberships.path[1] AS name,count(DISTINCT sku)::int AS count FROM rpm_fmic_catalog ${categoryExpansion} WHERE ${visibleCatalog} AND cardinality(memberships.path)>0 AND ${searchConditions(patterns,1)} GROUP BY GROUPING SETS ((memberships.path[1]),()) ORDER BY count DESC,1`,patterns)]);
 return {items:result.rows,categories:groups.rows.filter(row=>row.name!==null),total:Number(groups.rows.find(row=>row.name===null)?.count??0)};
 });
 if(new URL(request.url).pathname!=='/api/catalog/fmic/suggest')return NextResponse.json({...payload,categories:payload.categories.slice(0,4)},{headers});
 const manual=(await getCatalog()).filter(p=>p.visible!==false&&manualCategoryPath(p).length&&matchesSearch(q,[p.name,p.sku,p.brand,p.engine,p.category,p.description,...manualCategoryPath(p),...Object.values(p.attributes??{})]));
 const counts=new Map<string,number>(payload.categories.map(row=>[String(row.name),Number(row.count)]));
 for(const p of manual){const root=manualCategoryPath(p)[0];counts.set(root,(counts.get(root)??0)+1)}
 const local=manual.map(p=>({sku:p.sku,name:p.name,proposed_gross:String(p.price),available:p.stockStatus==='available',manual_stock_status:p.stockStatus,image:p.images?.[0]??null}));
 const rank=(p:{sku:string;name:string})=>p.sku.toLowerCase()===q.toLowerCase()?0:p.name.toLowerCase().startsWith(q.toLowerCase())?1:2;
 const items=[...local,...payload.items.filter(row=>!local.some(p=>p.sku===row.sku))].sort((a,b)=>rank(a)-rank(b)||Number(b.available)-Number(a.available)||a.sku.localeCompare(b.sku)).slice(0,6);
 const categories=[...counts].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'pl')).slice(0,4);
 return NextResponse.json({items,categories,total:payload.total+manual.length},{headers});
 }catch(e){console.error('FMIC suggestions failed',e);return NextResponse.json({error:'Nie udało się pobrać podpowiedzi'},{status:500,headers})}
}
