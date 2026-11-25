import {NextResponse} from 'next/server';
import {setupImageAudit} from '../../../lib/fmic-image-quality';
import {getDbPool} from '../../../lib/db';
import {fmicFacets} from '../../../lib/fmic-facets';
import {resolveCategoryPath} from '../../../category-routing';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const naturalOrder=new Intl.Collator('pl',{numeric:true,sensitivity:'base'});
function numericValue(value:string){
 const match=value.trim().match(/^([+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+))\s*(mm|cm|cc(?:\/min)?|cm3|cm³|bar|psi|hp|km|l\/min|%|°)?$/i);
 if(!match)return null;
 const number=Number(match[1].replace(',','.'));
 return Number.isFinite(number)?{number,unit:(match[2]??'').toLowerCase()}:null;
}
function compareOptions(a:{value:string},b:{value:string}){
 const x=numericValue(a.value),y=numericValue(b.value);
 if(x&&y)return naturalOrder.compare(x.unit,y.unit)||x.number-y.number||naturalOrder.compare(a.value,b.value);
 if(x||y)return x?-1:1;
 return naturalOrder.compare(a.value,b.value);
}
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const path=resolveCategoryPath(params.get('category')??'/sklep');
 if(!path?.length)return NextResponse.json({error:'Wybierz kategorię sklepu'},{status:400});
 const raw=Number(params.get('page')??1),page=Number.isSafeInteger(raw)?Math.max(1,Math.min(10000,raw)):1,size=24;
 const q=(params.get('q')??'').trim().slice(0,120);
 const sort=params.get('sort');
 const stock=params.get('stock')==='available'?'available':params.get('stock')==='unavailable'?'unavailable':'all';
 const order=sort==='priceAsc'?'proposed_gross ASC, sku ASC':sort==='priceDesc'?'proposed_gross DESC, sku ASC':'available DESC, sku ASC';
 const where="WHERE mapping_status IN ('exact','normalized','manual') AND target_category[1:cardinality($1::text[])]=$1::text[] AND ($2='' OR strpos(lower(name),lower($2))>0 OR strpos(lower(sku),lower($2))>0) AND ($3='all' OR ($3='available' AND available) OR ($3='unavailable' AND NOT available))";
 try{
 await setupImageAudit();
 const db=getDbPool();
 const defs=fmicFacets(path).slice(0,5);
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
 db.query(source+'SELECT sku,name,proposed_gross,available,(SELECT img.url FROM jsonb_array_elements_text(images) WITH ORDINALITY AS img(url,pos) LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url WHERE COALESCE(a.status,'pending') NOT IN ('blank','missing') ORDER BY img.pos LIMIT 1) AS image FROM catalog'+all.sql+' ORDER BY '+order+' LIMIT $'+(all.args.length+1)+' OFFSET $'+(all.args.length+2),[...all.args,size,(page-1)*size]),
 ...defs.map((d,i)=>{const f=filtered(i);return db.query(source+'SELECT '+d.key+' AS value,count(*)::int AS count FROM catalog'+f.sql+(f.sql?' AND ':' WHERE ')+d.key+' IS NOT NULL GROUP BY 1 ORDER BY 1',f.args)})
 ]);
 const facets=defs.map((d,i)=>({key:d.key,label:d.label,options:facetRows[i].rows.sort(compareOptions)})).filter((d,i)=>d.options.length>1||!!selected[i]);
 return NextResponse.json({items:items.rows,total:count.rows[0].total,page,size,path,facets},{headers:{'Cache-Control':'private, no-store'}});

 }catch(e){console.error('FMIC preview failed',e);return NextResponse.json({error:'Nie udało się pobrać podglądu'},{status:500})}
}
