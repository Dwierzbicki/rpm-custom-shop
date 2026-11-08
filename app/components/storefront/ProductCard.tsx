import {ChevronRight} from 'lucide-react';
import type {Product} from '../../data';
import {money} from '../../data';

type Props={
 product:Product;
 onOpen:(product:Product)=>void;
 translate:(label:string)=>string;
};

/** One product tile. Styling deliberately stays in globals.css for now. */
export default function ProductCard({product:p,onOpen,translate:t}:Props){
 return (<button key={p.id} className="product-card" onClick={()=>onOpen(p)}><div className="product-art">{p.images?.[0]?<img className="product-photo" src={p.images[0]} alt={p.name} loading="lazy"/>:<span className="art-symbol">{p.category==='Kolektory'?'⚙':p.category==='Turbo'?'◉':p.category==='Intercoolery'?'▤':p.category==='Wastegate'?'◈':'⬡'}</span>}<span className="art-label">{t(p.category)}</span></div><div className="product-info"><small>{p.brand} · {p.sku}</small><strong>{p.name}</strong><span className="price">{money(p.price)} <small>DEMO</small></span><span className="product-link">{t(p.configurable?'Wybierz opcje':'Zobacz produkt')} <ChevronRight size={15}/></span></div></button>);
}
