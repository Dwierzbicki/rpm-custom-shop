import type {PoolClient} from 'pg';

// Exact supplier variant identity. The feed may omit brand; in that case the
// exact SKU/MPN/name/source URL establish the identity and the page supplies brand.
// An explicit conflicting feed brand always blocks automatic publication.
export const verifiedSupplierIdentitySql = `COALESCE((
 e.source_url=c.data->>'url'
 AND e.source_url ~ '^https://fmic[.]pl/[^[:space:]]+$'
 AND e.data->>'sku'=c.sku
 AND e.data->>'name'=c.name
 AND NULLIF(trim(c.data->>'mpn'),'') IS NOT NULL
 AND e.data->>'mpn'=c.data->>'mpn'
 AND NULLIF(trim(e.data->>'brand'),'') IS NOT NULL
 AND (NULLIF(trim(c.data->>'brand'),'') IS NULL OR lower(trim(c.data->>'brand'))=lower(trim(e.data->>'brand')))
 AND NULLIF(trim(e.data->>'description'),'') IS NOT NULL
),false)`;

// Recover only legacy, unchanged worker drafts with completed queue provenance.
// Complex/edited technical payloads and manual decisions remain untouched.
export async function publishLegacyWorkerDrafts(db:Pick<PoolClient,'query'>,limit=10){
 if(!Number.isSafeInteger(limit)||limit<1||limit>10)throw Error('Publication batch must contain 1–10 items');
 const result=await db.query(`WITH candidates AS MATERIALIZED (
  SELECT d.sku FROM rpm_fmic_product_descriptions d
  JOIN rpm_fmic_catalog c USING(sku)
  JOIN rpm_fmic_enrichment e USING(sku)
  JOIN rpm_fmic_description_queue q USING(sku)
  WHERE NOT d.published AND d.publication_origin IS NULL AND q.status='done'
  AND q.updated_at-d.updated_at BETWEEN interval '0 seconds' AND interval '10 seconds'
  AND d.updated_at-e.fetched_at BETWEEN interval '0 seconds' AND interval '10 seconds'
  AND ${verifiedSupplierIdentitySql}
  AND d.description=trim(e.data->>'description')
  AND d.brand=left(coalesce(e.data->>'brand',''),200)
  AND d.technical=jsonb_build_object('intro',d.description,'fields','[]'::jsonb,'warranty','')
  ORDER BY d.sku LIMIT $1 FOR UPDATE OF d SKIP LOCKED
 )
 UPDATE rpm_fmic_product_descriptions d SET published=true,publication_origin='supplier-worker',updated_at=NOW()
 FROM candidates WHERE d.sku=candidates.sku AND NOT d.published AND d.publication_origin IS NULL
 RETURNING d.sku`,[limit]);
 return result.rowCount??0;
}
