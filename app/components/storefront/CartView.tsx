'use client';
import {ArrowRight,ShoppingCart} from 'lucide-react';
import type {Product,CartLine} from '../../data';
import {money} from '../../data';
import CartLineList from './CartLineList';

type Props={
 cart:CartLine[];
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
export default function CartView({cart,products,count,total,t,onBrowseCatalog,
 onCheckout,onOpenProduct,onQuantityChange,onRemove}:Props){
 return (
  <main className="page narrow"><div className="page-heading"><span className="eyebrow">RPM CUSTOM / CHECKOUT</span><h1>{t("TWÓJ KOSZYK")}</h1></div>{cart.length? <><div className="rpm-cart-layout"><div><div className="rpm-cart-section-head"><h2>Produkty w koszyku <small>({count} szt.)</small></h2><button className="rpm-cart-continue" onClick={onBrowseCatalog}>Kontynuuj zakupy <ArrowRight size={16}/></button></div>{<CartLineList lines={cart} editable={true} products={products} onOpen={onOpenProduct} onQuantityChange={onQuantityChange} onRemove={onRemove}/>}</div><aside className="summary rpm-cart-summary"><h2>Podsumowanie</h2><div className="rpm-cart-summary-row"><span>Produkty ({count} szt.)</span><strong>{money(total)}</strong></div><div className="rpm-cart-summary-row"><span>Dostawa</span><span>Do ustalenia</span></div><div className="rpm-cart-summary-total"><span>Wartość produktów</span><strong>{money(total)}</strong></div><small>Koszt dostawy i dostępność potwierdzimy przed realizacją. Płatność online nie jest pobierana.</small><button className="primary" onClick={onCheckout}>Przejdź do zamówienia <ArrowRight size={18}/></button></aside></div></>:<div className="empty"><ShoppingCart size={42}/><h2>{t("Koszyk jest pusty")}</h2><button className="primary" onClick={onBrowseCatalog}>{t("Przeglądaj produkty")}</button></div>}</main>
 );
}
