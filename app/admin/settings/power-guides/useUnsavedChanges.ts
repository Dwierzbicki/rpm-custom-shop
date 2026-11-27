'use client';
import {useEffect} from 'react';
const pending=new Set<symbol>();
export function hasUnsavedChanges(){return pending.size>0}
export function useUnsavedChanges(dirty:boolean){
 useEffect(()=>{if(!dirty)return;const token=Symbol();pending.add(token);const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',warn);return()=>{pending.delete(token);window.removeEventListener('beforeunload',warn)}},[dirty]);
}
