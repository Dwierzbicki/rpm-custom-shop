'use client';
import {useEffect,useState,type Dispatch,type SetStateAction} from 'react';
import type {CartLine,Product} from '../../../data';
import type {View} from '../../../lib/storefront-config';
import {collectionTotal,changeLineQuantity,removeCollectionLine,appendCollectionLine} from '../../../lib/shop-collections';
export function useShopCollections(products:Product[],view:View,setView:Dispatch<SetStateAction<View>>){
 const [cart,setCart]=useState<CartLine[]>([]),[garage,setGarage]=useState<CartLine[]>([]);
 const [storageReady,setStorageReady]=useState(false);
 useEffect(()=>{try{const c=localStorage.getItem('rpm-cart');const g=localStorage.getItem('rpm-garage');if(c){const parsed=JSON.parse(c);if(Array.isArray(parsed))setCart(parsed)}if(g){const parsed=JSON.parse(g);if(Array.isArray(parsed))setGarage(parsed)}const savedView=sessionStorage.getItem('rpm-shop-view');if(savedView&&['home','catalog','product','cart','checkout','garage','guides'].includes(savedView))setView(savedView as View)}catch{}finally{setStorageReady(true)}},[]);
 useEffect(()=>{if(storageReady)localStorage.setItem('rpm-cart',JSON.stringify(cart))},[cart,storageReady]);
 useEffect(()=>{if(storageReady)localStorage.setItem('rpm-garage',JSON.stringify(garage))},[garage,storageReady]);
 useEffect(()=>{if(storageReady)sessionStorage.setItem('rpm-shop-view',view)},[view,storageReady]);
 const linesTotal=(lines:CartLine[])=>collectionTotal(lines,products);
 const count=cart.reduce((s,l)=>s+l.qty,0);
 const changeQuantity=(key:string,delta:number)=>setCart(old=>changeLineQuantity(old,key,delta));
 const removeLine=(key:string)=>setCart(old=>removeCollectionLine(old,key));
 const addSavedLine=(target:'cart'|'garage',line:CartLine)=>(target==='cart'?setCart:setGarage)(old=>appendCollectionLine(old,line));
 return {cart,setCart,garage,setGarage,storageReady,linesTotal,count,changeQuantity,removeLine,addSavedLine};
}
