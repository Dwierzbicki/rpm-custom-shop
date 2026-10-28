export type ShippingMethod='pickup'|'courier';
export type ShippingQuote={method:ShippingMethod;label:string;cost:number|null;requiresQuote:boolean};
export function shippingQuote(method:ShippingMethod,subtotal:number):ShippingQuote{
 if(method==='pickup')return {method,label:'Odbiór osobisty — po uzgodnieniu',cost:0,requiresQuote:false};
 return {method,label:'Kurier — wycena indywidualna',cost:null,requiresQuote:true};
}
export function isShippingMethod(value:unknown):value is ShippingMethod{return value==='pickup'||value==='courier'}
