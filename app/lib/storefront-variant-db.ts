import {getDbPool} from './db';
import {cachedSearch} from './fmic-search-performance';
import {usableVariantFamily,type StorefrontVariantFamily} from './storefront-variants';
// Read only; no schema setup or catalog-wide detection on a PDP request.
// The approved snapshot is authoritative for identity, current feed for price and availability.
export const storefrontVariantSql=`WITH candidates AS (
 SELECT f.id,f.reviewed_members FROM rpm_variant_families f WHERE f.scope IN ('colors','hel') AND f.decision='approved' AND f.present AND f.fingerprint=f.reviewed_fingerprint AND f.reviewed_members @> jsonb_build_array(jsonb_build_object('sku',$1::text)) LIMIT 2
 ), checked AS (
 SELECT c.id, m->>'color' color,p.sku,p.name,p.proposed_gross::text price,p.available,
 (p.sku IS NOT NULL AND p.mapping_status IN ('exact','normalized','manual') AND jsonb_build_array(p.name,coalesce(p.data->>'brand',''),coalesce(p.data->>'mpn',''),coalesce(p.data->>'ean',''),p.target_category)=jsonb_build_array(m->>'name',m->>'brand',m->>'mpn',m->>'ean',m->'category')) AS valid
 FROM candidates c CROSS JOIN LATERAL jsonb_array_elements(c.reviewed_members) m LEFT JOIN rpm_fmic_catalog p ON p.sku=m->>'sku'
 )
 SELECT id,jsonb_agg(jsonb_build_object('sku',sku,'name',name,'color',color,'price',price,'available',available) ORDER BY color,sku) variants
 FROM checked WHERE (SELECT count(*) FROM candidates)=1 GROUP BY id HAVING count(*) BETWEEN 2 AND 40 AND bool_and(valid IS TRUE) AND count(*)=count(DISTINCT sku) AND count(*)=count(DISTINCT color)`;
export const indexedStorefrontVariantSql=`WITH candidates AS (
 SELECT family_id AS id FROM rpm_variant_members_v1 WHERE sku=$1 LIMIT 2
 ), checked AS (
 SELECT m.family_id AS id,m.color,p.sku,p.name,p.proposed_gross::text price,p.available,
 (p.sku IS NOT NULL AND p.mapping_status IN ('exact','normalized','manual') AND
 jsonb_build_array(p.name,coalesce(p.data->>'brand',''),coalesce(p.data->>'mpn',''),coalesce(p.data->>'ean',''),p.target_category)=m.identity
 AND NOT EXISTS(SELECT 1 FROM rpm_variant_members_v1 other WHERE other.sku=m.sku AND other.family_id<>m.family_id)) AS valid
 FROM candidates c JOIN rpm_variant_members_v1 m ON m.family_id=c.id LEFT JOIN rpm_fmic_catalog p ON p.sku=m.sku
 )
 SELECT id,jsonb_agg(jsonb_build_object('sku',sku,'name',name,'color',color,'price',price,'available',available) ORDER BY color,sku) variants
 FROM checked WHERE (SELECT count(*) FROM candidates)=1 GROUP BY id HAVING count(*) BETWEEN 2 AND 40 AND bool_and(valid IS TRUE) AND count(*)=count(DISTINCT sku) AND count(*)=count(DISTINCT color)`;
export async function readStorefrontVariants(sku:string){
 try{
  const db=getDbPool();
  const indexed=await cachedSearch('listing-variant-index-v1',15000,async()=>{const r=await db.query("SELECT to_regclass('rpm_variant_members_v1') IS NOT NULL AS ready");return r.rows[0]?.ready===true});
  const result=await db.query<StorefrontVariantFamily>(indexed?indexedStorefrontVariantSql:storefrontVariantSql,[sku]);
  return usableVariantFamily(result.rows[0],sku);
 }catch(error){
  // Missing optional table or temporary error must not break a regular product page.
  console.error('Storefront variant family unavailable',error);
  return null;
 }
}
