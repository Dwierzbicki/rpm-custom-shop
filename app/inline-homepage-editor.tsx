'use client';
import {useEffect,useState} from 'react';
import {DEFAULT_HOMEPAGE_DRAFT,HOMEPAGE_DRAFT_KEY,HomepageDraft,readHomepageDraft} from './lib/homepage-editor';
const labels:Record<keyof HomepageDraft,string>={
 heroTitle:'Nagłówek Hero',heroSubtitle:'Podtytuł Hero',heroDescription:'Opis Hero',
 heroImage:'Zdjęcie Hero (URL HTTPS)',motolabTitle:'Tytuł MotoLab',
 motolabDescription:'Opis MotoLab',promoTitle:'Nagłówek polecanych produktów'
};
export default function InlineHomepageEditor({onChange}:{onChange:(draft:HomepageDraft)=>void}){
 const [enabled,setEnabled]=useState(false);
 const [checking,setChecking]=useState(true);
 const [draft,setDraft]=useState<HomepageDraft>(DEFAULT_HOMEPAGE_DRAFT);
 const [selected,setSelected]=useState<keyof HomepageDraft|null>(null);
 const [saved,setSaved]=useState(false);
 useEffect(()=>{
  let active=true;
  fetch('/api/admin/editor/access',{cache:'no-store',credentials:'same-origin'})
   .then(r=>{if(!r.ok)throw Error('Unauthorized');return r.json()})
   .then(()=>{if(!active)return;const loaded=readHomepageDraft();setDraft(loaded);onChange(loaded);setEnabled(true)})
   .catch(()=>{if(active)setEnabled(false)})
   .finally(()=>{if(active)setChecking(false)});
  return()=>{active=false};
 },[onChange]);
 useEffect(()=>{
  if(!enabled)return;
  const select=(event:MouseEvent)=>{
   const target=event.target as HTMLElement;
   if(target.closest('.rpm-inline-editor'))return;
   const node=target.closest<HTMLElement>('[data-rpm-edit]');
   if(!node)return;
   event.preventDefault();event.stopPropagation();
   const key=node.dataset.rpmEdit;
   if(key&&Object.prototype.hasOwnProperty.call(DEFAULT_HOMEPAGE_DRAFT,key))setSelected(key as keyof HomepageDraft);
  };
  document.addEventListener('click',select,true);
  return()=>document.removeEventListener('click',select,true);
 },[enabled]);
 const change=(key:keyof HomepageDraft,value:string)=>{
  const next={...draft,[key]:value};setDraft(next);onChange(next);setSaved(false);
 };
 const save=()=>{
  if(draft.heroImage&&!/^https:\/\//i.test(draft.heroImage)){alert('Adres zdjęcia musi zaczynać się od https://');return}
  localStorage.setItem(HOMEPAGE_DRAFT_KEY,JSON.stringify(draft));setSaved(true);
 };
 const reset=()=>{localStorage.removeItem(HOMEPAGE_DRAFT_KEY);setDraft(DEFAULT_HOMEPAGE_DRAFT);onChange(DEFAULT_HOMEPAGE_DRAFT);setSaved(false)};
 if(checking||!enabled)return null;
 return <div className="rpm-inline-editor" role="region" aria-label="Edytor administratora">
  <div className="rpm-inline-toolbar"><strong>✎ EDYTUJ HP</strong><span>Tryb administratora · szkic lokalny</span><button onClick={save}>Zapisz szkic</button><button className="rpm-inline-secondary" onClick={reset}>Reset</button><a href="/">Zakończ</a></div>
  {saved&&<div className="rpm-inline-saved" role="status">Szkic zapisany w tej przeglądarce — nieopublikowany</div>}
  {selected&&<aside className="rpm-inline-properties"><div className="rpm-inline-properties-head"><strong>{labels[selected]}</strong><button aria-label="Zamknij edycję" onClick={()=>setSelected(null)}>✕</button></div>
   {selected==='heroTitle'||selected==='heroDescription'||selected==='motolabDescription'?
    <textarea aria-label={labels[selected]} rows={5} maxLength={1000} value={draft[selected]} onChange={e=>change(selected,e.target.value)}/>:
    <input aria-label={labels[selected]} maxLength={1000} value={draft[selected]} onChange={e=>change(selected,e.target.value)}/>}
   <small>Zmiany są widoczne na stronie od razu. Kliknij kolejny tekst, aby go edytować.</small>
   <button onClick={save}>Zapisz szkic</button>
  </aside>}
 </div>;
}
