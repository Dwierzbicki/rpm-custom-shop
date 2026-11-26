import {colorTerms,helColors,type VariantScope} from './variant-rules';
import {visibleCatalog} from './fmic-category-membership';
const quote=(value:string)=>"'"+value.replace(/'/g,"''")+"'";
const values=(rows:readonly (readonly string[])[])=>rows.map(r=>'('+r.map(quote).join(',')+')').join(',');
/** Fixed rule SQL, no user input. Each SKU can participate in only one rule scope. */
export function variantCandidateSql(scope:VariantScope,restrictHelToRequested=false){
 const hel="(target_category @> ARRAY['Przewody hamulcowe HEL']::text[] OR target_category @> ARRAY['Przewody sprzęgła']::text[])";
 // Enumerate all supported HEL colours for each selected stored SKU base.
 // This includes colours absent from the old snapshot; full scanning is unchanged.
 const restriction=scope==='hel'&&restrictHelToRequested?
  " AND sku IN (SELECT b.base||'-'||s.suffix FROM (SELECT DISTINCT regexp_replace(m->>'sku','-[A-Z]+$','') AS base FROM requested r JOIN rpm_variant_families f ON f.id=r.id AND f.fingerprint=r.fingerprint CROSS JOIN LATERAL jsonb_array_elements(f.members) m WHERE f.scope='hel' AND f.present AND f.decision='pending') b CROSS JOIN (VALUES "+values(helColors.map(c=>[c[0]]))+") s(suffix))":"";
 const common="SELECT sku,name,target_category,COALESCE(data->>'brand','') brand,COALESCE(data->>'mpn','') mpn,COALESCE(data->>'ean','') ean,proposed_gross,available,regexp_replace(trim(name),'[[:space:]]+',' ','g') clean FROM rpm_fmic_catalog WHERE "+visibleCatalog+" AND "+(scope==='hel'?hel:"NOT "+hel)+restriction;
 const pattern=" ("+Object.keys(colorTerms).join('|')+")$";
 const parsed=scope==='colors'?
 `SELECT x.*, 'suffix-color-v1' AS rule,regexp_replace(lower(clean),${quote(pattern)},'') family,'' AS base,m.color FROM x JOIN (VALUES ${values(Object.entries(colorTerms))}) m(token,color) ON m.token=substring(lower(clean) from ${quote(pattern)})`:
 `SELECT x.*,CASE WHEN target_category @> ARRAY['Przewody hamulcowe HEL']::text[] THEN 'hel-brake-v1' ELSE 'hel-clutch-v1' END AS rule,
 CASE WHEN target_category @> ARRAY['Przewody hamulcowe HEL']::text[] THEN replace(lower(clean),' '||m.brake||' przewody hamulcowe hel ',' przewody hamulcowe hel ') ELSE replace(lower(clean),' '||m.clutch||' przewód sprzęgła hel ',' przewód sprzęgła hel ') END family,
 regexp_replace(sku,'-[A-Z]+$','') base,m.color FROM x JOIN (VALUES ${values(helColors)}) m(suffix,brake,clutch,color) ON sku LIKE '%-'||m.suffix AND
 (CASE WHEN target_category @> ARRAY['Przewody hamulcowe HEL']::text[] THEN strpos(lower(clean),' '||m.brake||' przewody hamulcowe hel ') ELSE strpos(lower(clean),' '||m.clutch||' przewód sprzęgła hel ') END)>0`;
 return `WITH x AS (${common}), parsed AS (${parsed}), families AS (
 SELECT md5(jsonb_build_array(rule,target_category,lower(trim(brand)),base,family)::text) id,rule,family title,target_category category,
 jsonb_agg(jsonb_build_object('sku',sku,'name',name,'color',color,'brand',brand,'mpn',mpn,'ean',ean,'category',target_category,'price',proposed_gross,'available',available) ORDER BY sku) members,
 md5(jsonb_agg(jsonb_build_array(sku,name,color,brand,mpn,ean,target_category) ORDER BY sku)::text) fingerprint
 FROM parsed WHERE family<>'' GROUP BY rule,target_category,lower(trim(brand)),base,family HAVING count(*) BETWEEN 2 AND 40 AND count(*)=count(DISTINCT color) AND count(*)=count(DISTINCT sku))
 SELECT * FROM families`;
}
export const variantStatusSql="CASE WHEN NOT present OR (decision<>'pending' AND reviewed_fingerprint IS DISTINCT FROM fingerprint) THEN 'conflict' ELSE decision END";
