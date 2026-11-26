import {imageOrderSql} from '../../../lib/fmic-image-ranking';
import {NextResponse} from 'next/server';
import {brandSearchNames} from '../../../lib/brand-search';
import {getDbPool} from '../../../lib/db';
import {fmicSearchFacets} from '../../../lib/fmic-facets';
import {visibleCatalog,categoryExpansion,listingCategoryMembership} from '../../../lib/fmic-category-membership';
import {getCatalog} from '../../../lib/catalog-db';
import {matchesSearch} from '../../../lib/header-search';
import {createHash} from 'node:crypto';
import {manualCategoryPath,resolveCategoryPath} from '../../../category-routing';
export const runtime='nodejs';
export const dynamic='force-dynamic';
import {cachedSearch,searchPatterns,searchConditions,listingCacheKeys} from '../../../lib/fmic-search-performance';
import {compareOptions} from '../../../lib/fmic-filter-order';
import {listingVariantCtes,variantListingJoin,listingCount,listingRepresentatives} from '../../../lib/listing-variants';
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const path=resolveCategoryPath(params.get('category')??'/sklep');
 if(!path)return NextResponse.json({error:'Wybierz kategorię sklepu'},{status:400});
 const raw=Number(params.get('page')??1),page=Number.isSafeInteger(raw)?Math.max(1,Math.min(10000,raw)):1,size=24;
 const q=(params.get('q')??'').trim().slice(0,120);
 const includeManual=new URL(request.url).pathname==='/api/catalog/fmic';
 // The public storefront root is a browsable catalogue; preserve the admin preview guard.
 if(!includeManual&&!path.length&&q.length<2)return NextResponse.json({items:[],total:0,page,size,path,facets:[],includesManual:includeManual});
 const showCategories=q.length>=2||(!path.length&&includeManual);
 const sort=params.get('sort');
 const stock=params.get('stock')==='available'?'available':params.get('stock')==='unavailable'?'unavailable':'all';
 const supplierOrder=sort==='priceAsc'?'proposed_gross ASC, sku ASC':sort==='priceDesc'?'proposed_gross DESC, sku ASC':'available DESC, sku ASC';
 const patterns=searchPatterns(q);
 // Exact supplier brand metadata can identify products without the brand in the title.
 // Keep ordinary keyword searches unchanged.
 const brandNames=brandSearchNames(q);
 const brandSql=brandNames.map(n=>"'"+n.replace(/'/g,"''")+"'").join(',');
 const conditions=(start:number)=>brandNames.length?"("+searchConditions(patterns,start)+" OR sku IN (SELECT e.sku FROM rpm_fmic_enrichment e JOIN rpm_fmic_catalog exact ON exact.sku=e.sku WHERE lower(trim(e.data->>'brand')) IN ("+brandSql+") AND e.source_url=exact.data->>'url' AND e.data->>'sku'=exact.sku AND e.data->>'name'=exact.name))":searchConditions(patterns,start);
 const where="WHERE "+visibleCatalog+" AND "+listingCategoryMembership('$1',path)+" AND ($2::text IS NOT NULL) AND "+conditions(6)+" AND ($3='all' OR ($3='available' AND available) OR ($3='unavailable' AND NOT available))";
 try{
 const db=getDbPool();
 // Keep original indexed fast path when no family has been approved or optional table is absent.
 const grouped=includeManual&&await cachedSearch('listing-variant-enabled-v1',15000,async()=>{
  try{const exists=await db.query("SELECT to_regclass('rpm_variant_families') IS NOT NULL AS present");if(!exists.rows[0]?.present)return false;
   const result=await db.query("SELECT EXISTS(SELECT 1 FROM rpm_variant_families WHERE decision='approved' AND present AND fingerprint=reviewed_fingerprint) AS enabled");return result.rows[0]?.enabled===true;
  }catch(e){console.error('Variant listing availability check failed',e);return false}
 });
 const variantCte=grouped?listingVariantCtes+', ':'';
 const variantColumns=grouped?',family_id,variant_count':'';
 const manualVariantColumns=grouped?',NULL::text AS family_id,NULL::integer AS variant_count':'';
 const countSql=listingCount(grouped);
 const defs=fmicSearchFacets(path);
 const selected=defs.map(d=>(params.get(d.key)??'').slice(0,100));
 const base=[path,q,stock];
 const min=params.get('min'),max=params.get('max');
 const price=(v:string|null)=>v&&/^\d{1,8}(\.\d{1,2})?$/.test(v)?Number(v):null;
 const lower=price(min),upper=price(max);
 const manualGlobal=includeManual?(await getCatalog()).filter(p=>p.visible!==false).flatMap(p=>{
  const target_category=manualCategoryPath(p);if(!target_category.length)return [];
  const available=p.stockStatus==='available';
  if(q&&!matchesSearch(q,[p.name,p.sku,p.brand,p.engine,p.category,p.description,...target_category,...Object.values(p.attributes??{})]))return [];
  if(stock!=='all'&&(stock==='available')!==available)return [];
  if((lower!==null&&p.price<lower)||(upper!==null&&p.price>upper))return [];
  const numeric=(value?:string)=>{const m=value?.trim().match(/^([0-9]+(?:[.,][0-9]+)?)(?:\s*mm)?$/i);return m?String(Number(m[1].replace(',','.'))):null};
  const profile=p.attributes?.['Profil']?.trim().toUpperCase();
  const facetValues:Record<string,string|null>={};
  for(const def of defs){
   if(def.key==='producer')continue;
   const raw=p.attributes?.[def.key]??p.attributes?.[def.label];
   if(!raw?.trim())continue;
   const unit=def.label.match(/\((mm|cm|ml|cc\/min|l\/h|PSI)\)/i)?.[1];
   if(unit){const m=raw.trim().match(/^([0-9]+(?:[.,][0-9]+)?)(?:\s*[a-zA-Z/]+)?$/);facetValues[def.key]=m?String(Number(m[1].replace(',','.'))):raw.trim()}
   else if(def.key==='compression')facetValues[def.key]=raw.trim().replace(/\s*:\s*1$/,'').replace(',','.');
   else facetValues[def.key]=raw.trim();
  }
  if(target_category.includes('Kute korbowody')){
   facetValues.rod_length=numeric(p.attributes?.['Długość między osiami']??p.attributes?.['Długość korbowodu (mm)']??p.attributes?.rod_length)??facetValues.rod_length??null;
   facetValues.rod_type=profile&&['H','I','X'].includes(profile)?profile+'-Beam':facetValues.rod_type??null;
  }
  return [{sku:p.sku,name:p.name,proposed_gross:p.price,available,manual_id:p.id,manual_stock_status:p.stockStatus,target_category,data:{brand:p.brand,images:p.images??[],facetValues},mapping_status:'manual'}];
 }):[];
 const manualRows=manualGlobal.filter(p=>path.every((name,i)=>p.target_category[i]===name));
 const mixed=manualRows.length>0;
 const order=supplierOrder;
 const manualParameter=6+patterns.length;
 const values:unknown[]=[...base,lower,upper,...patterns,...(mixed?[JSON.stringify(manualRows)]:[])];
 const manualCte=mixed?'manual_rows AS MATERIALIZED (SELECT * FROM jsonb_to_recordset($'+manualParameter+'::jsonb) AS m(sku text,name text,proposed_gross numeric,available boolean,manual_id integer,manual_stock_status text,target_category text[],data jsonb,mapping_status text)), ':'';
 const manualFacets=defs.map(d=>"COALESCE(NULLIF(data->'facetValues'->>'"+d.key+"',''),"+d.expression+") AS "+d.key).join(',');
 const manualSelect=(columns:string)=>mixed?' UNION ALL SELECT '+columns+(manualFacets?','+manualFacets:'')+manualVariantColumns+' FROM manual_rows':'';
 const manualId=mixed?',NULL::integer AS manual_id':'';
 const facetColumns=defs.map(d=>d.expression+' AS '+d.key).join(',');
 const from=" FROM rpm_fmic_catalog "+(grouped?variantListingJoin:"")+where+" AND ($4::numeric IS NULL OR proposed_gross >= $4) AND ($5::numeric IS NULL OR proposed_gross <= $5)";
 const source="WITH "+variantCte+manualCte+"catalog AS (SELECT sku,name,proposed_gross,available,data->'images' AS images"+(facetColumns?','+facetColumns:'')+variantColumns+from+manualSelect("sku,name,proposed_gross,available,data->'images' AS images")+") ";
 const facetSource="WITH "+variantCte+manualCte+"catalog AS MATERIALIZED (SELECT "+facetColumns+variantColumns+from+(mixed?' UNION ALL SELECT '+manualFacets+manualVariantColumns+' FROM manual_rows':'')+") ";
 const itemSource="WITH "+variantCte+manualCte+"catalog AS (SELECT sku,proposed_gross,available"+manualId+(facetColumns?','+facetColumns:'')+variantColumns+from+manualSelect("sku,proposed_gross,available,manual_id")+") ";
 const manualKey=mixed?':manual:'+createHash('sha256').update(JSON.stringify(manualRows)).digest('hex'):'';
 const listingKey=(key:string)=>key+':v4:'+String(includeManual)+':groups:'+String(grouped)+manualKey;
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
 return "SELECT '"+d.key+"' AS facet,"+d.key+" AS value,"+countSql+" AS count FROM catalog WHERE "+conditions.join(' AND ')+" GROUP BY 1,2";
 });
 const pageColumns='sku,proposed_gross,available'+(mixed?',manual_id':'')+variantColumns;
 const pageSource=grouped?itemSource+listingRepresentatives(pageColumns,all.sql,sort):itemSource;
 const pageFrom=grouped?' FROM representatives':' FROM catalog'+all.sql;
 const [count,items,facetRows,categories]=await Promise.all([
 cachedSearch(listingKey(keys.count),15000,async()=> (await db.query(source+'SELECT '+countSql+' AS total FROM catalog'+all.sql,all.args)).rows),
 cachedSearch(listingKey(keys.items),15000,async()=> (await db.query(pageSource+", page_rows AS MATERIALIZED (SELECT "+pageColumns+pageFrom+' ORDER BY '+order+' LIMIT $'+(all.args.length+1)+' OFFSET $'+(all.args.length+2)+") SELECT p.sku,"+(mixed?'COALESCE(m.name,c.name)':'c.name')+" AS name,p.proposed_gross,p.available,"+(grouped?"p.family_id AS variant_family_id,p.variant_count,":"")+(mixed?"p.manual_id,m.manual_stock_status,COALESCE(m.data->>'brand',":"")+"COALESCE(NULLIF(trim(c.data->>'brand'),''),CASE WHEN e.source_url=c.data->>'url' AND e.data->>'sku'=c.sku AND e.data->>'name'=c.name THEN NULLIF(trim(e.data->>'brand'),'') END)"+(mixed?')':'')+" AS brand,"+(mixed?"COALESCE(m.data->'images'->>0,":"")+"(SELECT img.url FROM jsonb_array_elements_text(c.data->'images') WITH ORDINALITY AS img(url,pos) LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url WHERE COALESCE(a.status,'pending') NOT IN ('blank','missing') ORDER BY "+imageOrderSql+" LIMIT 1)"+(mixed?')':'')+" AS image FROM page_rows p "+(mixed?"LEFT JOIN rpm_fmic_catalog c ON c.sku=p.sku AND p.manual_id IS NULL LEFT JOIN manual_rows m ON m.manual_id=p.manual_id":"JOIN rpm_fmic_catalog c ON c.sku=p.sku")+" LEFT JOIN rpm_fmic_enrichment e ON e.sku=c.sku ORDER BY "+order.replace(/\b(sku|available|proposed_gross|manual_id)\b/g,'p.$1'),[...all.args,size,(page-1)*size])).rows),
 branches.length?cachedSearch(listingKey(keys.facets),15000,async()=> (await db.query(facetSource+branches.join(' UNION ALL '),facetArgs)).rows):Promise.resolve([]),
 showCategories?cachedSearch(keys.categories+':v4:groups:'+String(grouped),15000,async()=> (await db.query((grouped?"WITH "+listingVariantCtes+" ":"")+"SELECT memberships.path AS path,"+countSql+" AS count FROM rpm_fmic_catalog "+(grouped?variantListingJoin:"")+categoryExpansion+" WHERE "+visibleCatalog+" AND cardinality(memberships.path)>0 AND "+conditions(4)+" AND ($1='all' OR ($1='available' AND available) OR ($1='unavailable' AND NOT available)) AND ($2::numeric IS NULL OR proposed_gross >= $2) AND ($3::numeric IS NULL OR proposed_gross <= $3) GROUP BY memberships.path",[stock,price(min),price(max),...patterns])).rows):Promise.resolve([])
 ]);
 const facets=defs.map(d=>({key:d.key,label:d.label,options:facetRows.filter(row=>row.facet===d.key).map(row=>({value:row.value,count:row.count})).sort(compareOptions)})).filter((d,i)=>d.options.length>1||!!selected[i]||(d.key==='producer'&&d.options.some(o=>o.value==='RPM Custom')));
 const categoryCounts=new Map<string,{path:string[];count:number}>(categories.map(row=>[JSON.stringify(row.path),{path:row.path,count:Number(row.count)}]));
 if(showCategories)for(const p of manualGlobal){const key=JSON.stringify(p.target_category),current=categoryCounts.get(key);categoryCounts.set(key,{path:p.target_category,count:(current?.count??0)+1})}
 const payload={items,total:count[0].total,page,size,path,facets,categories:[...categoryCounts.values()],includesManual:includeManual};
 return NextResponse.json(payload,{headers:{'Cache-Control':'private, no-store'}});

 }catch(e){console.error('FMIC preview failed',e);return NextResponse.json({error:'Nie udało się pobrać podglądu'},{status:500})}
}
