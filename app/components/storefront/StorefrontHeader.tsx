'use client';
import {Search,ShoppingCart,UserRound,Warehouse} from 'lucide-react';
import type {CategoryNavigationProps} from './CategoryNavigation';
import CategoryNavigation from './CategoryNavigation';

type Props=CategoryNavigationProps&{
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
 compactCategories,lang,query,count,onQuery,onHome,onSearchSubmit,
 onLanguageChange,onGarage,onCart,mobileMenu,setMobileMenu,
 activeFmicRoot,setActiveFmicRoot,activeFmicSub,setActiveFmicSub,
 onOpenCatalogPath,onMotoLab
}:Props){
 return (
<header className={"header rpm-header-v2"+(compactCategories?" rpm-header-compact":" rpm-header-wide")}>
 <div className="rpm-header-main">
 <button className="logo rpm-header-logo" onClick={onHome} aria-label="RPM Custom — strona główna"><img src="/rpm-logo.png.png" alt="RPM Custom — Exhaust & Intake Solutions" className="brand-logo"/></button>
 <form className="rpm-header-search" role="search" onSubmit={e=>{e.preventDefault();onSearchSubmit()}}><label htmlFor="rpm-header-query" className="rpm-visually-hidden">{lang==='en'?'Search products':'Szukaj produktów'}</label><input id="rpm-header-query" value={query} onChange={e=>onQuery(e.target.value)} placeholder={lang==='en'?'Search turbochargers, manifolds, intercoolers…':'Szukaj produktów, np. kolektor, turbo, intercooler…'}/><button type="submit" aria-label={lang==='en'?'Search':'Szukaj'}><Search size={21}/></button></form>
 <div className="header-actions rpm-header-actions"><div className="language-switch" role="group" aria-label="Language / Język"><button type="button" className={lang==='pl'?'active':''} aria-label="Polski" aria-pressed={lang==='pl'} onClick={()=>onLanguageChange('pl')}>🇵🇱<span>PL</span></button><button type="button" className={lang==='en'?'active':''} aria-label="English" aria-pressed={lang==='en'} onClick={()=>onLanguageChange('en')}>🇬🇧<span>EN</span></button></div><a className="rpm-header-account" href="/account" title="Moje konto"><UserRound size={20}/><span>{lang==='en'?'Account':'Moje konto'}</span></a><button className="rpm-header-garage" title="RPM Garage" onClick={onGarage}><Warehouse size={20}/><span>RPM Garage</span></button><button className="cart-btn" title="Koszyk" onClick={onCart}><ShoppingCart size={22}/><span>{lang==='en'?'Cart':'Koszyk'}</span>{count>0&&<i>{count}</i>}</button></div>
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
