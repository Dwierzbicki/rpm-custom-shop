import {imageOrderSql,imagePrioritySql} from '../../../../lib/fmic-image-ranking';
import {NextResponse} from 'next/server';
import {getCatalog} from '../../../../lib/catalog-db';
import {manualCategoryPath} from '../../../../category-routing';
import {parseProductTechnical,mergeTechnicalFields} from '../../../../lib/fmic-technical';
import {reviewedProductSpec} from '../../../../lib/reviewed-product-specs';
import {fmicSearchFacets,fmicProducerExpression} from '../../../../lib/fmic-facets';
import {setupEnrichment} from '../../../../lib/fmic-enrichment';
import {getDbPool} from '../../../../lib/db';
import {visibleCatalog,primaryCategory,categoryMembership} from '../../../../lib/fmic-category-membership';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const sku=new URL(request.url).searchParams.get('sku')??'';
 const headers={'Cache-Control':'private, no-store'};
 if(!sku||sku.length>120)return NextResponse.json({error:'Nieprawidłowy SKU'},{status:400,headers});
 try{
 const db=getDbPool();
 if(new URL(request.url).pathname==='/api/catalog/fmic/product'){
  const catalog=(await getCatalog()).filter(p=>p.visible!==false);
  const manual=catalog.find(p=>p.sku===sku);
  if(manual){
   const target_category=manualCategoryPath(manual);
   const attributeKeys:Record<string,string>={'Długość między osiami':'rod_length','Długość korbowodu (mm)':'rod_length','Profil':'rod_type','Numer katalogowy':'mpn'};
   const fields=Object.entries(manual.attributes??{}).filter(([,value])=>value.trim()).map(([label,value])=>({key:attributeKeys[label]??'manual:'+label,label,value}));
   const product={sku:manual.sku,name:manual.name,proposed_gross:String(manual.price),available:manual.stockStatus!=='unavailable',images:manual.images??[],target_category,ean:manual.attributes?.EAN??'',mpn:manual.attributes?.['Numer katalogowy']??'',brand:manual.brand,shipping_weight:'',description:manual.description,technical:{intro:manual.description,fields,warranty:''},manual_id:manual.id,manual_stock_status:manual.stockStatus,leadTime:manual.leadTime,configurable:!!manual.configurable,optionGroups:manual.optionGroups??[]};
   const relatedManual=catalog.filter(p=>p.id!==manual.id&&target_category.length>0&&target_category.every((name,i)=>manualCategoryPath(p)[i]===name)).slice(0,4).map(p=>({sku:p.sku,name:p.name,proposed_gross:String(p.price),available:p.stockStatus!=='unavailable',image:p.images?.[0]??null}));
   const related=target_category.length&&relatedManual.length<4?await db.query("SELECT sku,name,proposed_gross,available,(SELECT img.url FROM jsonb_array_elements_text(data->'images') WITH ORDINALITY AS img(url,pos) LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url WHERE COALESCE(a.status,'pending') NOT IN ('blank','missing') ORDER BY "+imageOrderSql+" LIMIT 1) AS image FROM rpm_fmic_catalog WHERE "+categoryMembership('$1')+" AND "+visibleCatalog+" ORDER BY available DESC,sku LIMIT $2",[target_category,4-relatedManual.length]):{rows:[]};
   return NextResponse.json({product,related:[...relatedManual,...related.rows]},{headers});
  }
 }
 const result=await db.query("SELECT sku,name,proposed_gross,available,"+primaryCategory+" AS target_category,COALESCE((SELECT jsonb_agg(url ORDER BY priority,pos) FROM (SELECT DISTINCT ON (COALESCE(a.hash,img.url)) img.url,img.pos,"+imagePrioritySql+" AS priority FROM jsonb_array_elements_text(data->'images') WITH ORDINALITY AS img(url,pos) LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url WHERE COALESCE(a.status,'pending') NOT IN ('blank','missing') ORDER BY COALESCE(a.hash,img.url),"+imageOrderSql+") cleaned),'[]'::jsonb) AS images,data->>'ean' AS ean,data->>'mpn' AS mpn,("+fmicProducerExpression+") AS brand,data->>'shipping_weight_raw' AS shipping_weight FROM rpm_fmic_catalog WHERE sku=$1 AND "+visibleCatalog,[sku]);
 const product=result.rows[0];
 if(!product)return NextResponse.json({error:'Nie znaleziono produktu'},{status:404,headers});
 await setupEnrichment();
 const description=await db.query('SELECT description,brand,technical FROM rpm_fmic_product_descriptions WHERE sku=$1 AND published=true',[sku]);
 if(description.rows[0]){const row=description.rows[0];product.description=row.description;if(!product.brand&&row.brand)product.brand=row.brand;product.technical=parseProductTechnical(product.name,row.description,product.target_category??[],sku);}
 const defs=fmicSearchFacets(product.target_category??[]).filter(f=>f.key!=='producer');
 const parameters=defs.length?(await db.query('SELECT '+defs.map(f=>f.expression+' AS '+f.key).join(',')+' FROM rpm_fmic_catalog WHERE sku=$1',[sku])).rows[0]:{};
 product.technical=mergeTechnicalFields(product.technical??parseProductTechnical(product.name,'',product.target_category??[],sku),defs.map(f=>({key:f.key,label:f.label,value:String(parameters?.[f.key]??'')})));
 const reviewed=await reviewedProductSpec(product.sku,product.name).catch(e=>{console.error('Verified product data unavailable',e);return undefined});
 if(reviewed){
  const existing=product.technical.fields.filter((f:{key:string})=>!reviewed.fields.some(r=>r.key===f.key));
  product.technical={...product.technical,intro:reviewed.description||product.technical.intro,fields:[...reviewed.fields,...existing]};
  product.spec_sources=reviewed.sources;
 }
 const related=await db.query("SELECT sku,name,proposed_gross,available,(SELECT img.url FROM jsonb_array_elements_text(data->'images') WITH ORDINALITY AS img(url,pos) LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url WHERE COALESCE(a.status,'pending') NOT IN ('blank','missing') ORDER BY "+imageOrderSql+" LIMIT 1) AS image FROM rpm_fmic_catalog WHERE "+categoryMembership('$1')+" AND sku<>$2 AND "+visibleCatalog+" ORDER BY available DESC,sku LIMIT 4",[product.target_category,sku]);
 return NextResponse.json({product,related:related.rows},{headers});
 }catch(e){console.error('FMIC product preview failed',e);return NextResponse.json({error:'Nie udało się pobrać produktu'},{status:500,headers})}
}
