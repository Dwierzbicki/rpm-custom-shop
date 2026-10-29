'use client';
import {useEffect,useRef,useState} from 'react';
import {DEFAULT_HOMEPAGE_DRAFT,HOMEPAGE_DRAFT_KEY,HomepageDraft,readHomepageDraft} from '../../lib/homepage-editor';
const fields:{key:keyof HomepageDraft;label:string;kind?:'textarea'|'url'}[]=[
 {key:'heroTitle',label:'Hero — nagłówek',kind:'textarea'},
 {key:'heroSubtitle',label:'Hero — podtytuł'},
 {key:'heroDescription',label:'Hero — opis',kind:'textarea'},
 {key:'heroImage',label:'Hero — URL zdjęcia (https://)',kind:'url'},
 {key:'motolabTitle',label:'MotoLab — tytuł'},
 {key:'motolabDescription',label:'MotoLab — opis',kind:'textarea'},
 {key:'promoTitle',label:'Polecane produkty — nagłówek'}
];
export default function HomepageEditor(){
 const [draft,setDraft]=useState<HomepageDraft>(DEFAULT_HOMEPAGE_DRAFT);
 const [previewVersion,setPreviewVersion]=useState(0);
 const [selected,setSelected]=useState<keyof HomepageDraft|null>(null);
 const previewRef=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{
   if(event.origin!==window.location.origin||event.source!==previewRef.current?.contentWindow)return;
   if(event.data?.type!=='rpm-editor:select')return;
   const key=event.data.key;
   if(typeof key==='string'&&Object.prototype.hasOwnProperty.call(DEFAULT_HOMEPAGE_DRAFT,key)){
    setSelected(key as keyof HomepageDraft);
    document.getElementById('rpm-editor-field-'+key)?.scrollIntoView({behavior:'smooth',block:'nearest'});
   }
  };
  window.addEventListener('message',receive);
  return()=>window.removeEventListener('message',receive);
 },[]);
 useEffect(()=>{previewRef.current?.contentWindow?.postMessage({type:'rpm-editor:update',draft},window.location.origin)},[draft,previewVersion]);
 const [saved,setSaved]=useState(false);

 useEffect(()=>setDraft(readHomepageDraft()),[]);
 const update=(key:keyof HomepageDraft,value:string)=>{setDraft(old=>({...old,[key]:value}));setSaved(false)};
 const save=()=>{
  if(draft.heroImage&&!/^https:\/\//i.test(draft.heroImage)){alert('Adres zdjęcia musi zaczynać się od https://');return}
  localStorage.setItem(HOMEPAGE_DRAFT_KEY,JSON.stringify(draft));
  setSaved(true);setPreviewVersion(v=>v+1);
 };
 const reset=()=>{localStorage.removeItem(HOMEPAGE_DRAFT_KEY);setDraft(DEFAULT_HOMEPAGE_DRAFT);setSaved(false);setPreviewVersion(v=>v+1)};
 return <main className="rpm-editor">
 <header className="rpm-editor-top"><div><small>RPM CUSTOM / SETTINGS</small><h1>Edytor strony głównej <span>V1</span></h1><p>Wersja robocza: zmiany zapisują się tylko w tej przeglądarce. Nie są publikowane w sklepie.</p></div><a href="/">Powrót do sklepu ↗</a></header>
 <div className="rpm-editor-grid">
 <section className="rpm-editor-panel"><h2>Treści strony</h2><p>Kliknij tekst w podglądzie, aby wybrać jego pole. Zmiany zobaczysz od razu; zapis pozostaje lokalnym szkicem.</p>
 {fields.map(f=><label id={'rpm-editor-field-'+f.key} className={selected===f.key?'rpm-editor-field-selected':''} key={f.key}><span>{f.label}</span>{f.kind==='textarea'?<textarea rows={3} maxLength={1000} value={draft[f.key]} onChange={e=>update(f.key,e.target.value)}/>:<input maxLength={1000} type={f.kind==='url'?'url':'text'} value={draft[f.key]} onChange={e=>update(f.key,e.target.value)}/>}</label>)}
 <div className="rpm-editor-actions"><button type="button" onClick={save}>Zapisz podgląd</button><button type="button" className="secondary" onClick={reset}>Przywróć domyślne</button></div>{saved&&<p role="status">Zapisano lokalny szkic. Podgląd został odświeżony.</p>}
 </section>
 <section className="rpm-editor-preview"><div><strong>Podgląd HP</strong><span>Bez publikacji</span></div><iframe ref={previewRef} onLoad={()=>previewRef.current?.contentWindow?.postMessage({type:"rpm-editor:update",draft},window.location.origin)} key={previewVersion} title="Podgląd strony głównej" src="/?hpPreview=1"/></section>
 </div>
 </main>
}
