import ProductImage from './ProductImage';
import {ChevronRight} from 'lucide-react';
import type {Product} from '../../data';
import {money} from '../../data';
import {productPath} from '../../lib/product-path';

type Props={
 product:Product;
 translate:(label:string)=>string;
};

/** One product tile. Styling deliberately stays in globals.css for now. */
export default function ProductCard({product:p,translate:t}:Props){
 return (<a className="product-card" href={productPath(p.name,p.sku)}><div className="product-art"><ProductImage className="product-photo" src={p.images?.[0]} alt={p.name}/><span className="art-label">{t(p.category)}</span></div><div className="product-info"><small>{p.brand} · {p.sku}</small><strong>{p.name}</strong><span className="price">{money(p.price)} <small>{t("brutto")}</small></span><span className="product-link">{t(p.configurable?'Wybierz opcje':'Zobacz produkt')} <ChevronRight size={15}/></span></div></a>);
}
