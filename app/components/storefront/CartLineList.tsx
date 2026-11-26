'use client';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
import {ArrowRight,Minus,Plus,Trash2} from 'lucide-react';
import {productPath} from '../../lib/product-path';
import ProductImage from './ProductImage';
import {money} from '../../data';
import type {CartLine,Product} from '../../data';

type Props={
 lines:CartLine[];
 editable:boolean;
 products:Product[];
 onQuantityChange:(key:string,delta:number)=>void;
 onRemove:(key:string)=>void;
};

/** Shared rendering for editable cart lines and read-only Garage lines. */
export default function CartLineList({lines,editable,products,onQuantityChange,onRemove}:Props){
 const {t}=useStorefrontLanguage();
 return (<div className="line-list rpm-cart-lines">{lines.map(l=>{if(l.fmicSku){const name=l.fmicName??l.fmicSku;const price=l.unitPrice??0;return <div className="cart-line rpm-cart-line" key={l.key}><div className="rpm-cart-image"><ProductImage src={l.fmicImage} alt={name}/></div><div className="line-detail rpm-cart-detail"><a className="rpm-cart-product-link" href={productPath(name,l.fmicSku)}>{name} <ArrowRight size={14}/></a><small>SKU: {l.fmicSku}</small><small>{l.fmicAvailable===false?t("Produkt niedostępny"):t("Dostępność według katalogu FMIC")}</small><span>{t("Proponowana cena jednostkowa: ")}<strong>{money(price)}</strong></span>{l.fmicPreviousPrice!==undefined&&l.fmicPreviousPrice!==price&&<small className="rpm-cart-price-change">{t('Cena uległa zmianie')}: {money(l.fmicPreviousPrice)} → {money(price)}</small>}</div><div className="rpm-cart-controls">{editable&&<div className="quantity"><button aria-label={t("Zmniejsz ilość")} disabled={l.qty<=1} onClick={()=>onQuantityChange(l.key,-1)}><Minus size={15}/></button><strong>{l.qty}</strong><button aria-label={t("Zwiększ ilość")} disabled={l.qty>=50} onClick={()=>onQuantityChange(l.key,1)}><Plus size={15}/></button></div>}<strong className="rpm-cart-line-total">{money(price*l.qty)}</strong>{editable&&<button className="rpm-cart-remove" aria-label={t('Usuń ')+name} onClick={()=>onRemove(l.key)}><Trash2 size={15}/> {t('Usuń')}</button>}</div></div>};const p=products.find(x=>x.id===l.productId) as (Product&{visible?:boolean;stockStatus?:string})|undefined;if(!p||p.visible===false||p.stockStatus==='unavailable')return <div className="cart-line rpm-cart-line" key={l.key}><div className="rpm-cart-image"><ProductImage alt={t('Produkt niedostępny')}/></div><div className="line-detail rpm-cart-detail"><strong>{p?.name??t('Produkt o ID')+' '+l.productId}</strong><small>{t('Produkt nie jest obecnie dostępny w katalogu.')}</small></div>{editable&&<div className="rpm-cart-controls"><button className="rpm-cart-remove" onClick={()=>onRemove(l.key)}><Trash2 size={15}/>{t('Usuń')}</button></div>}</div>;const price=l.unitPrice??p.price;return <div className="cart-line rpm-cart-line" key={l.key}><div className="rpm-cart-image"><ProductImage src={p.images?.[0]} alt={p.name}/></div><div className="line-detail rpm-cart-detail"><a className="rpm-cart-product-link" href={productPath(p.name,p.sku)}>{p.name} <ArrowRight size={14}/></a><small>SKU: {p.sku}</small>{l.options&&Object.keys(l.options).length>0&&<div className="rpm-cart-options">{Object.entries(l.options).map(([k,v])=><span key={k}><b>{k}:</b> {v}</span>)}</div>}<span>{t("Cena jednostkowa: ")}<strong>{money(price)}</strong></span></div><div className="rpm-cart-controls">{editable&&<div className="quantity"><button aria-label={t("Zmniejsz ilość")} disabled={l.qty<=1} onClick={()=>onQuantityChange(l.key,-1)}><Minus size={15}/></button><strong>{l.qty}</strong><button aria-label={t("Zwiększ ilość")} disabled={l.qty>=50} onClick={()=>onQuantityChange(l.key,1)}><Plus size={15}/></button></div>}<strong className="rpm-cart-line-total">{money(price*l.qty)}</strong>{editable&&<button className="rpm-cart-remove" aria-label={t("Usuń ")+p.name} onClick={()=>onRemove(l.key)}><Trash2 size={15}/> {t('Usuń')}</button>}</div></div>})}</div>);
}
