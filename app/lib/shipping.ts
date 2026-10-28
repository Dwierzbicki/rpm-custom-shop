export type ShippingMethod='pickup'|'courier';
export type ShippingSettings={courierPrice:number;freeShippingFrom:number;pickupEnabled:boolean;courierEnabled:boolean};
export const DEFAULT_SHIPPING_SETTINGS:ShippingSettings={courierPrice:25,freeShippingFrom:500,pickupEnabled:true,courierEnabled:true};
export type ShippingQuote={method:ShippingMethod;label:string;cost:number;requiresQuote:false;freeShipping:boolean};
export function shippingQuote(method:ShippingMethod,subtotal:number,settings:ShippingSettings=DEFAULT_SHIPPING_SETTINGS):ShippingQuote{
 if(method==='pickup')return {method,label:'Odbiór osobisty — po uzgodnieniu',cost:0,requiresQuote:false,freeShipping:false};
 const free=subtotal>=settings.freeShippingFrom;
 return {method,label:free?'Kurier — darmowa dostawa':'Kurier — stała stawka',cost:free?0:settings.courierPrice,requiresQuote:false,freeShipping:free};
}
export function isShippingMethod(value:unknown):value is ShippingMethod{return value==='pickup'||value==='courier'}
export function validShippingSettings(v:unknown):v is ShippingSettings{
 if(!v||typeof v!=='object')return false;
 const s=v as Record<string,unknown>;
 return Number.isInteger(s.courierPrice)&&Number(s.courierPrice)>=0&&Number(s.courierPrice)<=10000&&Number.isInteger(s.freeShippingFrom)&&Number(s.freeShippingFrom)>=0&&Number(s.freeShippingFrom)<=10000000&&typeof s.pickupEnabled==='boolean'&&typeof s.courierEnabled==='boolean'&&(s.pickupEnabled||s.courierEnabled);
}
