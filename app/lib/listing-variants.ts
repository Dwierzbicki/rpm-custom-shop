const variantConflictTail=` ), variant_overlap AS (
 SELECT variant_sku FROM variant_checked GROUP BY variant_sku HAVING count(*)>1
 ), variant_conflicted_families AS MATERIALIZED (
 SELECT DISTINCT vc.family_id FROM variant_checked vc JOIN variant_overlap vo USING(variant_sku)
 )`;
const variantValidationTail=variantConflictTail+`, valid_variant_families AS (
 SELECT vc.family_id,count(*)::int AS variant_count FROM variant_checked vc
 LEFT JOIN variant_conflicted_families bad ON bad.family_id=vc.family_id
 WHERE bad.family_id IS NULL
 GROUP BY vc.family_id HAVING count(*) BETWEEN 2 AND 40 AND bool_and(valid IS TRUE)
 AND count(*)=count(DISTINCT variant_color) AND count(*)=count(DISTINCT variant_sku)
 ), variant_members AS MATERIALIZED (
 SELECT vc.variant_sku,vc.family_id,vc.variant_color,vf.variant_count FROM variant_checked vc JOIN valid_variant_families vf USING(family_id)
 )`;
// SQL reads only stored, explicitly approved families. No name parsing or grouping of raw feed here.
export const listingVariantCtes=`approved_variants AS MATERIALIZED (
 SELECT id,reviewed_members FROM rpm_variant_families
 WHERE scope IN ('colors','hel') AND decision='approved' AND present AND fingerprint=reviewed_fingerprint
 ), variant_checked AS MATERIALIZED (
 SELECT f.id AS family_id,m->>'sku' AS variant_sku,m->>'color' AS variant_color,
 (p.sku IS NOT NULL AND p.mapping_status IN ('exact','normalized','manual') AND
 jsonb_build_array(p.name,coalesce(p.data->>'brand',''),coalesce(p.data->>'mpn',''),coalesce(p.data->>'ean',''),p.target_category)
 =jsonb_build_array(m->>'name',m->>'brand',m->>'mpn',m->>'ean',m->'category')) AS valid
 FROM approved_variants f CROSS JOIN LATERAL jsonb_array_elements(f.reviewed_members) m LEFT JOIN rpm_fmic_catalog p ON p.sku=m->>'sku'
${variantValidationTail}`;
export const variantListingJoin=' LEFT JOIN variant_members ON variant_sku=rpm_fmic_catalog.sku ';
export function listingCount(grouped:boolean){
 return grouped?'(count(*)-count(family_id)+count(DISTINCT family_id))::int':'count(*)::int';
}
export function representativeOrder(sort:string|null){
 const price=sort==='priceDesc'?'proposed_gross DESC NULLS LAST, sku ASC':sort==='priceAsc'?'proposed_gross ASC NULLS LAST, sku ASC':'available DESC, proposed_gross ASC NULLS LAST, sku ASC';
 return '(lower(sku)=lower($2::text)) DESC, '+price;
}
export function listingRepresentatives(columns:string,filter:string,sort:string|null){
 return ', filtered_rows AS MATERIALIZED (SELECT '+columns+' FROM catalog'+filter+'), representatives AS (SELECT '+columns+' FROM filtered_rows WHERE family_id IS NULL UNION ALL SELECT '+columns+' FROM (SELECT DISTINCT ON (family_id) '+columns+' FROM filtered_rows WHERE family_id IS NOT NULL ORDER BY family_id, '+representativeOrder(sort)+') family_representatives)';
}

/** Category counts for searches are global. Shared intake/exhaust components have two roots. */
export function listingVariantScope(path:string[],showCategories:boolean):string|null{
 return !showCategories&&path.length>0&&!['Układ dolotowy','Układ wydechowy'].includes(path[0])?path[0]:null;
}

// Same live identity validation and overlap rejection as JSON fallback.
export const indexedListingVariantCtes=`variant_checked AS MATERIALIZED (
 SELECT m.family_id,m.sku AS variant_sku,m.color AS variant_color,
 (p.sku IS NOT NULL AND p.mapping_status IN ('exact','normalized','manual') AND
 jsonb_build_array(p.name,coalesce(p.data->>'brand',''),coalesce(p.data->>'mpn',''),coalesce(p.data->>'ean',''),p.target_category)=m.identity) AS valid
 FROM rpm_variant_members_v1 m LEFT JOIN rpm_fmic_catalog p ON p.sku=m.sku${variantValidationTail}`;

// Storefront lookup retains one row per SKU, with NULL membership for invalid or
// overlapping families. Unlike the active-members-only CTE, its row estimate is
// not collapsed by selective HAVING clauses, preventing repeated full CTE scans.
const variantLookupTail=`, variant_family_stats AS MATERIALIZED (
 SELECT family_id,count(*)::int variant_count,
 (count(*) BETWEEN 2 AND 40 AND bool_and(valid IS TRUE)
 AND count(*)=count(DISTINCT variant_color) AND count(*)=count(DISTINCT variant_sku)) AS valid
 FROM variant_checked GROUP BY family_id
 ), variant_members AS MATERIALIZED (
 SELECT vc.variant_sku,
 CASE WHEN count(*)=1 THEN max(CASE WHEN vf.valid AND bad.family_id IS NULL THEN vc.family_id END) END AS family_id,
 CASE WHEN count(*)=1 THEN max(CASE WHEN vf.valid AND bad.family_id IS NULL THEN vc.variant_color END) END AS variant_color,
 CASE WHEN count(*)=1 THEN max(CASE WHEN vf.valid AND bad.family_id IS NULL THEN vf.variant_count END) END AS variant_count
 FROM variant_checked vc LEFT JOIN variant_family_stats vf USING(family_id)
 LEFT JOIN variant_conflicted_families bad ON bad.family_id=vc.family_id
 GROUP BY vc.variant_sku
 )`;
const lookupCtes=(active:string)=>active.replace(variantValidationTail,()=>variantConflictTail+variantLookupTail);
export const listingVariantLookupCtes=lookupCtes(listingVariantCtes);
export const indexedListingVariantLookupCtes=lookupCtes(indexedListingVariantCtes);

/** Exact category prefix is safe only when the listing does not need global
 * search category counts or the shared intake/exhaust alternate membership. */
export function listingVariantPath(path:string[],showCategories:boolean):string[]|null{
 return listingVariantScope(path,showCategories)===null?null:path;
}
