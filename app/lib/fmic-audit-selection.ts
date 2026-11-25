import type {PoolClient} from 'pg';

// Fetch only candidate URLs in batches. A worker still downloads one image at a time.
export const auditCandidateBatchSize=24;
export async function nextAuditCandidate(db:Pick<PoolClient,'query'>,candidates:string[]):Promise<string|undefined>{
 while(candidates.length){
  const url=candidates[0];
  const result=await db.query("SELECT 1 FROM rpm_fmic_image_audit WHERE url=$1 AND status='pending'",[url]);
  if(result.rowCount)return url;
  if(candidates[0]===url)candidates.shift();
 }
 const result=await db.query("SELECT a.url FROM rpm_fmic_image_audit a LEFT JOIN rpm_fmic_audit_priority p ON p.url=a.url WHERE a.status='pending' ORDER BY (p.url IS NULL),a.url LIMIT $1",[auditCandidateBatchSize]);
 candidates.splice(0,candidates.length,...result.rows.map(row=>row.url));
 return candidates[0];
}
export function auditSupplierBlocked(detail:string|null){return detail==='HTTP 403'||detail==='HTTP 429'||detail==='HTTP 503'}
