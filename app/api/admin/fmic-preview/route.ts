import {imageOrderSql} from '../../../lib/fmic-image-ranking';
import {NextResponse} from 'next/server';
import {brandSearchNames} from '../../../lib/brand-search';
import {getDbPool} from '../../../lib/db';
import {fmicSearchFacets} from '../../../lib/fmic-facets';
import {visibleCatalog,categoryExpansion,listingCategoryMembership} from '../../../lib/fmic-category-membership';
import {resolveCategoryPath} from '../../../category-routing';
export const runtime='nodejs';
export const dynamic='force-dynamic';
import {cachedSearch,searchPatterns,searchConditions,listingCacheKeys} from '../../../lib/fmic-search-performance';
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
 const patterns=searchPatterns(q);
 // Exact supplier brand metadata can identify products without the brand in the title.
 // Keep ordinary keyword searches unchanged.
 const brandNames=brandSearchNames(q);
 const brandSql=brandNames.map(n=>"'"+n.replace(/'/g,"''")+"'").join(',');
 const conditions=(start:number)=>brandNames.length?"("+searchConditions(patterns,start)+" OR sku IN (SELECT e.sku FROM rpm_fmic_enrichment e JOIN rpm_fmic_catalog exact ON exact.sku=e.sku WHERE lower(trim(e.data->>'brand')) IN ("+brandSql+") AND e.source_url=exact.data->>'url' AND e.data->>'sku'=exact.sku AND e.data->>'name'=exact.name))":searchConditions(patterns,start);
 const where="WHERE "+visibleCatalog+" AND "+listingCategoryMembership('$1',path)+" AND ($2::text IS NOT NULL) AND "+conditions(6)+" AND ($3='all' OR ($3='available' AND available) OR ($3='unavailable' AND NOT available))";
 try{
 const db=getDbPool();
 const defs=fmicSearchFacets(path);
 const selected=defs.map(d=>(params.get(d.key)??'').slice(0,100));
 const base=[path,q,stock];
 const min=params.get('min'),max=params.get('max');
 const price=(v:string|null)=>v&&/^\d{1,8}(\.\d{1,2})?$/.test(v)?Number(v):null;
 const values=[...base,price(min),price(max),...patterns];
 const facetColumns=defs.map(d=>d.expression+' AS '+d.key).join(',');
 const from=" FROM rpm_fmic_catalog "+where+" AND ($4::numeric IS NULL OR proposed_gross >= $4) AND ($5::numeric IS NULL OR proposed_gross <= $5)) ";
 const source="WITH catalog AS (SELECT sku,name,proposed_gross,available,data->'images' AS images"+(facetColumns?','+facetColumns:'')+from;
 const facetSource="WITH catalog AS MATERIALIZED (SELECT "+facetColumns+from;
 // Keep large product JSON and image-audit lookups out of the sorting step.
 const itemSource="WITH catalog AS (SELECT sku,proposed_gross,available"+(facetColumns?','+facetColumns:'')+from;
 function filtered(except=-1){
 const args:unknown[]=[...values];const conditions:string[]=[];
 defs.forEach((d,i)=>{if(i!==except&&selected[i]){args.push(selected[i]);conditions.push(d.key+'=$'+args.length)}});
 return {args,sql:conditions.length?' WHERE '+conditions.join(' AND '):''};
 }
 const all=filtered();
 const keys=listingCacheKeys({path,q,stock,sort,page,min:price(min),max:price(max),selected});
 const facetArgs:unknown[]=[...values];
 const branches=defs.map((d,i)=>{
 const conditions:string[]=[];
 defs.forEach((other,j)=>{if(i!==j&&selected[j]){facetArgs.push(selected[j]);conditions.push(other.key+'=$'+facetArgs.length)}});
 conditions.push(d.key+' IS NOT NULL');
 return "SELECT '"+d.key+"' AS facet,"+d.key+" AS value,count(*)::int AS count FROM catalog WHERE "+conditions.join(' AND ')+" GROUP BY 1,2";
 });
 const [count,items,facetRows,categories]=await Promise.all([
 cachedSearch(keys.count,15000,async()=> (await db.query(source+'SELECT count(*)::int AS total FROM catalog'+all.sql,all.args)).rows),
 cachedSearch(keys.items,15000,async()=> (await db.query(itemSource+", page_rows AS MATERIALIZED (SELECT sku,proposed_gross,available FROM catalog"+all.sql+' ORDER BY '+order+' LIMIT $'+(all.args.length+1)+' OFFSET $'+(all.args.length+2)+") SELECT p.sku,c.name,p.proposed_gross,p.available,COALESCE(NULLIF(trim(c.data->>'brand'),''),CASE WHEN e.source_url=c.data->>'url' AND e.data->>'sku'=c.sku AND e.data->>'name'=c.name THEN NULLIF(trim(e.data->>'brand'),'') END) AS brand,(SELECT img.url FROM jsonb_array_elements_text(c.data->'images') WITH ORDINALITY AS img(url,pos) LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url WHERE COALESCE(a.status,'pending') NOT IN ('blank','missing') ORDER BY "+imageOrderSql+" LIMIT 1) AS image FROM page_rows p JOIN rpm_fmic_catalog c ON c.sku=p.sku LEFT JOIN rpm_fmic_enrichment e ON e.sku=p.sku ORDER BY "+order.replace(/\b(sku|available|proposed_gross)\b/g,'p.$1'),[...all.args,size,(page-1)*size])).rows),
 branches.length?cachedSearch(keys.facets,15000,async()=> (await db.query(facetSource+branches.join(' UNION ALL '),facetArgs)).rows):Promise.resolve([]),
 q.length>=2?cachedSearch(keys.categories,15000,async()=> (await db.query("SELECT memberships.path AS path,count(*)::int AS count FROM rpm_fmic_catalog "+categoryExpansion+" WHERE "+visibleCatalog+" AND cardinality(memberships.path)>0 AND "+conditions(4)+" AND ($1='all' OR ($1='available' AND available) OR ($1='unavailable' AND NOT available)) AND ($2::numeric IS NULL OR proposed_gross >= $2) AND ($3::numeric IS NULL OR proposed_gross <= $3) GROUP BY memberships.path",[stock,price(min),price(max),...patterns])).rows):Promise.resolve([])
 ]);
 const facets=defs.map(d=>({key:d.key,label:d.label,options:facetRows.filter(row=>row.facet===d.key).map(row=>({value:row.value,count:row.count})).sort(compareOptions)})).filter((d,i)=>d.options.length>1||!!selected[i]);
 const payload={items,total:count[0].total,page,size,path,facets,categories};
 return NextResponse.json(payload,{headers:{'Cache-Control':'private, no-store'}});

 }catch(e){console.error('FMIC preview failed',e);return NextResponse.json({error:'Nie udało się pobrać podglądu'},{status:500})}
}
