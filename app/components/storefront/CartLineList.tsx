import {ArrowRight,Minus,Plus,Trash2,Package} from 'lucide-react';
import {money} from '../../data';
import type {CartLine,Product} from '../../data';

type Props={
 lines:CartLine[];
 editable:boolean;
 products:Product[];
 onOpen:(product:Product)=>void;
 onQuantityChange:(key:string,delta:number)=>void;
 onRemove:(key:string)=>void;
};

/** Shared rendering for editable cart lines and read-only Garage lines. */
export default function CartLineList({lines,editable,products,onOpen,onQuantityChange,onRemove}:Props){
 return (<div className="line-list rpm-cart-lines">{lines.map(l=>{const p=products.find(x=>x.id===l.productId);if(!p)return null;const price=l.unitPrice??p.price;return <div className="cart-line rpm-cart-line" key={l.key}><div className="rpm-cart-image">{p.images?.[0]?<img src={p.images[0]} alt={p.name} loading="lazy"/>:<Package size={30}/>}</div><div className="line-detail rpm-cart-detail"><button type="button" className="rpm-cart-product-link" onClick={()=>onOpen(p)}>{p.name} <ArrowRight size={14}/></button><small>SKU: {p.sku}</small>{l.options&&Object.keys(l.options).length>0&&<div className="rpm-cart-options">{Object.entries(l.options).map(([k,v])=><span key={k}><b>{k}:</b> {v}</span>)}</div>}<span>Cena jednostkowa: <strong>{money(price)}</strong></span></div><div className="rpm-cart-controls">{editable&&<div className="quantity"><button aria-label="Zmniejsz ilość" disabled={l.qty<=1} onClick={()=>onQuantityChange(l.key,-1)}><Minus size={15}/></button><strong>{l.qty}</strong><button aria-label="Zwiększ ilość" disabled={l.qty>=50} onClick={()=>onQuantityChange(l.key,1)}><Plus size={15}/></button></div>}<strong className="rpm-cart-line-total">{money(price*l.qty)}</strong>{editable&&<button className="rpm-cart-remove" aria-label={"Usuń "+p.name} onClick={()=>onRemove(l.key)}><Trash2 size={15}/> Usuń</button>}</div></div>})}</div>);
}
