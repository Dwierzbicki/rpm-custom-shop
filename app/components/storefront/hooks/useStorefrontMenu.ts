'use client';
import {useEffect,useState} from 'react';
import type {View} from '../../../lib/storefront-config';
export function useStorefrontMenu(view:View){
 const [mobileMenu,setMobileMenu]=useState(false);
 const [activeFmicRoot,setActiveFmicRoot]=useState<number|null>(null);
 const [compactCategories,setCompactCategories]=useState(true);
 useEffect(()=>{
  let frame=0;
  const measure=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    const nav=document.querySelector<HTMLElement>('.rpm-desktop-categories');
    if(!nav)return;
    const required=Array.from(nav.children).reduce((sum,child)=>sum+(child as HTMLElement).offsetWidth,0);
    const available=document.documentElement.clientWidth-24;
    setCompactCategories(required>available);
   });
  };
  measure();
  window.addEventListener('resize',measure);
  document.fonts?.ready.then(measure);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',measure)};
 },[view]);
 useEffect(()=>{setMobileMenu(false);setActiveFmicRoot(null);setActiveFmicSub(null)},[compactCategories]);
 const [fmicMenuOpen,setFmicMenuOpen]=useState(false);
 const [activeFmicSub,setActiveFmicSub]=useState<number|null>(null);

 return {mobileMenu,setMobileMenu,activeFmicRoot,setActiveFmicRoot,activeFmicSub,setActiveFmicSub,compactCategories,fmicMenuOpen,setFmicMenuOpen};
}
