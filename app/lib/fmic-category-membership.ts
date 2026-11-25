// Shared stainless components have two storefront paths, but one catalog row and SKU.
const steel="'Kolanka i rury nierdzewne'";
const roots="('Układ dolotowy','Układ wydechowy')";
const leaves="('Kolanka nierdzewne','Spawane kolanka nierdzewne','Rury nierdzewne','Redukcje nierdzewne')";
const welded="(mapping_status='parent_review' AND target_category=ARRAY['Układ dolotowy','Kolanka i rury nierdzewne']::text[] AND data->>'category_path'='Układ dolotowy > Kolanka i rury nierdzewne > Spawane kolanka nierdzewne welding porn')";
export const visibleCatalog="(mapping_status IN ('exact','normalized','manual') OR "+welded+")";
export const primaryCategory="(CASE WHEN "+welded+" THEN ARRAY['Układ dolotowy','Kolanka i rury nierdzewne','Spawane kolanka nierdzewne']::text[] ELSE target_category END)";
const shared="(("+primaryCategory+")[1] IN "+roots+" AND ("+primaryCategory+")[2]="+steel+" AND ("+primaryCategory+")[3] IN "+leaves+" AND cardinality("+primaryCategory+")=3)";
export const alternateCategory="(CASE WHEN "+shared+" THEN ARRAY[CASE WHEN ("+primaryCategory+")[1]='Układ dolotowy' THEN 'Układ wydechowy' ELSE 'Układ dolotowy' END,("+primaryCategory+")[2],("+primaryCategory+")[3]]::text[] END)";
export const categoryMembership=(parameter:string)=>"(cardinality("+parameter+"::text[])=0 OR (("+primaryCategory+") @> "+parameter+"::text[] AND ("+primaryCategory+")[1:cardinality("+parameter+"::text[])]="+parameter+"::text[]) OR (("+alternateCategory+") @> "+parameter+"::text[] AND ("+alternateCategory+")[1:cardinality("+parameter+"::text[])]="+parameter+"::text[]))";
// Expand only category counts, never product listings. Global totals stay unique.
export const categoryExpansion=" CROSS JOIN LATERAL (SELECT "+primaryCategory+" AS path UNION ALL SELECT "+alternateCategory+" AS path WHERE "+alternateCategory+" IS NOT NULL) AS memberships ";
