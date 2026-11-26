import {variantCandidateSql} from './variant-sql';
import type {VariantScope} from './variant-rules';
// Re-evaluate live candidate composition once per batch, not once per family.
// Reject if any selected SKU belongs to another selected or active approved family.
export function variantBatchValidationSql(scope:VariantScope){
 return `WITH requested AS MATERIALIZED (
 SELECT id,fingerprint FROM jsonb_to_recordset($1::jsonb) AS r(id text,fingerprint text)
 ), candidates AS MATERIALIZED (${variantCandidateSql(scope)}),
 eligible AS MATERIALIZED (
 SELECT f.id,n.members FROM requested r JOIN rpm_variant_families f ON f.id=r.id
 JOIN candidates n ON n.id=f.id AND n.fingerprint=f.fingerprint
 WHERE f.scope=$2 AND f.present AND f.decision='pending' AND f.fingerprint=r.fingerprint
 ), selected_members AS MATERIALIZED (
 SELECT e.id,m->>'sku' sku FROM eligible e CROSS JOIN LATERAL jsonb_array_elements(e.members) m
 ), overlapping AS (
 SELECT sku FROM selected_members GROUP BY sku HAVING count(*)>1
 UNION
 SELECT s.sku FROM selected_members s JOIN rpm_variant_members_v1 v ON v.sku=s.sku AND v.family_id<>s.id
 )
 SELECT e.id,jsonb_array_length(e.members)::int AS skus
 FROM eligible e WHERE NOT EXISTS(SELECT 1 FROM selected_members s JOIN overlapping o USING(sku) WHERE s.id=e.id)`;
}
