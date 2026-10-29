export function normalizedPart(value:string){return value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'')}
export type SupplierOffer={id:number;supplier:string;supplierSku:string;brand:string;mpn:string;ean:string;name:string;variant:string;purchaseNet:number;shippingNet:number;currency:'PLN';available:boolean;leadDays:number;productId:number|null;matchStatus:'unmatched'|'confirmed'|'rejected'};
export function exactMatch(a:SupplierOffer,b:SupplierOffer){
 if(a.id===b.id)return false;
 if(a.variant!==b.variant)return false;
 const eanA=normalizedPart(a.ean),eanB=normalizedPart(b.ean);
 if(eanA&&eanB&&eanA===eanB)return true;
 const brandA=normalizedPart(a.brand),brandB=normalizedPart(b.brand);
 const mpnA=normalizedPart(a.mpn),mpnB=normalizedPart(b.mpn);
 return !!brandA&&brandA===brandB&&!!mpnA&&mpnA===mpnB;
}
export function bestOffer(offers:SupplierOffer[],maxLeadDays:number){
 return offers.filter(o=>o.matchStatus==='confirmed'&&o.productId!==null&&o.available&&o.leadDays<=maxLeadDays)
 .sort((a,b)=>(a.purchaseNet+a.shippingNet)-(b.purchaseNet+b.shippingNet)||a.leadDays-b.leadDays||a.id-b.id)[0]??null;
}
