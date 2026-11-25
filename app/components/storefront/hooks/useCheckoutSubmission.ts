'use client';
import {useRef,useState,type FormEvent} from 'react';
import type {OrderReceipt} from '../CheckoutView';
import type {CartLine} from '../../../data';
import type {ShippingMethod} from '../../../lib/shipping';
import type {PaymentMethod} from '../../../lib/payment-settings';
import {checkoutRequestKey,clearCheckoutRequestKey} from '../../../lib/checkout-idempotency';
import {checkoutPayload} from '../../../lib/checkout-payload';
type Options={cart:CartLine[];lang:'pl'|'en';phonePrefix:string;shippingMethod:ShippingMethod;paymentMethod:PaymentMethod;shippingSettingsReady:boolean;clearCart:()=>void;t:(value:string)=>string};
export function useCheckoutSubmission({cart,lang,phonePrefix,shippingMethod,paymentMethod,shippingSettingsReady,clearCart,t}:Options){
 const [checkoutDone,setCheckoutDone]=useState(false),[orderError,setOrderError]=useState(''),[orderBusy,setOrderBusy]=useState(false);
 const [receipt,setReceipt]=useState<OrderReceipt|null>(null);
 const inFlight=useRef(false);
 const handleCheckoutSubmit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(inFlight.current||orderBusy||!shippingSettingsReady)return;
  inFlight.current=true;setOrderBusy(true);setOrderError('');
  try{
   const payload=checkoutPayload(new FormData(e.currentTarget),{cart,lang,phonePrefix,shippingMethod,paymentMethod});
   const requestKey=await checkoutRequestKey(payload);
   const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestKey},body:payload});
   const result=await response.json();
   if(!response.ok)throw Error(result.error??t('Błąd zapisu zamówienia'));
   clearCheckoutRequestKey();setReceipt(result);setCheckoutDone(true);clearCart();
  }catch(err){setOrderError(err instanceof Error?err.message:t('Nie udało się wysłać zgłoszenia'))}
  finally{inFlight.current=false;setOrderBusy(false)}
 };
 const resetCheckout=()=>{setCheckoutDone(false);setReceipt(null);clearCart()};
 return {checkoutDone,receipt,orderBusy,orderError,handleCheckoutSubmit,resetCheckout};
}
