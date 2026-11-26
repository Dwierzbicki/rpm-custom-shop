'use client';
import {ArrowLeft,ArrowRight,ShoppingCart,AlertCircle,RefreshCw,ShieldCheck} from 'lucide-react';
import type {Product,CartLine} from '../../data';
import {money} from '../../data';
import FmicQuoteForm from './FmicQuoteForm';
import CartLineList from './CartLineList';
import {cartReadiness,type CatalogState} from '../../lib/cart-readiness';

type Props={
 cart:CartLine[];
 quoteState?:'idle'|'loading'|'ready'|'error';
 catalogState:CatalogState;
 products:Product[];
 count:number;
 total:number;
 t:(label:string)=>string;
 onBrowseCatalog:()=>void;
 onCheckout:()=>void;
 onQuantityChange:(key:string,delta:number)=>void;
 onRemove:(key:string)=>void;
 onRetryQuote:()=>void;
 onRetryCatalog:()=>void;
};
export default function CartView({cart,products,count,total,t,onBrowseCatalog,quoteState='idle',catalogState,
 onCheckout,onQuantityChange,onRemove,onRetryQuote,onRetryCatalog}:Props){
 const state=cartReadiness(cart,products,catalogState,quoteState);
 const hasFmic=state.supplier.length>0;
 const manualPending=state.manual.length>0&&catalogState!=='ready';
 const manualMissing=catalogState==='ready'&&state.missing.length>0;
 const group=(lines:CartLine[])=> <CartLineList lines={lines} editable products={products} onQuantityChange={onQuantityChange} onRemove={onRemove}/>;
 return <main className="page rpm-cart-page"><button className="rpm-cart-continue rpm-cart-back" onClick={onBrowseCatalog}><ArrowLeft size={17}/>{t('Kontynuuj zakupy')}</button><header className="page-heading"><span className="eyebrow">RPM CUSTOM</span><h1>{t('Twój koszyk')} <small>({count}{t(' szt.')})</small></h1></header>
 {cart.length?<div className="rpm-cart-layout"><div className="rpm-cart-content">
 {manualPending&&<div className="rpm-cart-notice" role="status"><AlertCircle size={20}/><div>{catalogState==='error'?t('Nie udało się pobrać produktów.'):t('Sprawdzanie produktów w koszyku…')}{catalogState==='error'&&<button className="outline" onClick={onRetryCatalog}><RefreshCw size={16}/>{t('Spróbuj ponownie')}</button>}</div></div>}
 {state.mode==='mixed'?<><section className="rpm-cart-group"><h2>{t('Produkty RPM Custom')}</h2>{group(state.manual)}</section><section className="rpm-cart-group"><h2>{t('Produkty z katalogu dostawcy')}</h2>{group(state.supplier)}</section></>:group(cart)}
 </div><aside className="summary rpm-cart-summary"><h2>{t('Podsumowanie')}</h2><div className="rpm-cart-summary-row"><span>{t('Produkty')} ({count}{t(' szt.')})</span><strong>{money(total)}</strong></div><div className="rpm-cart-summary-row"><span>{t('Dostawa')}</span><span>{t('Do ustalenia')}</span></div><div className="rpm-cart-summary-total"><span>{t('Wartość produktów')}</span><strong>{money(total)}</strong></div><small>{t('Cena brutto. Koszt dostawy poza podaną kwotą.')}</small>
 {hasFmic&&<div role="status" className="rpm-cart-quote-state">{quoteState==='loading'||quoteState==='idle'?t('Sprawdzanie aktualnych cen katalogowych…'):quoteState==='error'?<>{t('Nie udało się sprawdzić aktualnych cen.')}<button className="outline" onClick={onRetryQuote}><RefreshCw size={16}/>{t('Spróbuj ponownie')}</button></>:t('Ceny według ostatniego importu. Dostępność i dostawa wymagają potwierdzenia.')}</div>}
 {state.mode==='mixed'?<div className="rpm-cart-notice" role="status"><AlertCircle size={20}/><div><strong>{t('Koszyk z dwóch źródeł')}</strong><p>{t('Wspólna finalizacja nie jest jeszcze dostępna. Aby złożyć zamówienie lub zapytanie, pozostaw w koszyku produkty z jednego źródła.')}</p></div></div>:state.mode==='supplier'?<FmicQuoteForm cart={cart} ready={state.canQuote}/>:<>{manualMissing&&<div className="rpm-cart-notice" role="status"><AlertCircle size={20}/><div>{t('Usuń niedostępne pozycje przed przejściem do zamówienia.')}</div></div>}<button className="primary" disabled={!state.canCheckout} onClick={onCheckout}>{t('Przejdź do zamówienia')} <ArrowRight size={18}/></button></>}
 <div className="rpm-cart-trust"><ShieldCheck size={20}/><span>{t('Bez automatycznego pobierania płatności.')}</span></div></aside></div>:<div className="empty rpm-cart-empty"><ShoppingCart size={48}/><h2>{t('Koszyk jest pusty')}</h2><p>{t('Znajdź części do swojego projektu.')}</p><button className="primary" onClick={onBrowseCatalog}>{t('Przeglądaj produkty')} <ArrowRight size={18}/></button></div>}</main>
}
