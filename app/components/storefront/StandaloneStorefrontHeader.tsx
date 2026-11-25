'use client';
import {useEffect,useRef,useState} from 'react';
import {isRetiredDemoProductId} from '../../data';
import {CART_EVENT} from '../../lib/fmic-cart';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
import StorefrontHeader from './StorefrontHeader';
import {categoryPath} from '../../category-routing';
import {requiresCompactCategories} from './hooks/useStorefrontMenu';

export default function StandaloneStorefrontHeader(){
 const {lang,changeLang}=useStorefrontLanguage();
 const root=useRef<HTMLDivElement>(null);
 const [compact,setCompact]=useState(true),[query,setQuery]=useState(''),[count,setCount]=useState(0);
 const [mobileMenu,setMobileMenu]=useState(false),[activeFmicRoot,setActiveFmicRoot]=useState<number|null>(null),[activeFmicSub,setActiveFmicSub]=useState<number|null>(null);
 useEffect(()=>{
  let frame=0;
  const measure=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const nav=root.current?.querySelector<HTMLElement>('.rpm-desktop-categories');if(nav)setCompact(requiresCompactCategories(nav))})};
  const sync=()=>{try{const cart=JSON.parse(localStorage.getItem('rpm-cart')??'[]');setCount(Array.isArray(cart)?cart.reduce((sum,line)=>sum+(line&&(line.fmicSku||!isRetiredDemoProductId(line.productId))?(Number(line.qty)||0):0),0):0)}catch{}};
  sync();measure();window.addEventListener('resize',measure);window.addEventListener('storage',sync);window.addEventListener(CART_EVENT,sync);document.fonts?.ready.then(measure);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',measure);window.removeEventListener('storage',sync);window.removeEventListener(CART_EVENT,sync)};
 },[]);
 useEffect(()=>{setMobileMenu(false);setActiveFmicRoot(null);setActiveFmicSub(null)},[compact]);
 const go=(path:string)=>window.location.assign(path);
 return <div ref={root} style={{display:'contents'}}><StorefrontHeader compactCategories={compact} lang={lang} query={query} count={count} fmicPreview={true}
 onQuery={setQuery} onClearSearch={()=>setQuery('')} onHome={()=>go('/')}
 onSearchSubmit={()=>go('/sklep'+(query.trim()?'?'+new URLSearchParams({q:query.trim()}):''))}
 onLanguageChange={changeLang}
 onGarage={()=>go('/garage')} onCart={()=>go('/koszyk')} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu}
 activeFmicRoot={activeFmicRoot} setActiveFmicRoot={setActiveFmicRoot} activeFmicSub={activeFmicSub} setActiveFmicSub={setActiveFmicSub}
 onOpenCatalogPath={names=>go(categoryPath(names))} onMotoLab={()=>go('/#rpm-motolab')}/></div>;
}
