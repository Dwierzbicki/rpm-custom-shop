'use client';
import type {Dispatch,SetStateAction} from 'react';
import {ChevronLeft,ChevronRight,Minus,Plus,ShieldAlert,ShoppingCart,Warehouse,ZoomIn} from 'lucide-react';
import {money} from '../../data';
import type {Product,ProductOptionGroup} from '../../data';
import ProductOptions from './ProductOptions';

type Props={
 selected:Product;
 lang:'pl'|'en';
 t:(label:string)=>string;
 photoIndex:number;
 onPhotoIndex:Dispatch<SetStateAction<number>>;
 onZoom:()=>void;
 onBack:()=>void;
 usesCustom:boolean;
 customGroups:ProductOptionGroup[];
 chosenOptions:Record<string,string>;
 automaticWg:string;
 customExtra:number;
 selectedPrice:number;
 unitPrice:number;
 totalPrice:number;
 qty:number;
 canAdd:boolean;
 engine:string;
 flange:string;
 wg:string;
 egt:boolean;
 onOption:(groupId:string,value:string)=>void;
 onEngine:(value:string)=>void;
 onFlange:(value:string)=>void;
 onWg:(value:string)=>void;
 onEgt:(value:boolean)=>void;
 onQuantity:(next:number)=>void;
 onAddToCart:()=>void;
 onAddToGarage:()=>void;
};

/** Product gallery, availability, configuration and add-to-cart controls. */
export default function ProductDetailView({
 selected,lang,t,photoIndex,onPhotoIndex,onZoom,onBack,usesCustom,customGroups,
 chosenOptions,automaticWg,customExtra,selectedPrice,unitPrice,totalPrice,qty,canAdd,
 engine,flange,wg,egt,onOption,onEngine,onFlange,onWg,onEgt,onQuantity,onAddToCart,onAddToGarage
}:Props){
 return (
  <main className="page"><button className="back" onClick={onBack}>← Wróć do katalogu</button><div className="detail-grid"><div className="detail-art">{selected.images?.length?<div className="detail-gallery"><div className="detail-main-photo"><img className="detail-photo" src={selected.images[photoIndex]??selected.images[0]} alt={selected.name}/><button className="photo-zoom" type="button" onClick={onZoom} aria-label="Powiększ zdjęcie"><ZoomIn size={20}/></button>{selected.images.length>1&&<><button className="photo-prev" type="button" aria-label="Poprzednie zdjęcie" onClick={()=>onPhotoIndex(i=>(i-1+selected.images!.length)%selected.images!.length)}><ChevronLeft size={22}/></button><button className="photo-next" type="button" aria-label="Następne zdjęcie" onClick={()=>onPhotoIndex(i=>(i+1)%selected.images!.length)}><ChevronRight size={22}/></button></>}</div><div className="detail-thumbnails">{selected.images.map((url,i)=><button className={photoIndex===i?'selected':''} aria-label={"Pokaż zdjęcie "+(i+1)} aria-pressed={photoIndex===i} type="button" key={url} onClick={()=>onPhotoIndex(i)}><img src={url} alt={"Miniatura "+(i+1)}/></button>)}</div><small className="photo-count">{photoIndex+1} / {selected.images.length}</small></div>:<><span className="detail-symbol">{selected.category==='Kolektory'?'⚙':selected.category==='Intercoolery'?'▤':'◉'}</span><span>DEMO PRODUCT IMAGE / {selected.sku}</span></>}</div><div className="detail-body"><span className="eyebrow">{selected.brand} / {selected.category}</span><h1>{selected.name}</h1><div className="rpm-product-sku"><span>{lang==='en'?'Product code (SKU)':'Kod produktu (SKU)'}</span><strong>{selected.sku||String(selected.id)}</strong></div><p>{selected.description}</p><div className="product-availability"><span className={((selected as Product & {stockStatus?:string}).stockStatus??'available')==='unavailable'?'stock-dot out':'stock-dot'}/>{((selected as Product & {stockStatus?:string}).stockStatus)==='unavailable'?'Niedostępny':((selected as Product & {stockStatus?:string}).stockStatus)==='order'?'Na zamówienie':'Dostępny'}{(selected as Product & {leadTime?:string}).leadTime&&<small> · {(selected as Product & {leadTime?:string}).leadTime}</small>}</div><div className="price-large">{money(usesCustom?selectedPrice:selected.price)} <small>{t("cena bazowa DEMO")}</small></div><ProductOptions
 selected={selected} usesCustom={usesCustom} customGroups={customGroups}
 chosenOptions={chosenOptions} automaticWg={automaticWg}
 customExtra={customExtra} selectedPrice={selectedPrice}
 engine={engine} flange={flange} wg={wg} egt={egt} t={t}
 onOption={onOption} onEngine={onEngine} onFlange={onFlange}
 onWg={onWg} onEgt={onEgt}
/>{qty>1&&<div className="rpm-product-total" aria-live="polite"><div><span>Cena jednostkowa</span><strong>{money(unitPrice)} / szt.</strong></div><div className="rpm-product-total-highlight" key={qty+"-"+unitPrice}><span>Łącznie za {qty} {qty===1?"sztukę":"szt."}</span><strong>{money(totalPrice)}</strong></div></div>}<div className="buy-row"><div className="quantity"><button aria-label="Zmniejsz ilość" disabled={qty<=1} onClick={()=>onQuantity(Math.max(1,qty-1))}><Minus size={16}/></button><strong>{qty}</strong><button aria-label="Zwiększ ilość" onClick={()=>onQuantity(Math.min(50,qty+1))} disabled={qty>=50}><Plus size={16}/></button></div><button className="primary" disabled={!canAdd} onClick={onAddToCart}><ShoppingCart size={17}/> Dodaj do koszyka</button></div><button className="outline full" disabled={!!selected.configurable&&((selected.id===1&&!engine)||!flange||!wg)} onClick={onAddToGarage}><Warehouse size={17}/> Zapisz w RPM Garage Lite</button><div className="detail-note"><ShieldAlert size={18}/><span>{t("To demonstracja. Zakup, dostępność i płatności są wyłączone. Zdjęcia zastąpimy prawdziwymi fotografiami produktów.")}</span></div></div></div></main>
 );
}
