export const maxVariantBatch=20;
export type VariantReviewItem={id:string;fingerprint:string};
export function parseVariantReviewItems(value:unknown):VariantReviewItem[]|null{
 if(!Array.isArray(value)||value.length<1||value.length>maxVariantBatch)return null;
 const items:VariantReviewItem[]=[];
 for(const item of value){
  if(!item||typeof item!=='object'||typeof item.id!=='string'||typeof item.fingerprint!=='string'||!/^[a-f0-9]{32}$/.test(item.id)||!/^[a-f0-9]{32}$/.test(item.fingerprint))return null;
  items.push({id:item.id,fingerprint:item.fingerprint});
 }
 return new Set(items.map(i=>i.id)).size===items.length?items:null;
}
