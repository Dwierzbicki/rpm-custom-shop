'use client';
import {useRef,useState,type FormEvent} from 'react';
import {ArrowRight,CheckCircle2} from 'lucide-react';
import type {CartLine} from '../../data';
import {money} from '../../data';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
import {checkoutRequestKey} from '../../lib/checkout-idempotency';
export default function FmicQuoteForm({cart,ready}:{cart:CartLine[];ready:boolean}){
 const {lang}=useStorefrontLanguage();
 const tr=(pl:string,en:string)=>lang==='en'?en:pl;
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState<{id:string;subtotal:number}|null>(null);
 const lock=useRef(false);
 const valid=ready&&cart.length>0&&cart.every(l=>l.fmicSku&&l.fmicAvailable===true&&Number.isFinite(l.unitPrice)&&Number(l.unitPrice)>0);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!valid||lock.current)return;
  const form=new FormData(e.currentTarget);
  const body=JSON.stringify({name:form.get('name'),email:form.get('email'),postalCode:form.get('postalCode'),notes:form.get('notes'),consent:form.get('consent')==='on',language:lang,lines:cart.map(l=>({sku:l.fmicSku,qty:l.qty,price:l.unitPrice}))});
  lock.current=true;setBusy(true);setError('');
  try{
   const key=await checkoutRequestKey('fmic-quote:'+body);
   const response=await fetch('/api/catalog/quote-request',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body});
   const data=await response.json();
   if(!response.ok){setError(data.error==='CATALOG_CHANGED'?'changed':'failed');return}
   setReceipt({id:data.id,subtotal:data.subtotal});
  }catch{setError('failed')}finally{lock.current=false;setBusy(false)}
 }
 if(receipt)return <div role="status" className="rpm-fmic-quote-receipt"><CheckCircle2 size={25}/><strong>{tr('Zapisano zapytanie','Request received')} #Q-{receipt.id}</strong><p>{tr('Skontaktujemy się w celu potwierdzenia ceny, dostępności i dostawy. Nie złożono płatnego zamówienia.','We will contact you to confirm price, availability and delivery. No payable order was placed.')}</p><small>{tr('Wstępna wartość produktów','Estimated product subtotal')}: {money(receipt.subtotal)}</small></div>;
 return <div className="rpm-fmic-quote">
 <button type="button" className="primary" disabled={!valid||busy} onClick={()=>setOpen(v=>!v)} aria-expanded={open}>{tr('Zapytaj o zamówienie','Request a quote')} <ArrowRight size={17}/></button>
 {!valid&&ready&&<small role="status">{tr('Usuń niedostępne pozycje, aby wysłać zapytanie.','Remove unavailable items to request a quote.')}</small>}
 {open&&<form onSubmit={submit} className="rpm-fmic-quote-form">
 <p>{tr('Niewiążące zapytanie — bez płatności i rezerwacji towaru.','Non-binding request — no payment or stock reservation.')}</p>
 <label>{tr('Imię i nazwisko','Full name')}<input name="name" required maxLength={120} autoComplete="name"/></label>
 <label>{tr('Adres e-mail','Email address')}<input name="email" type="email" required maxLength={200} autoComplete="email"/></label>
 <label>{tr('Kod pocztowy dostawy (opcjonalnie)','Delivery postal code (optional)')}<input name="postalCode" maxLength={20} autoComplete="postal-code"/></label>
 <label>{tr('Uwagi (opcjonalnie)','Notes (optional)')}<textarea name="notes" maxLength={1000} rows={3}/></label>
 <label className="rpm-fmic-quote-consent"><input type="checkbox" name="consent" required/><span>{tr('Proszę o kontakt w sprawie tego zapytania.','Please contact me regarding this request.')} <a href="/informacje#kontakt">{tr('Informacje kontaktowe','Contact information')}</a></span></label>
 {error&&<p role="alert">{error==='changed'?tr('Cena lub dostępność uległa zmianie. Odśwież koszyk i sprawdź pozycje.','Price or availability changed. Refresh the cart and review your items.'):tr('Nie udało się wysłać zapytania. Spróbuj ponownie.','Could not submit the request. Try again.')}</p>}
 <button className="primary" type="submit" disabled={!valid||busy}>{busy?tr('Wysyłanie…','Submitting…'):tr('Wyślij niewiążące zapytanie','Send non-binding request')}</button>
 </form>}
 </div>
}
