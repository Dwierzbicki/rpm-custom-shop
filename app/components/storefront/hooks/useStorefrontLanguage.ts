'use client';
import {useEffect,useState} from 'react';
import {en} from '../../../lib/translations';
export const LANGUAGE_EVENT='rpm-language-change';
export function useStorefrontLanguage(){
 const [lang,setLang]=useState<'pl'|'en'>('pl');
 const t=(value:string)=>lang==='en'?(en[value]??value):value;
 const changeLang=(next:'pl'|'en')=>{setLang(next);try{localStorage.setItem('rpm-language',next)}catch{}document.documentElement.lang=next;window.dispatchEvent(new Event(LANGUAGE_EVENT));};
 useEffect(()=>{const sync=()=>{try{const saved=localStorage.getItem('rpm-language');if(saved==='en'||saved==='pl'){setLang(saved);document.documentElement.lang=saved}}catch{}};sync();window.addEventListener(LANGUAGE_EVENT,sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener(LANGUAGE_EVENT,sync);window.removeEventListener('storage',sync)}},[]);
 return {lang,t,changeLang};
}
