'use client';
import {useEffect,useState} from 'react';
import {en} from '../../../lib/translations';
export function useStorefrontLanguage(){
 const [lang,setLang]=useState<'pl'|'en'>('pl');
 const t=(value:string)=>lang==='en'?(en[value]??value):value;
 const changeLang=(next:'pl'|'en')=>{setLang(next);localStorage.setItem('rpm-language',next);document.documentElement.lang=next;};
 useEffect(()=>{const saved=localStorage.getItem('rpm-language');if(saved==='en'||saved==='pl'){setLang(saved);document.documentElement.lang=saved}},[]);

 return {lang,t,changeLang};
}
