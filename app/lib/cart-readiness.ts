import type {CartLine,Product} from '../data';
export type CartMode='empty'|'manual'|'supplier'|'mixed';
export type CatalogState='loading'|'ready'|'error';
export function cartReadiness(lines:CartLine[],products:Product[],catalogState:CatalogState,quoteState:'idle'|'loading'|'ready'|'error'){
 const manual=lines.filter(l=>!l.fmicSku),supplier=lines.filter(l=>!!l.fmicSku);
 const mode:CartMode=manual.length&&supplier.length?'mixed':manual.length?'manual':supplier.length?'supplier':'empty';
 const missing=manual.filter(l=>{const p=products.find(p=>p.id===l.productId) as (Product&{visible?:boolean;stockStatus?:string})|undefined;return !p||p.visible===false||p.stockStatus==='unavailable'});
 const supplierUnavailable=supplier.filter(l=>l.fmicAvailable!==true||!Number.isFinite(l.unitPrice)||Number(l.unitPrice)<=0);
 return {mode,manual,supplier,missing,supplierUnavailable,canCheckout:mode==='manual'&&catalogState==='ready'&&!missing.length,canQuote:mode==='supplier'&&quoteState==='ready'&&!supplierUnavailable.length};
}
