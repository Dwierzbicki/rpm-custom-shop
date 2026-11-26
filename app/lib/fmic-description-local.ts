import type {PoolClient} from 'pg';

/** Local-only work; caller holds the description worker advisory lock.
 * At most three distinct cached SKUs; wait for every task even on failure.
 * No supplier HTTP requests and no changes to the network rate limiter. */
export const localDescriptionConcurrency=3;
export async function processCachedDescriptions(
 db:Pick<PoolClient,'query'>,
 processSku:(sku:string)=>Promise<void>
){
 const selected=await db.query<{sku:string}>(`SELECT q.sku FROM rpm_fmic_enrichment e
 JOIN rpm_fmic_description_queue q USING(sku)
 WHERE q.status='pending' ORDER BY q.sku LIMIT $1`,[localDescriptionConcurrency]);
 const skus=[...new Set(selected.rows.map(row=>row.sku))].slice(0,localDescriptionConcurrency);
 return Promise.allSettled(skus.map(sku=>Promise.resolve().then(()=>processSku(sku))));
}
