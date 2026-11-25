'use client';
import {useEffect,useRef,useState} from 'react';
import {suggestionHref,matchesSearch} from '../../lib/header-search';
import './header-search.css';
import {Package,Search,ShoppingCart,UserRound,Warehouse} from 'lucide-react';
import type {CategoryNavigationProps} from './CategoryNavigation';
import CategoryNavigation from './CategoryNavigation';

type Suggestion={sku:string;name:string;proposed_gross:string;available:boolean;image:string|null};
type OwnSuggestion={id:string;name:string;sku:string;price:number;image?:string;keywords?:string};
type Props=CategoryNavigationProps&{
 fmicPreview?:boolean;
 ownSuggestions?:OwnSuggestion[];
 onOwnSuggestion?:(id:string)=>void;
 compactCategories:boolean;
 lang:'pl'|'en';
 query:string;
 count:number;
 onQuery:(value:string)=>void;
 onHome:()=>void;
 onSearchSubmit:()=>void;
 onLanguageChange:(value:'pl'|'en')=>void;
 onGarage:()=>void;
 onCart:()=>void;
};

/** Storefront header keeps the existing DOM and CSS class names. */
export default function StorefrontHeader({
 compactCategories,lang,query,count,onQuery,onHome,onSearchSubmit,fmicPreview=false,ownSuggestions=[],onOwnSuggestion,
 onLanguageChange,onGarage,onCart,mobileMenu,setMobileMenu,
 activeFmicRoot,setActiveFmicRoot,activeFmicSub,setActiveFmicSub,
 onOpenCatalogPath,onMotoLab
}:Props){
 const [open,setOpen]=useState(false),[remote,setRemote]=useState<Suggestion[]>([]),[pending,setPending]=useState(false),[failed,setFailed]=useState(false),[active,setActive]=useState(-1);
 const form=useRef<HTMLFormElement>(null);
 const term=query.trim();
 const own=term.length>=2?ownSuggestions.filter(p=>matchesSearch(term,[p.name,p.sku,p.keywords])).slice(0,3):[];
 const results=[...own.map(p=>({key:'own-'+p.id,name:p.name,sku:p.sku,price:p.price,image:p.image??null,available:null as boolean|null,choose:()=>onOwnSuggestion?.(p.id)})),...remote.map(p=>({key:'fmic-'+p.sku,name:p.name,sku:p.sku,price:Number(p.proposed_gross),image:p.image,available:p.available as boolean|null,choose:()=>{window.location.assign(suggestionHref(p.sku,term))}}))];
 useEffect(()=>{setRemote([]);setActive(-1);setFailed(false);setPending(false);if(!open||!fmicPreview||term.length<2)return;const controller=new AbortController();setPending(true);const timer=setTimeout(async()=>{try{const response=await fetch('/api/admin/fmic-preview/suggest?'+new URLSearchParams({q:term}),{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('Search unavailable');const data=await response.json();if(!controller.signal.aborted)setRemote(data.items??[])}catch{if(!controller.signal.aborted)setFailed(true)}finally{if(!controller.signal.aborted)setPending(false)}},350);return()=>{clearTimeout(timer);controller.abort()}},[term,open,fmicPreview]);
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(!form.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[]);
 const visible=open&&term.length>=2;
 function choose(i:number){const result=results[i];if(!result)return;setOpen(false);setActive(-1);result.choose()}
 return (
<header className={"header rpm-header-v2"+(compactCategories?" rpm-header-compact":" rpm-header-wide")}>
 <div className="rpm-header-main">
 <button className="logo rpm-header-logo" onClick={onHome} aria-label="RPM Custom — strona główna"><img src="/rpm-logo.png.png" alt="RPM Custom — Exhaust & Intake Solutions" className="brand-logo"/></button>
 <form ref={form} className="rpm-header-search rpm-live-search" role="search" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}} onSubmit={e=>{e.preventDefault();if(active>=0&&visible&&results[active]){choose(active);return}setOpen(false);setActive(-1);onSearchSubmit()}}>
 <label htmlFor="rpm-header-query" className="rpm-visually-hidden">{lang==='en'?'Search products':'Szukaj produktów'}</label>
 <input id="rpm-header-query" value={query} maxLength={120} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls="rpm-search-results" aria-activedescendant={visible&&active>=0&&results[active]?'rpm-search-option-'+active:undefined} onFocus={()=>setOpen(true)} onChange={e=>{setRemote([]);setActive(-1);onQuery(e.target.value);setOpen(true)}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);setActive(-1)}else if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);setActive(i=>Math.min(results.length-1,i+1))}else if(e.key==='ArrowUp'){e.preventDefault();setActive(i=>Math.max(-1,i-1))}}} placeholder={lang==='en'?'Search by name or part number':'Szukaj po nazwie lub numerze części'}/>
 <button type="submit" aria-label={lang==='en'?'Search':'Szukaj'}><Search size={21}/></button>
 {visible&&<div className="rpm-search-dropdown"><div className="rpm-search-caption">{lang==='en'?'Product suggestions':'Podpowiedzi produktów'}</div><div id="rpm-search-results" role="listbox" aria-label="Produkty">{results.map((p,i)=><div role="option" aria-selected={active===i} id={'rpm-search-option-'+i} key={p.key} className={'rpm-search-result '+(active===i?'active':'')} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(i)}><span className="rpm-search-thumb">{p.image?<img src={p.image} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:<Package size={22}/>}</span><span className="rpm-search-info"><strong>{p.name}</strong><small>{p.sku}</small>{p.available!==null&&<small className={p.available?'in-stock':'out-stock'}>{p.available?'Dostępny':'Niedostępny'}</small>}</span><strong className="rpm-search-price">{p.price.toLocaleString('pl-PL',{style:'currency',currency:'PLN'})}</strong></div>)}</div>{pending&&<p role="status">Szukam…</p>}{failed&&<p role="status">Nie udało się pobrać podpowiedzi FMIC. Spróbuj wyszukać ponownie.</p>}{!pending&&!failed&&!results.length&&<p role="status">Brak pasujących produktów</p>}<button type="button" className="rpm-search-all" onMouseDown={e=>e.preventDefault()} onClick={()=>{setOpen(false);setActive(-1);onSearchSubmit()}}>Zobacz wszystkie wyniki</button></div>}
 </form>
 <div className="header-actions rpm-header-actions"><a href="/autopomoc" title={lang==='en'?'Road assistance and towing':'Pomoc drogowa i laweta'} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 10px',border:'1px solid rgba(249,115,22,.45)',borderRadius:8,color:'#fdba74',fontSize:12,fontWeight:800,textDecoration:'none',whiteSpace:'nowrap'}}><span aria-hidden="true">🚛</span>{lang==='en'?'Road Assistance':'Pomoc drogowa'}</a><a href="/designery" title={lang==='en'?'CAD Designers':'Kreatory CAD'} style={{display:'inline-flex',alignItems:'center',padding:'8px 10px',border:'1px solid rgba(249,115,22,.45)',borderRadius:8,color:'#fdba74',fontSize:12,fontWeight:800,textDecoration:'none',whiteSpace:'nowrap'}}>{lang==='en'?'CAD Designers':'Kreatory CAD'}</a><div className="language-switch" role="group" aria-label="Language / Język"><button type="button" className={lang==='pl'?'active':''} aria-label="Polski" aria-pressed={lang==='pl'} onClick={()=>onLanguageChange('pl')}>🇵🇱<span>PL</span></button><button type="button" className={lang==='en'?'active':''} aria-label="English" aria-pressed={lang==='en'} onClick={()=>onLanguageChange('en')}>🇬🇧<span>EN</span></button></div><a className="rpm-header-account" href="/account" title="Moje konto"><UserRound size={20}/><span>{lang==='en'?'Account':'Moje konto'}</span></a><button className="rpm-header-garage" title="RPM Garage" onClick={onGarage}><Warehouse size={20}/><span>RPM Garage</span></button><button className="cart-btn" title="Koszyk" onClick={onCart}><ShoppingCart size={22}/><span>{lang==='en'?'Cart':'Koszyk'}</span>{count>0&&<i>{count}</i>}</button></div>
 </div>
 <CategoryNavigation
 mobileMenu={mobileMenu} setMobileMenu={setMobileMenu}
 activeFmicRoot={activeFmicRoot} setActiveFmicRoot={setActiveFmicRoot}
 activeFmicSub={activeFmicSub} setActiveFmicSub={setActiveFmicSub}
 onOpenCatalogPath={onOpenCatalogPath} onMotoLab={onMotoLab}
 />
 </header>
 );
}
