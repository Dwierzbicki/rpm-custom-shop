'use client';
import type {Dispatch,FormEventHandler,SetStateAction} from 'react';
import {Check,ChevronRight} from 'lucide-react';
import {money} from '../../data';
import type {Product,CartLine} from '../../data';
import {availablePaymentMethods} from '../../lib/payment-settings';
import type {PaymentMethod,PaymentSettings} from '../../lib/payment-settings';
import {shippingQuote} from '../../lib/shipping';
import type {ShippingMethod,ShippingSettings} from '../../lib/shipping';
import {phonePrefixes} from '../../lib/storefront-config';

export type OrderReceipt={
 orderId:string;
 total:number;
 subtotal:number;
 shipping:{cost:number};
 items:{name:string;qty:number;unitPrice:number}[];
 payment:{method:PaymentMethod;status:string};
 paymentInstructions:{recipient:string;account:string;instructions:string;title:string}|null;
};

type Props={
 t:(label:string)=>string;
 lang:'pl'|'en';
 cart:CartLine[];
 products:Product[];
 cartTotal:number;
 checkoutDone:boolean;
 receipt:OrderReceipt|null;
 onBackToCart:()=>void;
 onBackToStore:()=>void;
 onSubmit:FormEventHandler<HTMLFormElement>;
 checkoutType:'private'|'company';
 setCheckoutType:Dispatch<SetStateAction<'private'|'company'>>;
 companyNip:string;
 setCompanyNip:Dispatch<SetStateAction<string>>;
 companyName:string;
 setCompanyName:Dispatch<SetStateAction<string>>;
 companyAddress:string;
 setCompanyAddress:Dispatch<SetStateAction<string>>;
 companyLookupMessage:string;
 setCompanyLookupMessage:Dispatch<SetStateAction<string>>;
 companyLookupState:'success'|'error'|null;
 setCompanyLookupState:Dispatch<SetStateAction<'success'|'error'|null>>;
 companyLookupBusy:boolean;
 lookupCompany:()=>void;
 copyCompanyAddress:()=>void;
 phonePrefix:string;
 setPhonePrefix:Dispatch<SetStateAction<string>>;
 phoneMenuOpen:boolean;
 setPhoneMenuOpen:Dispatch<SetStateAction<boolean>>;
 deliveryNotice:string;
 deliveryAddress:string;
 setDeliveryAddress:Dispatch<SetStateAction<string>>;
 deliveryPostalCode:string;
 setDeliveryPostalCode:Dispatch<SetStateAction<string>>;
 deliveryCity:string;
 setDeliveryCity:Dispatch<SetStateAction<string>>;
 shippingMethod:ShippingMethod;
 setShippingMethod:Dispatch<SetStateAction<ShippingMethod>>;
 shippingSettings:ShippingSettings;
 shippingSettingsReady:boolean;
 paymentMethod:PaymentMethod;
 setPaymentMethod:Dispatch<SetStateAction<PaymentMethod>>;
 paymentSettings:PaymentSettings;
 orderBusy:boolean;
 orderError:string;
};

/**
 * Presentation-only checkout. The Shop controller still owns customer fields,
 * submission, request idempotency and navigation.
 */
