import type {CartLine} from '../data';
import type {ShippingMethod} from './shipping';
import type {PaymentMethod} from './payment-settings';
type PayloadOptions={cart:CartLine[];lang:'pl'|'en';phonePrefix:string;shippingMethod:ShippingMethod;paymentMethod:PaymentMethod};
export function checkoutPayload(data:FormData,{cart,lang,phonePrefix,shippingMethod,paymentMethod}:PayloadOptions){
 const customer={type:String(data.get('type')??'private'),name:String(data.get('name')??''),email:String(data.get('email')??''),phone:phonePrefix+' '+String(data.get('phone')??'').trim(),company:String(data.get('company')??''),nip:String(data.get('nip')??''),city:String(data.get('city')??''),postalCode:String(data.get('postalCode')??''),address:String(data.get('address')??''),notes:String(data.get('notes')??'')};
 return JSON.stringify({customer,language:lang,shippingMethod,paymentMethod,lines:cart.map(l=>({productId:l.productId,qty:l.qty,options:l.options}))});
}
