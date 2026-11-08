import {createHash} from 'node:crypto';
import type {SupplierOffer} from './supplier-matching';
import {bestOffer} from './supplier-matching';

export type ProcurementOrderItem={
 productId:number;sku:string;name:string;qty:number;unitPrice:number;options?:Record<string,string>;
};
export type ProcurementOrder={
 id:string;status:string;total:number;items:ProcurementOrderItem[];
};
export type ProcurementLine={
 index:number;productId:number;sku:string;name:string;qty:number;
 options:Record<string,string>;
 supplier:string|null;supplierSku:string|null;offerId:number|null;
 offerName:string|null;leadDays:number|null;purchaseNet:number|null;
 shippingNet:number|null;estimatedNetTotal:number|null;
 salesGrossTotal:number;blocked:string|null;requiresVariantCheck:boolean;
};
export type ProcurementPlan={
 orderId:string;orderStatus:string;lines:ProcurementLine[];
 counts:{ready:number;blocked:number;needsVariantCheck:number};
 suppliers:string[];totalEstimatedNet:number;
 maxLeadDays:number;fingerprint:string;canDraft:boolean;
 notes:string[];
};

const validMoney=(v:unknown):v is number=>
 typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=10_000_000;
const round2=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;

/**
 * Read-only sourcing plan. Only CONFIRMED, AVAILABLE, linked offers qualify.
 * Supplier stock is a boolean, not a verified count — purchasing always needs
 * explicit human confirmation of quantity and the live supplier price.
 */
export function planProcurement(order:ProcurementOrder,offers:SupplierOffer[],maxLeadDays:number):ProcurementPlan{
 const lines:ProcurementLine[]=order.items.map((item,index)=>{
  const qty=Number.isSafeInteger(item.qty)&&item.qty>0&&item.qty<=50?item.qty:0;
  const options=item.options&&typeof item.options==='object'&&!Array.isArray(item.options)?item.options:{};
  const variants=Object.keys(options).length>0;
  const eligible=offers.filter(o=>o.productId===item.productId&&
   o.matchStatus==='confirmed'&&o.available&&o.leadDays<=maxLeadDays&&
   validMoney(o.purchaseNet)&&validMoney(o.shippingNet)&&
   o.currency==='PLN'&&o.supplierSku.trim().length>0);
  const selected=bestOffer(eligible,maxLeadDays);
  let blocked:string|null=null;
  if(!qty||!Number.isSafeInteger(item.productId)||item.productId<1||!validMoney(item.unitPrice)){
   blocked='Nieprawidłowa ilość, produkt lub cena w zamówieniu';
  }else if(!selected){
   blocked='Brak potwierdzonej, dostępnej oferty dostawcy w dozwolonym terminie';
  }
  return {index,productId:item.productId,sku:item.sku,name:item.name,qty,
   options,supplier:selected?.supplier??null,supplierSku:selected?.supplierSku??null,
   offerId:selected?.id??null,offerName:selected?.name??null,leadDays:selected?.leadDays??null,
   purchaseNet:selected?.purchaseNet??null,shippingNet:selected?.shippingNet??null,
   estimatedNetTotal:selected?round2((selected.purchaseNet+selected.shippingNet)*qty):null,
   salesGrossTotal:round2((validMoney(item.unitPrice)?item.unitPrice:0)*qty),
   blocked,requiresVariantCheck:variants};
 });
 const counts={ready:lines.filter(l=>!l.blocked).length,blocked:lines.filter(l=>!!l.blocked).length,
  needsVariantCheck:lines.filter(l=>l.requiresVariantCheck).length};
 const suppliers=[...new Set(lines.map(l=>l.supplier).filter((v):v is string=>!!v))].sort();
 const totalEstimatedNet=round2(lines.reduce((sum,line)=>sum+(line.estimatedNetTotal??0),0));
 const notes=[
  'To wyłącznie wewnętrzny plan zakupu. Nie wysłano zamówienia do żadnego dostawcy.',
  'Dostępność jest wskaźnikiem, a nie potwierdzoną liczbą sztuk. Przed złożeniem zamówienia sprawdź stan, cenę i wysyłkę u dostawcy.',
  ...(counts.needsVariantCheck?['Zamówienie zawiera konfiguracje produktu: ręcznie sprawdź flansze, warianty i zgodność SKU dostawcy.']:[]),
  ...(suppliers.length>1?['Zamówienie obejmuje kilku dostawców: osobno sprawdź dostawy i koszty.']:[]),
 ];
 const eligibleStatus=order.status==='confirmed'||order.status==='processing';
 const canDraft=eligibleStatus&&lines.length>0&&counts.blocked===0;
 const fingerprint=createHash('sha256').update(JSON.stringify({
  orderId:order.id,status:order.status,total:order.total,items:order.items,maxLeadDays,
  offers:offers
   .filter(o=>order.items.some(item=>item.productId===o.productId))
   .map(o=>({id:o.id,supplier:o.supplier,supplierSku:o.supplierSku,productId:o.productId,
    matchStatus:o.matchStatus,available:o.available,leadDays:o.leadDays,
    purchaseNet:o.purchaseNet,shippingNet:o.shippingNet,currency:o.currency,
    brand:o.brand,mpn:o.mpn,ean:o.ean,variant:o.variant}))
   .sort((a,b)=>a.id-b.id),
  lines,
 })).digest('hex');
 return {orderId:order.id,orderStatus:order.status,lines,counts,suppliers,totalEstimatedNet,
  maxLeadDays,fingerprint,canDraft,notes};
}