export default function CheckoutView({t,lang,cart,products,cartTotal,checkoutDone,receipt,
 onBackToCart,onBackToStore,onSubmit,
 checkoutType,setCheckoutType,companyNip,setCompanyNip,companyName,setCompanyName,
 companyAddress,setCompanyAddress,companyLookupMessage,setCompanyLookupMessage,
 companyLookupState,setCompanyLookupState,companyLookupBusy,lookupCompany,copyCompanyAddress,
 phonePrefix,setPhonePrefix,phoneMenuOpen,setPhoneMenuOpen,
 deliveryNotice,deliveryAddress,setDeliveryAddress,deliveryPostalCode,setDeliveryPostalCode,
 deliveryCity,setDeliveryCity,
 shippingMethod,setShippingMethod,shippingSettings,shippingSettingsReady,
 paymentMethod,setPaymentMethod,paymentSettings,orderBusy,orderError}:Props){
 return (
  <main className="page rpm-checkout-page"><button className="back" onClick={onBackToCart}>{t("← Wróć do koszyka")}</button><div className="page-heading"><span className="eyebrow">{t("BEZ PŁATNOŚCI / DEMO")}</span><h1>CHECKOUT</h1><p>{t("Wyślij zgłoszenie zamówienia. Bez płatności online — dostępność i koszty dostawy potwierdzimy przed realizacją.")}</p></div>{checkoutDone&&receipt?<div className="rpm-order-confirmation"><div className="rpm-confirmation-heading"><Check size={42}/><span className="eyebrow">{t("RPM CUSTOM / POTWIERDZENIE")}</span><h2>{t("Zamówienie zostało zapisane!")}</h2><p>{t("Numer zamówienia: ")}<strong>#{receipt.orderId}</strong></p><p>{t("Otrzymaliśmy Twoje zgłoszenie. Skontaktujemy się w sprawie realizacji i dostępności produktów.")}</p></div><div className="rpm-confirmation-grid"><section className="rpm-settings-card"><h3>{t("Podsumowanie zamówienia")}</h3>{receipt.items.map((item,index)=><div className="rpm-checkout-item" key={index}><span>{item.name} × {item.qty}</span><strong>{money(item.unitPrice*item.qty)}</strong></div>)}<div className="rpm-checkout-total"><span>{t("Produkty")}</span><strong>{money(receipt.subtotal)}</strong></div><div className="rpm-checkout-total"><span>{t("Dostawa")}</span><strong>{money(receipt.shipping.cost)}</strong></div><div className="rpm-checkout-total"><span>{t("Łącznie")}</span><strong>{money(receipt.total)}</strong></div></section><section className="rpm-settings-card"><h3>{t("Co dalej?")}</h3>{receipt.payment.method==='bank_transfer'&&receipt.paymentInstructions?<><p>{t("Wykonaj przelew tradycyjny na poniższe dane. Płatność nie jest pobierana automatycznie.")}</p><div className="rpm-confirmation-detail"><span>{t("Odbiorca")}</span><strong>{receipt.paymentInstructions.recipient}</strong></div><div className="rpm-confirmation-detail"><span>{t("Numer konta / IBAN")}</span><strong>{receipt.paymentInstructions.account}</strong><button type="button" className="outline" onClick={()=>void navigator.clipboard?.writeText(receipt.paymentInstructions?.account??'')}>{t("Kopiuj numer konta")}</button></div><div className="rpm-confirmation-detail"><span>{t("Tytuł przelewu")}</span><strong>{receipt.paymentInstructions.title}</strong><button type="button" className="outline" onClick={()=>void navigator.clipboard?.writeText(receipt.paymentInstructions?.title??'')}>{t("Kopiuj tytuł")}</button></div><div className="rpm-confirmation-detail"><span>{t("Kwota przelewu")}</span><strong>{money(receipt.total)}</strong></div>{receipt.paymentInstructions.instructions&&<p>{receipt.paymentInstructions.instructions}</p>}</>:<p>{t("Wybrano płatność przy odbiorze osobistym. Termin i miejsce odbioru potwierdzimy po kontakcie.")}</p>}<p className="muted">{t("Zapisz numer zamówienia i dane płatności. Automatyczna wiadomość e-mail nie jest jeszcze wysyłana.")}</p></section></div><button className="primary" onClick={onBackToStore}>{t("Wróć do sklepu")}</button></div>:<form className="checkout-form rpm-checkout-pro" onSubmit={onSubmit}><div className="rpm-checkout-grid"><div className="rpm-checkout-fields"><section className="rpm-checkout-section"><h2>{t("01 / Dane kupującego")}</h2><fieldset className="rpm-checkout-customer-type"><legend>{t("Rodzaj klienta")}</legend><div className="rpm-checkout-customer-options"><label className={checkoutType==='private'?'is-selected':''}><input type="radio" name="type" value="private" checked={checkoutType==='private'} onChange={()=>setCheckoutType('private')}/><span>{t("Osoba fizyczna (OF)")}</span></label><label className={checkoutType==='company'?'is-selected':''}><input type="radio" name="type" value="company" checked={checkoutType==='company'} onChange={()=>setCheckoutType('company')}/><span>{t("Firma")}</span></label></div></fieldset>{checkoutType==='company'&&<div className="rpm-company-lookup"><div className="rpm-company-nip-row"><label>{t("NIP firmy")}<input name="nip" required inputMode="numeric" pattern="[0-9]{10}" title={t("10 cyfr bez spacji")} placeholder="1234567890" value={companyNip} onChange={e=>{setCompanyNip(e.target.value.replace(/[^0-9]/g,'').slice(0,10));setCompanyLookupMessage('');setCompanyLookupState(null);setCompanyAddress('')}}/></label><button type="button" className="rpm-company-fetch" disabled={companyLookupBusy||companyNip.length!==10} onClick={lookupCompany}>{companyLookupBusy?t('Pobieranie...'):t('Pobierz dane firmy')}</button></div><label>{t("Nazwa firmy")}<input name="company" required maxLength={160} placeholder={t("Nazwa firmy")} value={companyName} onChange={e=>setCompanyName(e.target.value)}/></label>{companyLookupMessage&&<div className={"rpm-company-lookup-alert "+(companyLookupState==="success"?"is-success":"is-error")} role={companyLookupState==="error"?"alert":"status"}><span className="rpm-company-lookup-alert-icon" aria-hidden="true">{companyLookupState==="success"?"✓":"!"}</span><div><strong>{companyLookupState==="success"?t('Dane firmy zostały pobrane'):t('Nie udało się pobrać danych')}</strong><p>{companyLookupMessage}</p></div></div>}{companyAddress&&<div className="rpm-company-address"><strong>{t("Adres rejestrowy:")}</strong> {companyAddress}<div className="rpm-company-copy"><span>{t("Wysłać zamówienie pod ten sam adres?")}</span><button type="button" onClick={copyCompanyAddress}>{t("Tak, uzupełnij adres dostawy")}</button></div></div>}</div>}<div className="rpm-checkout-pair"><label>{t("Imię i nazwisko")}<input name="name" required maxLength={120} autoComplete="name" placeholder="Jan Kowalski"/></label><label>{t("Telefon kontaktowy")}<span className="rpm-phone-field"><div className="rpm-phone-country" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setPhoneMenuOpen(false)}}><button type="button" className="rpm-phone-country-trigger" aria-label={lang==="en"?"Country calling code":"Numer kierunkowy kraju"} aria-expanded={phoneMenuOpen} onClick={()=>setPhoneMenuOpen(v=>!v)}>{(()=>{const country=phonePrefixes.find(([,code])=>code===phonePrefix)?.[0]??'PL';return <><span className="rpm-phone-flag"><img className="rpm-phone-flag-img" src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`} alt={country} width={22} height={15} loading="lazy"/></span><span>{country} ({phonePrefix})</span></>})()}<ChevronRight className={phoneMenuOpen?'rpm-phone-chevron is-open':'rpm-phone-chevron'} size={15}/></button>{phoneMenuOpen&&<div className="rpm-phone-country-menu" role="listbox" aria-label={lang==="en"?"Select country":"Wybierz kraj"}>{phonePrefixes.map(([country,code])=><button type="button" role="option" aria-selected={phonePrefix===code} key={country} onClick={()=>{setPhonePrefix(code);setPhoneMenuOpen(false)}}><span className="rpm-phone-flag"><img className="rpm-phone-flag-img" src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`} alt={country} width={22} height={15} loading="lazy"/></span><span>{country} ({code})</span></button>)}</div>}</div><input name="phone" required type="tel" inputMode="tel" maxLength={24} autoComplete="tel-national" placeholder={lang==="en"?"500 600 700":"500 600 700"} pattern="[0-9 ()-]{6,24}" title={lang==="en"?"Enter a phone number without the country code":"Wpisz numer telefonu bez numeru kierunkowego"}/></span></label></div><label>{t("Adres e-mail")}<input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="jan@example.com"/></label></section><section className="rpm-checkout-section"><h2>{t("02 / Adres dostawy")}</h2>{deliveryNotice&&<p className="rpm-company-message" role="status">{deliveryNotice}</p>}<label>{t("Ulica i numer domu / lokalu")}<input name="address" required maxLength={240} autoComplete="street-address" placeholder="Warsztatowa 12/3" value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)}/></label><div className="rpm-checkout-pair"><label>{t("Kod pocztowy")}<input name="postalCode" required placeholder="00-000" pattern="[0-9]{2}-[0-9]{3}" autoComplete="postal-code" value={deliveryPostalCode} onChange={e=>setDeliveryPostalCode(e.target.value)}/></label><label>{t("Miasto")}<input name="city" required maxLength={120} autoComplete="address-level2" placeholder="Warszawa" value={deliveryCity} onChange={e=>setDeliveryCity(e.target.value)}/></label></div></section><section className="rpm-checkout-section"><h2>{t("03 / Sposób dostawy")}</h2><fieldset className="rpm-checkout-customer-type"><legend>{t("Wybierz sposób odbioru zamówienia")}</legend><div className="rpm-checkout-customer-options">{shippingSettings.courierEnabled&&<label className={shippingMethod==='courier'?'is-selected':''}><input type="radio" name="shippingMethod" value="courier" checked={shippingMethod==='courier'} onChange={()=>setShippingMethod('courier')}/><span>{lang==="en"?"Courier":"Kurier"} — {" "+money(shippingSettings.courierPrice)+(lang==="en"?" (free from ":" (gratis od ")+money(shippingSettings.freeShippingFrom)+")"}</span></label>}{shippingSettings.pickupEnabled&&<label className={shippingMethod==='pickup'?'is-selected':''}><input type="radio" name="shippingMethod" value="pickup" checked={shippingMethod==='pickup'} onChange={()=>setShippingMethod('pickup')}/><span>{t("Odbiór osobisty — 0 zł")}</span></label>}</div></fieldset><p className="rpm-shipping-note">{shippingMethod==='pickup'?t('Termin i miejsce odbioru ustalimy po przyjęciu zgłoszenia.'):(lang==='en'?'Flat shipping rate: ':'Stała cena dostawy: ')+money(shippingSettings.courierPrice)+(lang==='en'?'. Free shipping from ':'. Darmowa dostawa od ')+money(shippingSettings.freeShippingFrom)+(lang==='en'?' in products.':' wartości produktów.')}</p></section><section className="rpm-checkout-section"><h2>{t("04 / Metoda płatności")}</h2><fieldset className="rpm-checkout-customer-type"><legend>{t("Wybierz sposób płatności")}</legend><div className="rpm-checkout-customer-options">{availablePaymentMethods(paymentSettings,shippingMethod).map(method=><label key={method} className={paymentMethod===method?'is-selected':''}><input type="radio" name="paymentMethod" value={method} checked={paymentMethod===method} onChange={()=>setPaymentMethod(method)}/><span>{method==='bank_transfer'?t('Przelew tradycyjny'):t('Płatność przy odbiorze osobistym')}</span></label>)}</div></fieldset>{!availablePaymentMethods(paymentSettings,shippingMethod).length&&<p role="alert" className="rpm-settings-error">{t("Brak dostępnych metod płatności dla wybranej dostawy. Skontaktuj się ze sklepem.")}</p>}{paymentMethod==='bank_transfer'&&paymentSettings.bankTransferEnabled&&<p className="rpm-shipping-note">{t("Dane do przelewu zobaczysz na ekranie potwierdzenia po zapisaniu zamówienia. Nie pobieramy płatności online.")}</p>}</section><section className="rpm-checkout-section"><h2>{t("05 / Informacje dodatkowe")}</h2><label>{t("Uwagi do zamówienia (opcjonalnie)")}<textarea name="notes" rows={4} maxLength={1000} placeholder={t("Np. szczegóły projektu, preferowany termin kontaktu...")}/></label></section></div><aside className="rpm-checkout-aside"><h2>{t("Twoje zamówienie")}</h2>{cart.map(l=>{const p=products.find(x=>x.id===l.productId);return <div key={l.key} className="rpm-checkout-item"><span>{p?.name??'Produkt'} <small>× {l.qty}</small></span><strong>{money((l.unitPrice??p?.price??0)*l.qty)}</strong></div>})}<div className="rpm-checkout-total"><span>{t("Wartość produktów")}</span><strong>{money(cartTotal)}</strong></div><div className="rpm-checkout-total"><span>{t("Dostawa")}</span><strong>{money(shippingQuote(shippingMethod,cartTotal,shippingSettings).cost)}</strong></div><div className="rpm-checkout-total"><span>{t("Razem")}</span><strong>{money(cartTotal+shippingQuote(shippingMethod,cartTotal,shippingSettings).cost)}</strong></div><p>{shippingMethod==='pickup'?t("Odbiór osobisty bez opłaty za dostawę."):t("Koszt dostawy jest uwzględniony w podsumowaniu.")} {t("Płatność nie jest pobierana online.")}</p></aside></div><label className="rpm-checkout-consent rpm-checkout-consent-footer"><input type="checkbox" required/><span>{t("Potwierdzam poprawność danych i wyrażam zgodę na kontakt w sprawie tego zgłoszenia zamówienia.")}</span></label>{orderError&&<p role="alert" style={{color:"#e56b6b"}}>{orderError}</p>}<button className="primary" disabled={!cart.length||orderBusy||!shippingSettingsReady||!availablePaymentMethods(paymentSettings,shippingMethod).includes(paymentMethod)}>{orderBusy?t('Zapisywanie...'):!shippingSettingsReady?t('Ładowanie ustawień dostawy...'):t('Wyślij zgłoszenie zamówienia')}</button></form>}</main>
 );
}
