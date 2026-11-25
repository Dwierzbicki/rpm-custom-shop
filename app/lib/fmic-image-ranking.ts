// Preserve the supplier image. Prefer non-watermarked alternatives, retaining the
// original order within each group. A single watermarked image remains usable.
export const imagePrioritySql="CASE WHEN a.status='watermarked' THEN 1 ELSE 0 END";
export const imageOrderSql=imagePrioritySql+", img.pos";
export const imageUsableSql="COALESCE(a.status,'pending') NOT IN ('blank','missing')";
