'use client';
import type {ProductTechnical} from '../../lib/fmic-technical';
import ProductImage from './ProductImage';
import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,ShoppingCart,ZoomIn,X,FileText,ListChecks,ChevronDown,ShieldCheck} from 'lucide-react';
import '../../styles/fmic-product.css';
import {categoryPath} from '../../category-routing';
export type FmicItem={sku:string;name:string;proposed_gross:string;available:boolean;image:string|null};
export type Detail={product:Omit<FmicItem,'image'>&{images:string[];target_category:string[];ean:string;mpn:string;brand:string;shipping_weight:string;description?:string;technical?:ProductTechnical};related:FmicItem[]};
export const fmicMoney=(p:string)=>Number(p).toLocaleString('pl-PL',{style:'currency',currency:'PLN'});
export default function FmicProductPreview({sku,onBack,onOpen,initialData}:{sku:string;onBack:()=>void;onOpen:(sku:string,name?:string)=>void;initialData?:Detail}){
 const [data,setData]=useState<Detail|null>(initialData??null),[error,setError]=useState(''),[photo,setPhoto]=useState(0);
 const zoom=useRef<HTMLDialogElement>(null);
 const [expanded,setExpanded]=useState(false);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{if(initialData?.product.sku===sku&&retry===0){setData(initialData);return}const ctrl=new AbortController();setData(null);setError('');setPhoto(0);setExpanded(false);zoom.current?.close();
 const timer=setTimeout(()=>{ctrl.abort();setError('Przekroczono czas ładowania produktu. Spróbuj ponownie.')},20000);
 fetch('/api/catalog/fmic/product?'+new URLSearchParams({sku}),{cache:'no-store',signal:ctrl.signal}).then(async r=>{if(!r.ok)throw Error(r.status===401?'Zaloguj się do sklepu.':r.status===404?'Nie znaleziono produktu.':'Błąd pobierania produktu.');return r.json()}).then(d=>{if(!ctrl.signal.aborted)setData(d)}).catch(e=>{if(!ctrl.signal.aborted)setError(e.message)}).finally(()=>clearTimeout(timer));
 return()=>{clearTimeout(timer);ctrl.abort()}},[sku,retry,initialData]);
 const p=data?.product;
 const images=(Array.isArray(p?.images)?p.images:[]).filter(u=>typeof u==='string'&&u.startsWith('https://'));
 const technical=p?.technical;
 const hasTechnical=!!technical?.fields?.length;
 const rawDescription=(hasTechnical?technical?.intro:p?.description)?.trim()??'';
 const description=rawDescription===p?.name.trim()?'':rawDescription;
 const highlights=['power','ar','turbine_inlet','bearing'].flatMap(key=>technical?.fields.filter(f=>f.key===key)??[]);
 const remainingFields=(technical?.fields??[]).filter(f=>!highlights.some(h=>h.key===f.key));
 const splitAt=Math.ceil(remainingFields.length/2);
 const technicalTables=[remainingFields.slice(0,splitAt),remainingFields.slice(splitAt)].filter(group=>group.length>0);
 const longDescription=description.length>900||description.split('\n').length>12;
 const specification=p?[['Kod produktu (SKU)',p.sku],['Producent',p.brand],['Numer producenta',p.mpn],['EAN',p.ean],['Waga wysyłkowa',p.shipping_weight]].filter(([,v])=>v):[];
 const move=(step:number)=>setPhoto(i=>(i+step+images.length)%images.length);
 return <section className={"fmic-pdp"+(hasTechnical?" has-technical":"")}><button className="back fmic-pdp-back" onClick={onBack}>← Wróć do katalogu</button>
 {error?<div role="alert" className="rpm-pdp-load-error"><p>{error}</p><button type="button" className="outline" onClick={()=>setRetry(v=>v+1)}>Spróbuj ponownie</button></div>:!p?<div role="status" aria-label="Ładowanie produktu" className="rpm-pdp-loading"><div className="rpm-pdp-skeleton-title"/><div className="rpm-pdp-skeleton-grid"><div/><div/></div><p>Ładowanie produktu…</p></div>:<>
 <nav aria-label="Ścieżka kategorii" className="fmic-pdp-crumbs"><a href="/sklep">Sklep</a>{p.target_category.map((name,i)=><span key={i}> / <a href={categoryPath(p.target_category.slice(0,i+1))}>{name}</a></span>)}</nav>
 <header className="rpm-pdp-title"><div className="rpm-pdp-brandline"><span className="eyebrow">RPM CUSTOM / MOTO LAB</span>{p.brand&&<span className="rpm-pdp-brand">{p.brand}</span>}</div><h1>{p.name}</h1><div className="rpm-product-sku"><span>Kod produktu (SKU)</span><strong>{p.sku}</strong></div></header>
 <div className="fmic-pdp-grid"><div className="fmic-pdp-gallery">{images.length?<div className="detail-gallery"><div className="detail-main-photo"><ProductImage className="detail-photo" src={images[photo]??images[0]} alt={p.name}/><button className="photo-zoom" aria-label="Powiększ zdjęcie" onClick={()=>zoom.current?.showModal()}><ZoomIn size={20}/></button>{images.length>1&&<><button className="photo-prev" aria-label="Poprzednie zdjęcie" onClick={()=>move(-1)}><ChevronLeft/></button><button className="photo-next" aria-label="Następne zdjęcie" onClick={()=>move(1)}><ChevronRight/></button></>}</div><div className="detail-thumbnails">{images.map((url,i)=><button key={url} className={i===photo?'selected':''} aria-pressed={i===photo} aria-label={'Zdjęcie '+(i+1)} onClick={()=>setPhoto(i)}><img src={url} alt="" loading="lazy" referrerPolicy="no-referrer"/></button>)}</div><small>{photo+1} / {images.length}</small></div>:<div className="fmic-pdp-placeholder"><ProductImage alt={p.name}/></div>}</div>
 <div className="fmic-pdp-info">{highlights.length>0&&<div className="rpm-pdp-highlights">{highlights.map(f=><div key={f.key}><span>{f.key==='turbine_inlet'?'Flansza':f.label}</span><strong>{f.value}</strong></div>)}</div>}<div className="fmic-pdp-buy"><div className="product-availability"><span className={p.available?'stock-dot':'stock-dot out'}/>{p.available?'Dostępny u dostawcy':'Niedostępny u dostawcy'}</div><div className="price-large">{fmicMoney(p.proposed_gross)} <small>proponowana cena brutto</small></div><div className="buy-row"><button className="primary" disabled><ShoppingCart size={18}/> Dodaj do koszyka</button></div><p className="fmic-pdp-note">Sklep w przygotowaniu · sprzedaż wyłączona</p></div></div></div>
 {technical&&(remainingFields.length>0||!!technical.warranty)&&<section className="rpm-pdp-tech rpm-pdp-tech-panel" aria-labelledby="rpm-pdp-tech-title"><div className="rpm-pdp-section-head"><ListChecks size={19}/><h2 id="rpm-pdp-tech-title">Specyfikacja techniczna</h2></div>{technicalTables.length>0&&<div className={'rpm-pdp-tech-tables'+(technicalTables.length===1?' is-single':'')}>{technicalTables.map((group,i)=><dl key={i} aria-label={'Parametry techniczne – część '+(i+1)}>{group.map(f=><div key={f.key}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>)}</div>}{technical.warranty&&<div className="rpm-pdp-warranty"><ShieldCheck size={25} aria-hidden="true"/><div><strong>Gwarancja</strong><p>{technical.warranty}</p></div></div>}</section>}
 <div className={'rpm-pdp-details '+(!description?'rpm-pdp-details-single':'')}>
 {description&&<section className="fmic-pdp-spec rpm-pdp-description" aria-labelledby="rpm-pdp-description-title"><div className="rpm-pdp-section-head"><FileText size={21}/><h2 id="rpm-pdp-description-title">Opis produktu</h2></div><div id="rpm-pdp-description-content" className={'rpm-pdp-copy '+(longDescription&&!expanded?'is-collapsed':'')}>{description.split(/\n{2,}/).map((part,i)=><p key={i}>{part}</p>)}</div>{longDescription&&<button className="rpm-pdp-expand outline" type="button" aria-expanded={expanded} aria-controls="rpm-pdp-description-content" onClick={()=>setExpanded(v=>!v)}>{expanded?'Zwiń opis':'Rozwiń pełny opis'} <ChevronDown size={16} className={expanded?'is-expanded':''}/></button>}</section>}
 <section className="fmic-pdp-spec rpm-pdp-specification" aria-labelledby="rpm-pdp-spec-title"><div className="rpm-pdp-section-head"><ListChecks size={21}/><h2 id="rpm-pdp-spec-title">Dane produktu</h2></div><dl>{specification.map(([label,value])=><div key={label} className="fmic-pdp-spec-row"><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
 </div>
 {!!data?.related.length&&<><h2 className="fmic-pdp-related-title">Powiązane produkty</h2><div className="fmic-pdp-related">{data.related.map(item=><article key={item.sku} className="fmic-pdp-related-card"><div className="rpm-related-media"><ProductImage src={item.image} alt={item.name}/></div><div className="fmic-pdp-related-info"><strong>{item.name}</strong><small>{item.sku}</small><strong>{fmicMoney(item.proposed_gross)}</strong><button className="outline" onClick={()=>onOpen(item.sku,item.name)}>Zobacz produkt</button></div></article>)}</div></>}
 <dialog ref={zoom} className="rpm-fmic-lightbox" aria-label="Galeria produktu"><div className="rpm-fmic-lightbox-inner"><div className="rpm-fmic-lightbox-head"><span>Zdjęcie produktu</span><button type="button" className="outline" onClick={()=>zoom.current?.close()} aria-label="Zamknij powiększenie"><X size={20}/></button></div>{images.length>0&&<div className="rpm-fmic-lightbox-media"><img src={images[photo]??images[0]} alt={p.name} referrerPolicy="no-referrer"/></div>}{images.length>1&&<div className="rpm-fmic-lightbox-nav"><button type="button" className="outline" onClick={()=>move(-1)}><ChevronLeft size={17}/> Poprzednie</button><span>{photo+1} / {images.length}</span><button type="button" className="outline" onClick={()=>move(1)}>Następne <ChevronRight size={17}/></button></div>}</div></dialog>
 </>}</section>
}
