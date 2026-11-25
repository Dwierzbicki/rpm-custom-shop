'use client';
import {ArrowRight,ShoppingCart} from 'lucide-react';
import type {Product,CartLine} from '../../data';
import {money} from '../../data';
import CartLineList from './CartLineList';

type Props={
 cart:CartLine[];
 quoteState?:'idle'|'loading'|'ready'|'error';
 products:Product[];
 count:number;
 total:number;
 t:(label:string)=>string;
 onBrowseCatalog:()=>void;
 onCheckout:()=>void;
 onOpenProduct:(product:Product)=>void;
 onQuantityChange:(key:string,delta:number)=>void;
 onRemove:(key:string)=>void;
};

/** Controlled cart layout; state and navigation remain in the Shop controller. */
export default function CartView({cart,products,count,total,t,onBrowseCatalog,quoteState='idle',
 onCheckout,onOpenProduct,onQuantityChange,onRemove}:Props){
 const hasFmic=cart.some(l=>Boolean(l.fmicSku));
 return (
  <main className="page narrow"><div className="page-heading"><span className="eyebrow">RPM CUSTOM / CHECKOUT</span><h1>{t("TWÓJ KOSZYK")}</h1></div>{cart.length? <><div className="rpm-cart-layout"><div><div className="rpm-cart-section-head"><h2>{t('Produkty w koszyku')} <small>({count}{t(' szt.')})</small></h2><button className="rpm-cart-continue" onClick={onBrowseCatalog}>{t('Kontynuuj zakupy')} <ArrowRight size={16}/></button></div>{<CartLineList lines={cart} editable={true} products={products} onOpen={onOpenProduct} onQuantityChange={onQuantityChange} onRemove={onRemove}/>}</div><aside className="summary rpm-cart-summary"><h2>{t("Podsumowanie")}</h2><div className="rpm-cart-summary-row"><span>{t('Produkty')} ({count}{t(' szt.')})</span><strong>{money(total)}</strong></div><div className="rpm-cart-summary-row"><span>{t("Dostawa")}</span><span>{t('Do ustalenia')}</span></div><div className="rpm-cart-summary-total"><span>{t('Wartość produktów')}</span><strong>{money(total)}</strong></div>{hasFmic?<><small role="status">{quoteState==='loading'?t("Sprawdzanie aktualnych cen katalogowych…"):quoteState==='error'?t("Nie udało się sprawdzić aktualnych cen. Odśwież koszyk."):t("Ceny według ostatniego importu. Koszt dostawy, ilość i warunki sprzedaży wymagają potwierdzenia.")}</small><button className="primary" disabled>{t("Zakup online jeszcze niedostępny")}</button></>:<><small>{t('Koszt dostawy i dostępność potwierdzimy przed realizacją. Płatność online nie jest pobierana.')}</small><button className="primary" onClick={onCheckout}>{t('Przejdź do zamówienia')} <ArrowRight size={18}/></button></>}</aside></div></>:<div className="empty"><ShoppingCart size={42}/><h2>{t("Koszyk jest pusty")}</h2><button className="primary" onClick={onBrowseCatalog}>{t("Przeglądaj produkty")}</button></div>}</main>
 );
}
