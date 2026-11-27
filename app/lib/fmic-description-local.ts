import type {PoolClient} from 'pg';

/** Local-only work; caller holds the description worker advisory lock.
 * At most three distinct cached SKUs; wait for every task even on failure.
 * No supplier HTTP requests and no changes to the network rate limiter. */
export const localDescriptionConcurrency=3;
export async function processCachedDescriptions(
 db:Pick<PoolClient,'query'>,
 processSku:(sku:string)=>Promise<void>,
 prioritySkus:readonly string[]=[]
){
 const selected=await db.query<{sku:string}>(`SELECT q.sku FROM rpm_fmic_enrichment e
 JOIN rpm_fmic_description_queue q USING(sku)
 WHERE q.status='pending' ORDER BY ${prioritySkus.length?'CASE WHEN q.sku=ANY($2::text[]) THEN 0 ELSE 1 END, ':''}q.sku LIMIT $1`,prioritySkus.length?[localDescriptionConcurrency,prioritySkus]:[localDescriptionConcurrency]);
 const skus=[...new Set(selected.rows.map(row=>row.sku))].slice(0,localDescriptionConcurrency);
 return Promise.allSettled(skus.map(sku=>Promise.resolve().then(()=>processSku(sku))));
}

/** Up to four local batches per cycle, without raising database concurrency.
 * Caller checks worker state/memory between batches; failures yield to next cycle. */
export async function drainCachedDescriptions(
 db:Pick<PoolClient,'query'>,
 processSku:(sku:string)=>Promise<void>,
 prioritySkus:readonly string[],
 canContinue:()=>boolean|Promise<boolean>
){
 const results:PromiseSettledResult<void>[]=[];
 for(let batch=0;batch<4;batch++){
  if(!await canContinue())break;
  const current=await processCachedDescriptions(db,processSku,prioritySkus);
  results.push(...current);
  if(current.length<localDescriptionConcurrency||current.some(x=>x.status==='rejected'))break;
 }
 return results;
}
