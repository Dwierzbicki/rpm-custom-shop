export type ListingVariant={sku:string;name:string;color:string;proposed_gross:string;available:boolean;image:string|null;brand?:string|null};
export type ListingProduct=Omit<ListingVariant,'color'>&{manual_id?:number|null;manual_stock_status?:string|null;variant_family_id?:string|null;variant_count?:number|null;variants?:ListingVariant[]|null};
export function listingCardChoices(product:ListingProduct):ListingVariant[]{
 if(product.manual_id||!product.variant_family_id||!Array.isArray(product.variants)||product.variants.length<1||product.variants.length>40)return [];
 const rows=product.variants;
 if(!rows.some(v=>v.sku===product.sku)||new Set(rows.map(v=>v.sku)).size!==rows.length||new Set(rows.map(v=>v.color)).size!==rows.length)return [];
 return rows;
}
export function selectedListingProduct(product:ListingProduct,sku:string|undefined){
 const selected=listingCardChoices(product).find(v=>v.sku===sku);
 return selected?{...product,...selected}:product;
}
