'use client';
import {useCallback,useEffect,useState} from 'react';
import {DEFAULT_HOMEPAGE_DRAFT,readHomepageDraft,type HomepageDraft} from '../../../lib/homepage-editor';
export function useHomepagePreview(){
 const [homepageDraft,setHomepageDraft]=useState<HomepageDraft>(DEFAULT_HOMEPAGE_DRAFT);
 const [inlineEditRequested,setInlineEditRequested]=useState(false);
 const updateHomepageDraft=useCallback((next:HomepageDraft)=>setHomepageDraft(next),[]);
 useEffect(()=>{setInlineEditRequested(new URLSearchParams(window.location.search).get('rpmEdit')==='1')},[]);
 useEffect(()=>{
 if(new URLSearchParams(window.location.search).get('hpPreview')!=='1')return;
 setHomepageDraft(readHomepageDraft());
 const receive=(event:MessageEvent)=>{
  if(event.origin!==window.location.origin||event.source!==window.parent)return;
  const data=event.data;
  if(data?.type!=='rpm-editor:update'||!data.draft||typeof data.draft!=='object')return;
  const next={...DEFAULT_HOMEPAGE_DRAFT};
  for(const key of Object.keys(next) as (keyof HomepageDraft)[]){
   if(typeof data.draft[key]==='string')next[key]=data.draft[key].slice(0,1000);
  }
  setHomepageDraft(next);
 };
 const select=(event:MouseEvent)=>{
  if(window.parent===window)return;
  const node=(event.target as HTMLElement).closest<HTMLElement>('[data-rpm-edit]');
  if(!node)return;
  event.preventDefault();event.stopPropagation();
  document.querySelectorAll('.rpm-edit-selected').forEach(el=>el.classList.remove('rpm-edit-selected'));
  node.classList.add('rpm-edit-selected');
  window.parent.postMessage({type:'rpm-editor:select',key:node.dataset.rpmEdit},window.location.origin);
 };
 window.addEventListener('message',receive);
 document.addEventListener('click',select,true);
 return()=>{window.removeEventListener('message',receive);document.removeEventListener('click',select,true)};
},[]);
 return {homepageDraft,inlineEditRequested,updateHomepageDraft};
}
