'use client';
import {useState,type MouseEvent} from 'react';
import {ArrowRight,Check} from 'lucide-react';
import ProductBrandLogo from './ProductBrandLogo';
import ProductImage from './ProductImage';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
import {productPath} from '../../lib/product-path';
import {variantColor} from '../../lib/storefront-variants';
import {listingCardChoices,selectedListingProduct,type ListingProduct} from '../../lib/listing-card-variants';

export default function FmicListingCard({product,lang,onOpen}:{product:ListingProduct;lang:string;onOpen:(sku:string,name?:string)=>void}){
 const {t}=useStorefrontLanguage();
 const [chosen,setChosen]=useState<string>(),[expanded,setExpanded]=useState(false);
 const options=listingCardChoices(product),p=selectedListingProduct(product,chosen);
 const selected=options.find(v=>v.sku===p.sku);
 const visible=expanded?options:options.length<=6?options:options.some((v,i)=>i<6&&v.sku===p.sku)?options.slice(0,6):[...options.slice(0,5),...options.filter(v=>v.sku===p.sku)];
 const href=productPath(p.name,p.sku);
 const open=(e:MouseEvent<HTMLAnchorElement>)=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();onOpen(p.sku,p.name)};
 const label=lang==='en'?'Colour':'Kolor';
 return <article className="fplp-card" data-listing-sku={p.sku} data-variant-family={product.variant_family_id??undefined}>
  <a href={href} className="fplp-image" onClick={open}><ProductImage key={p.sku} src={p.image} alt={p.name}/></a>
  <div className="fplp-card-info">
   <div className="fplp-card-meta"><small className="fplp-sku">{p.sku}</small><ProductBrandLogo brand={p.brand} name={p.name}/></div>
   <a className="fplp-name" href={href} title={p.name} onClick={open}>{p.name}</a>
   {options.length>0&&selected?<div className="fplp-variant-picker">
    <div className="fplp-variant-caption"><span>{label}: <strong>{variantColor(selected.color,lang==='en').label}</strong></span><small>{product.variant_count??options.length}</small></div>
    <div className="fplp-variant-swatches" role="group" aria-label={label}>
     {visible.map(v=>{const color=variantColor(v.color,lang==='en'),active=v.sku===p.sku;
      const description=color.label+(!v.available?' · '+t('Niedostępny'):'')+' · '+Number(v.proposed_gross).toLocaleString('pl-PL',{style:'currency',currency:'PLN'});
      return <button key={v.sku} type="button" className={'fplp-variant-swatch'+(!v.available?' is-unavailable':'')} aria-label={description} aria-pressed={active} title={description} data-variant-sku={v.sku} onClick={()=>setChosen(v.sku)}>
       <span style={color.swatch?{backgroundColor:color.swatch}:undefined} aria-hidden="true">{active&&<Check size={13}/>}</span>
      </button>})}
     {options.length>6&&<button className="fplp-variant-more" type="button" aria-expanded={expanded} onClick={()=>setExpanded(x=>!x)}>{expanded?(lang==='en'?'Less':'Mniej'):'+'+(options.length-6)}</button>}
    </div>
    {(product.variant_count??0)>options.length&&<small className="fplp-variant-hint">{lang==='en'?'More colours on the product page':'Więcej kolorów na karcie produktu'}</small>}
   </div>:(product.variant_count??0)>1?<span className="fplp-variant-count">{product.variant_count} {lang==='en'?'colour variants':'warianty kolorystyczne'}</span>:null}
   <span className={'fplp-stock '+(p.available?'':'out')}><i/>{p.available?t('Dostępny'):p.manual_stock_status==='order'?t('Na zamówienie'):t('Niedostępny')}</span>
   <div className="fplp-card-bottom"><div><strong>{Number(p.proposed_gross).toLocaleString('pl-PL',{style:'currency',currency:'PLN'})}</strong><small>{t('brutto')}</small></div><button type="button" onClick={()=>onOpen(p.sku,p.name)} aria-label={t('Zobacz ')+p.name}><span>{t('Zobacz produkt')}</span><ArrowRight size={17}/></button></div>
  </div>
 </article>;
}
