'use client';
import {useEffect,useRef,useState} from 'react';
import {useUnsavedChanges} from '../settings/power-guides/useUnsavedChanges';
import {reviewPresets} from '../../lib/variant-review-presets';
import {maxVariantBatch} from '../../lib/variant-batch';
type Item={id:string;fingerprint:string;skus:number;scope:'colors'|'hel'};
type Queue={scope:'colors'|'hel'|null;items:Item[];excluded?:{families:number;skus:number}};
const batches=(queue:Queue)=>{
 const groups=(['colors','hel'] as const).map(scope=>({scope,items:queue.items.filter(i=>(i.scope??queue.scope)===scope)}));
 return groups.flatMap(({scope,items})=>Array.from({length:Math.ceil(items.length/maxVariantBatch)},(_,i)=>({scope,items:items.slice(i*maxVariantBatch,(i+1)*maxVariantBatch)})));
};
export default function VariantPublishQueue({disabled,onRunning,onComplete}:{disabled:boolean;onRunning:(v:boolean)=>void;onComplete:()=>void}){
 const [preset,setPreset]=useState<string>('all-pending'),[preview,setPreview]=useState<Queue|null>(null),[loading,setLoading]=useState(false),[running,setRunning]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[done,setDone]=useState(0);
 const stop=useRef(false),lock=useRef(false);
 useUnsavedChanges(running);
 useEffect(()=>()=>{stop.current=true},[]);
 useEffect(()=>{if(!running)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[running]);
 async function inspect(){
  if(lock.current)return;lock.current=true;setLoading(true);onRunning(true);setError('');setMessage('');setPreview(null);setDone(0);
  try{const r=await fetch('/api/admin/variants/queue?'+new URLSearchParams({preset}),{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);setPreview(d)}catch(e){setError(e instanceof Error?e.message:'Błąd odczytu')}finally{lock.current=false;setLoading(false);onRunning(false)}
 }
 async function publish(){
  if(lock.current||!preview?.items.length)return;
  const snapshot=preview;
  if(!window.confirm('Opublikować '+snapshot.items.length+' rodzin z podglądu ('+snapshot.items.reduce((n,x)=>n+x.skus,0)+' SKU)? Partie po 100 są osobnymi transakcjami. Zatrzymanie nie cofa zakończonych partii.'))return;
  lock.current=true;stop.current=false;setRunning(true);onRunning(true);setDone(0);setError('');setMessage('');
  let completed=0;
  try{
   const jobs=batches(snapshot);
   for(let i=0;i<jobs.length&&!stop.current;i++){
    const {scope,items:batch}=jobs[i];
    const items=batch.map(({id,fingerprint})=>({id,fingerprint}));
    const r=await fetch('/api/admin/variants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'approve-batch',scope,items})});
    const d=await r.json();if(!r.ok||d.saved!==true||d.groups!==items.length)throw Error(d.error||'Nie potwierdzono zapisu partii.');
    completed+=items.length;setDone(completed);
    if(i+1<jobs.length&&!stop.current)await new Promise(resolve=>setTimeout(resolve,500));
   }
   setMessage(completed===snapshot.items.length?'Opublikowano wszystkie rodziny z podglądu.':'Zatrzymano kolejkę po zakończonej partii.');
  }catch(e){setError('Przerwano po '+completed+' potwierdzonych rodzinach. '+(e instanceof Error?e.message:'Błąd publikacji')+' Przed wznowieniem pobierz nowy podgląd.')}
  finally{lock.current=false;setRunning(false);onRunning(false);setPreview(null);onComplete()}
 }
 const count=preview?.items.length??0;
 return <section className="rpm-settings-card"><h2>Masowa publikacja wariantów</h2><p>Podgląd zapisuje dokładne identyfikatory i fingerprinty. Każda partia przechodzi istniejącą kontrolę bieżącego katalogu, konfliktów i indeksu. Pozostaw tę kartę otwartą; można zatrzymać kolejkę między partiami.</p><div className="rpm-variant-toolbar"><label>Zakres publikacji<select value={preset} disabled={disabled||running||loading} onChange={e=>{setPreset(e.target.value);setPreview(null);setMessage('');setError('');setDone(0)}}><option value="all-reviewed">Silikony + Wastegate + HEL (razem)</option><option value="all-pending">Wszystkie oczekujące rodziny (bez wyjątków do weryfikacji)</option>{reviewPresets.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label><button className="outline" disabled={disabled||running||loading} onClick={()=>void inspect()}>{loading?'Pobieranie…':'Sprawdź kolejkę'}</button></div>
 {preview&&<p role="status">{count.toLocaleString('pl-PL')} rodzin · {preview.items.reduce((n,x)=>n+x.skus,0).toLocaleString('pl-PL')} SKU · {batches(preview).length} partii</p>}
 {preset==='all-pending'&&<p className="admin-warning">Zakres obejmuje również pozostałe kategorie. Zweryfikowany wyjątek CLM jest automatycznie pomijany; nowe rodziny nadal wymagają sprawdzenia.</p>}
 {preview&&!!preview.excluded?.families&&<p role="status" className="admin-warning">Pominięto {preview.excluded.families} rodzin ({preview.excluded.skus} SKU) do indywidualnej weryfikacji — zestaw skrętu CLM BMW E8X/E9X.</p>}
 {preview&&!running&&<button className="primary" disabled={disabled||!count} onClick={()=>void publish()}>Zatwierdź wszystkie z podglądu ({count})</button>}
 {running&&<div><progress value={done} max={count}/><p role="status">Opublikowano {done} / {count} rodzin</p><button className="outline" onClick={()=>{stop.current=true;setMessage('Zatrzymanie po bieżącej partii…')}}>Zatrzymaj po bieżącej partii</button></div>}
 {message&&<p role="status" className="rpm-settings-success">{message}</p>}{error&&<p role="alert" className="rpm-settings-error">{error}</p>}</section>;
}
