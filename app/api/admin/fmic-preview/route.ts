import {NextResponse} from 'next/server';
import {setupImageAudit} from '../../../lib/fmic-image-quality';
import {getDbPool} from '../../../lib/db';
import {fmicFacets,fmicSearchFacets} from '../../../lib/fmic-facets';
import {resolveCategoryPath} from '../../../category-routing';
export const runtime='nodejs';
export const dynamic='force-dynamic';
import {compareOptions} from '../../../lib/fmic-filter-order';
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const path=resolveCategoryPath(params.get('category')??'/sklep');
 if(!path)return NextResponse.json({error:'Wybierz kategorię sklepu'},{status:400});
 const raw=Number(params.get('page')??1),page=Number.isSafeInteger(raw)?Math.max(1,Math.min(10000,raw)):1,size=24;
 const q=(params.get('q')??'').trim().slice(0,120);
 if(!path.length&&q.length<2)return NextResponse.json({items:[],total:0,page,size,path,facets:[]});
 const sort=params.get('sort');
 const stock=params.get('stock')==='available'?'available':params.get('stock')==='unavailable'?'unavailable':'all';
 const order=sort==='priceAsc'?'proposed_gross ASC, sku ASC':sort==='priceDesc'?'proposed_gross DESC, sku ASC':'available DESC, sku ASC';
 const where="WHERE mapping_status IN ('exact','normalized','manual') AND (cardinality($1::text[])=0 OR target_category[1:cardinality($1::text[])]=$1::text[]) AND NOT EXISTS (SELECT 1 FROM regexp_split_to_table(lower(trim($2)), '[[:space:]]+') AS token WHERE token<>'' AND strpos(lower(concat_ws(' ',name,sku,data->>'ean',data->>'mpn')),token)=0) AND ($3='all' OR ($3='available' AND available) OR ($3='unavailable' AND NOT available))";
 try{
 await setupImageAudit();
 const db=getDbPool();
 const defs=q.length>=2?fmicSearchFacets(path):fmicFacets(path).slice(0,5);
 const selected=defs.map(d=>(params.get(d.key)??'').slice(0,100));
 const base=[path,q,stock];
 const min=params.get('min'),max=params.get('max');
 const price=(v:string|null)=>v&&/^\d{1,8}(\.\d{1,2})?$/.test(v)?Number(v):null;
 const values=[...base,price(min),price(max)];
 const source="WITH catalog AS (SELECT sku,name,proposed_gross,available,data->'images' AS images"+defs.map(d=>','+d.expression+' AS '+d.key).join('')+" FROM rpm_fmic_catalog "+where+" AND ($4::numeric IS NULL OR proposed_gross >= $4) AND ($5::numeric IS NULL OR proposed_gross <= $5)) ";
 function filtered(except=-1){
 const args:unknown[]=[...values];const conditions:string[]=[];
 defs.forEach((d,i)=>{if(i!==except&&selected[i]){args.push(selected[i]);conditions.push(d.key+'=$'+args.length)}});
 return {args,sql:conditions.length?' WHERE '+conditions.join(' AND '):''};
 }
 const all=filtered();
 const [count,items,...facetRows]=await Promise.all([
 db.query(source+'SELECT count(*)::int AS total FROM catalog'+all.sql,all.args),
 db.query(source+"SELECT sku,name,proposed_gross,available,(SELECT img.url FROM jsonb_array_elements_text(images) WITH ORDINALITY AS img(url,pos) LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url WHERE COALESCE(a.status,'pending') NOT IN ('blank','missing') ORDER BY img.pos LIMIT 1) AS image FROM catalog"+all.sql+' ORDER BY '+order+' LIMIT $'+(all.args.length+1)+' OFFSET $'+(all.args.length+2),[...all.args,size,(page-1)*size]),
 ...defs.map((d,i)=>{const f=filtered(i);return db.query(source+'SELECT '+d.key+' AS value,count(*)::int AS count FROM catalog'+f.sql+(f.sql?' AND ':' WHERE ')+d.key+' IS NOT NULL GROUP BY 1 ORDER BY 1',f.args)})
 ]);
 const categories=q.length>=2?await db.query("SELECT target_category AS path,count(*)::int AS count FROM rpm_fmic_catalog WHERE mapping_status IN ('exact','normalized','manual') AND cardinality(target_category)>0 AND NOT EXISTS (SELECT 1 FROM regexp_split_to_table(lower(trim($1)), '[[:space:]]+') AS token WHERE token<>'' AND strpos(lower(concat_ws(' ',name,sku,data->>'ean',data->>'mpn')),token)=0) AND ($2='all' OR ($2='available' AND available) OR ($2='unavailable' AND NOT available)) AND ($3::numeric IS NULL OR proposed_gross >= $3) AND ($4::numeric IS NULL OR proposed_gross <= $4) GROUP BY target_category",[q,stock,price(min),price(max)]):{rows:[]};
 const facets=defs.map((d,i)=>({key:d.key,label:d.label,options:facetRows[i].rows.sort(compareOptions)})).filter((d,i)=>d.options.length>1||!!selected[i]);
 return NextResponse.json({items:items.rows,total:count.rows[0].total,page,size,path,facets,categories:categories.rows},{headers:{'Cache-Control':'private, no-store'}});

 }catch(e){console.error('FMIC preview failed',e);return NextResponse.json({error:'Nie udało się pobrać podglądu'},{status:500})}
}
