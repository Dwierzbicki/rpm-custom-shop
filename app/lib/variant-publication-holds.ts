// CLM does not yet have a confirmed guarantee of the ordered colour.
// Keep both supplier SKUs out of mass publication, including any future family
// with a different ID or fingerprint. Manual review remains available.
export const heldVariantSkus=['IN-CLM-BMW-E8X9X','IN-CLM-BMW-E8X9X-R'] as const;
export function excludeHeldVariantFamilies<T extends {members:{sku:string}[]}>(families:T[]):T[]{
 const held=new Set<string>(heldVariantSkus);
 return families.filter(f=>!f.members.some(m=>held.has(m.sku)));
}
export const heldVariantSql=(parameter:string)=>"NOT EXISTS (SELECT 1 FROM jsonb_array_elements(members) AS held_member WHERE held_member->>'sku'=ANY("+parameter+"::text[]))";
