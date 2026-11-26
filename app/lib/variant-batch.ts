export const maxVariantBatch=100;
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

export const variantPageSizes=[20,50,100] as const;
export function parseVariantCategory(value:string|null):string[]|null{
 if(!value)return [];
 if(value.length>1600)return null;
 try{const p:unknown=JSON.parse(value);return Array.isArray(p)&&p.length<=8&&p.every(x=>typeof x==='string'&&x.trim()&&x.length<=160)?p:null}catch{return null}
}
