'use client';
import {useEffect,useLayoutEffect,useState} from 'react';
import type {View} from '../../../lib/storefront-config';
// Measure intrinsic label widths, not the expanded desktop hit areas.
export function requiresCompactCategories(nav:HTMLElement){
 if(window.matchMedia('(max-width:1000px), (hover:none), (pointer:coarse)').matches)return true;
 const required=Array.from(nav.children).reduce((sum,child)=>{
  const button=child.querySelector<HTMLElement>('.rpm-desktop-root-button');
  const label=button?.querySelector<HTMLElement>('.rpm-nav-category-label');
  if(!button||!label)return sum+(child as HTMLElement).offsetWidth;
  const style=getComputedStyle(button);
  const px=(value:string)=>parseFloat(value)||0;
  return sum+Math.ceil(Math.max(px(style.minWidth),label.getBoundingClientRect().width+px(style.paddingLeft)+px(style.paddingRight)+px(style.borderLeftWidth)+px(style.borderRightWidth)));
 },0);
 return required>document.documentElement.clientWidth-24;
}
export function useStorefrontMenu(view:View){
 const [mobileMenu,setMobileMenu]=useState(false);
 const [activeFmicRoot,setActiveFmicRoot]=useState<number|null>(null);
 const [compactCategories,setCompactCategories]=useState<boolean|null>(null);
 useLayoutEffect(()=>{
  let frame=0,disposed=false;
  const measureNow=()=>{
   if(disposed)return;
   const nav=document.querySelector<HTMLElement>('.rpm-desktop-categories');
   if(nav)setCompactCategories(requiresCompactCategories(nav));
  };
  const measure=()=>{if(!disposed){cancelAnimationFrame(frame);frame=requestAnimationFrame(measureNow)}};
  measureNow();
  window.addEventListener('resize',measure);
  document.fonts?.ready.then(measure);
  return()=>{disposed=true;cancelAnimationFrame(frame);window.removeEventListener('resize',measure)};
 },[view]);
 useEffect(()=>{setMobileMenu(false);setActiveFmicRoot(null);setActiveFmicSub(null)},[compactCategories]);
 const [fmicMenuOpen,setFmicMenuOpen]=useState(false);
 const [activeFmicSub,setActiveFmicSub]=useState<number|null>(null);

 return {mobileMenu,setMobileMenu,activeFmicRoot,setActiveFmicRoot,activeFmicSub,setActiveFmicSub,compactCategories,fmicMenuOpen,setFmicMenuOpen};
}
