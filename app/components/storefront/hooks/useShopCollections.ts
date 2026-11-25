'use client';
import {useEffect,useState,type Dispatch,type SetStateAction} from 'react';
import {isRetiredDemoProductId,type CartLine,type Product} from '../../../data';
import {storefrontLocation} from '../../../lib/storefront-navigation';
import type {View} from '../../../lib/storefront-config';
import {CART_EVENT,quoteFmicCart,mergeFmicQuotes} from '../../../lib/fmic-cart';
import {collectionTotal,changeLineQuantity,removeCollectionLine,appendCollectionLine} from '../../../lib/shop-collections';
const removeRetired=(lines:CartLine[])=>lines.filter(l=>l&& (l.fmicSku||!isRetiredDemoProductId(l.productId)));
export function useShopCollections(products:Product[],view:View,setView:Dispatch<SetStateAction<View>>){
 const [cart,setCart]=useState<CartLine[]>([]),[garage,setGarage]=useState<CartLine[]>([]);
 const [storageReady,setStorageReady]=useState(false);
 useEffect(()=>{try{const c=localStorage.getItem('rpm-cart');const g=localStorage.getItem('rpm-garage');if(c){const parsed=JSON.parse(c);if(Array.isArray(parsed))setCart(removeRetired(parsed))}if(g){const parsed=JSON.parse(g);if(Array.isArray(parsed))setGarage(removeRetired(parsed))}const savedView=sessionStorage.getItem('rpm-shop-view');if(!storefrontLocation(window.location.pathname,window.location.search).view&&savedView&&['home','catalog','product','cart','checkout','garage','guides'].includes(savedView))setView(savedView as View)}catch{}finally{setStorageReady(true)}},[]);
 useEffect(()=>{if(storageReady)localStorage.setItem('rpm-cart',JSON.stringify(cart))},[cart,storageReady]);
 useEffect(()=>{if(storageReady)localStorage.setItem('rpm-garage',JSON.stringify(garage))},[garage,storageReady]);
 useEffect(()=>{if(storageReady)sessionStorage.setItem('rpm-shop-view',view)},[view,storageReady]);
 useEffect(()=>{const sync=()=>{try{const lines=JSON.parse(localStorage.getItem('rpm-cart')??'[]');if(Array.isArray(lines))setCart(removeRetired(lines))}catch{}};window.addEventListener(CART_EVENT,sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener(CART_EVENT,sync);window.removeEventListener('storage',sync)}},[]);
 const skuKey=JSON.stringify(cart.flatMap(l=>l.fmicSku?[l.fmicSku]:[]));
 const [quoteState,setQuoteState]=useState<'idle'|'loading'|'ready'|'error'>('idle');
 useEffect(()=>{if(!storageReady||view!=='cart')return;const skus=JSON.parse(skuKey) as string[];if(!skus.length){setQuoteState('idle');return}const ctrl=new AbortController();setQuoteState('loading');quoteFmicCart(skus,ctrl.signal).then(quotes=>{if(!ctrl.signal.aborted){setCart(old=>mergeFmicQuotes(old,quotes));setQuoteState('ready')}}).catch(()=>{if(!ctrl.signal.aborted)setQuoteState('error')});return()=>ctrl.abort()},[storageReady,view,skuKey]);
 const linesTotal=(lines:CartLine[])=>collectionTotal(lines,products);
 const count=cart.reduce((s,l)=>s+l.qty,0);
 const changeQuantity=(key:string,delta:number)=>setCart(old=>changeLineQuantity(old,key,delta));
 const removeLine=(key:string)=>setCart(old=>removeCollectionLine(old,key));
 const addSavedLine=(target:'cart'|'garage',line:CartLine)=>(target==='cart'?setCart:setGarage)(old=>appendCollectionLine(old,line));
 return {quoteState,cart,setCart,garage,setGarage,storageReady,linesTotal,count,changeQuantity,removeLine,addSavedLine};
}
