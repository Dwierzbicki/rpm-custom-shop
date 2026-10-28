export type ShippingMethod='pickup'|'courier';
export type ShippingQuote={method:ShippingMethod;label:string;cost:number;requiresQuote:false;freeShipping:boolean};
export const SHIPPING_RATE_PLN=25;
export const FREE_SHIPPING_FROM_PLN=500;
export function shippingQuote(method:ShippingMethod,subtotal:number):ShippingQuote{
 if(method==='pickup')return {method,label:'Odbiór osobisty — po uzgodnieniu',cost:0,requiresQuote:false,freeShipping:false};
 const free=subtotal>=FREE_SHIPPING_FROM_PLN;
 return {method,label:free?'Kurier — darmowa dostawa':'Kurier — stała stawka',cost:free?0:SHIPPING_RATE_PLN,requiresQuote:false,freeShipping:free};
}
export function isShippingMethod(value:unknown):value is ShippingMethod{return value==='pickup'||value==='courier'}
