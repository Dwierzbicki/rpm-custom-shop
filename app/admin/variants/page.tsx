'use client';
import {useEffect,useState,useRef} from 'react';
import {Layers,ScanSearch,Check,Undo2,X,ChevronDown,ExternalLink} from 'lucide-react';
import type {VariantScope,VariantFilter,VariantDecision,VariantFamily} from '../../lib/variant-rules';
import {productPath} from '../../lib/product-path';
import '../../styles/admin-quality-center.css';
import '../../styles/admin-variants.css';
type Summary={status:VariantFilter;groups:number;skus:number;reduction:number;scanned_at:string};
type Result={families:VariantFamily[];summary:Summary[];total:number;page:number};
const labels:Record<VariantFilter,string>={all:'Wszystkie',pending:'Do zatwierdzenia',approved:'Zatwierdzone',rejected:'Odrzucone',conflict:'Konflikty'};
const fmt=(n:number)=>n.toLocaleString('pl-PL');
const money=(n:number)=>Number(n).toLocaleString('pl-PL',{style:'currency',currency:'PLN'});
export default function Variants(){
 const [scope,setScope]=useState<VariantScope>('colors'),[filter,setFilter]=useState<VariantFilter>('all'),[q,setQ]=useState(''),[query,setQuery]=useState(''),[page,setPage]=useState(1),[revision,setRevision]=useState(0);
 const [data,setData]=useState<Result|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[actionError,setActionError]=useState(''),[expanded,setExpanded]=useState<string|null>(null);
 const lock=useRef(false);
 useEffect(()=>{const ctrl=new AbortController();setLoading(true);setError('');
 fetch('/api/admin/variants?'+new URLSearchParams({scope,filter,q:query,page:String(page)}),{cache:'no-store',signal:ctrl.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);if(!ctrl.signal.aborted)setData(d as Result)}).catch(e=>{if(!ctrl.signal.aborted){setError(String(e));setData(null)}}).finally(()=>{if(!ctrl.signal.aborted)setLoading(false)});
 return()=>ctrl.abort()},[scope,filter,query,page,revision]);
 async function action(body:Record<string,unknown>){
  if(lock.current)return;lock.current=true;setBusy(true);setActionError('');setNotice('');
  try{const r=await fetch('/api/admin/variants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error);
   setNotice(body.action==='scan'?'Zapisano aktualny skan: '+fmt(Number(d.groups))+' rodzin.':'Zapisano decyzję. Widoczne grupowanie zostanie odświeżone.');
  }catch(e){setNotice('');setActionError(String(e))}finally{lock.current=false;setBusy(false);setRevision(v=>v+1)}
 }
 function review(f:VariantFamily,decision:VariantDecision){if(decision==='approved'&&!window.confirm('Zatwierdzić dokładnie '+f.members.length+' SKU tej rodziny? Zatwierdzenie włączy grupowanie na sklepie, jeśli dane są zgodne.'))return;void action({action:'review',id:f.id,fingerprint:f.fingerprint,decision})}
 const summary=data?.summary??[],sum=(key:'groups'|'skus'|'reduction')=>summary.reduce((n,s)=>n+s[key],0);
 const latest=summary.map(s=>s.scanned_at).sort().at(-1);
 const disabled=busy||loading;
 return <main className="admin-page rpm-settings-page rpm-quality-center rpm-variants"><header className="admin-top rpm-quality-heading"><div><span className="eyebrow">RPM CUSTOM / ZAAWANSOWANE</span><h1><Layers size={28}/> RPM Variant Manager</h1><p>Rodziny produktowe i kontrola zgodności wariantów z feedem FMIC.</p></div></header>
 <section className="rpm-settings-card"><h2>Zakres wykrywania</h2><div className="rpm-variant-toolbar"><label>Reguła<select value={scope} disabled={disabled} onChange={e=>{setScope(e.target.value as VariantScope);setPage(1);setExpanded(null);setData(null);setNotice('')}}><option value="colors">Kolory w nazwach (bez HEL)</option><option value="hel">Przewody HEL – hamulce i sprzęgło</option></select></label><button className="primary" disabled={disabled} onClick={()=>void action({action:'scan',scope})}><ScanSearch size={18}/> {busy?'Przetwarzanie…':'Wykryj / odśwież rodziny'}</button></div>
 <p className="muted">Wykrywanie na żądanie oraz automatycznie po udanym imporcie XML. Nowe rodziny wymagają zatwierdzenia; zmiany składu oznaczamy jako konflikt. Ceny i dostępność poniżej pochodzą z ostatniej aktualizacji rodziny. Skan nie zmienia danych dostawcy.</p>{latest&&<small>Ostatnia zmiana danych rodzin: {new Date(latest).toLocaleString('pl-PL')}</small>}
 <div className="rpm-admin-supplier-kpis">{[['Rodziny',sum('groups')],['SKU w obecnych rodzinach',sum('skus')],['Potencjalnie mniej kart',sum('reduction')],['Zatwierdzone',summary.find(s=>s.status==='approved')?.groups??0],['Konflikty',summary.find(s=>s.status==='conflict')?.groups??0]].map(([label,value])=><div key={String(label)}><small>{label}</small><strong>{data?fmt(Number(value)):'—'}</strong></div>)}</div>
 {notice&&<p role="status" className="rpm-settings-success">{notice}</p>}{error&&<p role="alert" className="rpm-settings-error">{error}</p>}{actionError&&<p role="alert" className="rpm-settings-error">{actionError}</p>}
 </section><section className="rpm-settings-card"><div className="rpm-variant-toolbar"><form onSubmit={e=>{e.preventDefault();setQuery(q.trim());setPage(1);setExpanded(null)}}><label>Nazwa rodziny lub SKU<input maxLength={120} value={q} onChange={e=>setQ(e.target.value)}/></label><button className="outline" disabled={disabled}>Szukaj</button></form><label>Status<select value={filter} disabled={disabled} onChange={e=>{setFilter(e.target.value as VariantFilter);setPage(1);setExpanded(null)}}>{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></div>
 {loading?<p role="status">Ładowanie rodzin…</p>:!data?.families.length?<p>Brak rodzin w wybranym zakresie lub filtrze. Uruchom skan lub zmień filtry.</p>:data.families.map(f=><article className="rpm-variant-family" key={f.id}><button className="rpm-variant-family-head" aria-expanded={expanded===f.id} onClick={()=>setExpanded(v=>v===f.id?null:f.id)}><span><strong>{f.title}</strong><small>{f.category.join(' › ')} · {f.members.length} SKU · {labels[f.status]}</small></span><ChevronDown size={19}/></button>
 {expanded===f.id&&<div className="rpm-variant-family-body">{f.status==='conflict'&&<p className="admin-warning">{f.present?'Skład lub tożsamość rodziny zmieniły się od decyzji.':'Rodzina nie spełnia już reguły po ostatnim skanie.'} Poprzednio zatwierdzony lub odrzucony zestaw: {f.reviewed_members?.map(m=>m.sku).join(', ')??'—'}</p>}
 <div className="rpm-variant-members">{f.members.map(m=><div key={m.sku}><span><strong>{m.color}</strong><small>{m.name}</small><a href={productPath(m.name,m.sku)} target="_blank" rel="noopener noreferrer">{m.sku} <ExternalLink size={13}/></a></span><span><strong>{money(m.price)}</strong><small>{m.available?'Dostępny wg XML':'Niedostępny'}</small></span></div>)}</div><div className="rpm-admin-quick-actions"><button className="primary" disabled={disabled||!f.present||f.status==='approved'} onClick={()=>review(f,'approved')}><Check size={16}/> Zatwierdź grupę</button><button className="outline" disabled={disabled||!f.present||f.status==='rejected'} onClick={()=>review(f,'rejected')}><X size={16}/> Odrzuć</button><button className="outline" disabled={disabled||f.status==='pending'} onClick={()=>review(f,'pending')}><Undo2 size={16}/> Cofnij decyzję</button></div></div>}</article>)}
 <div className="rpm-variant-pagination"><button className="outline" disabled={disabled||(data?.page??1)<=1} onClick={()=>setPage((data?.page??1)-1)}>Poprzednia</button><span>{data?fmt(data.total)+' rodzin · strona '+data.page+' / '+Math.max(1,Math.ceil(data.total/20)):'—'}</span><button className="outline" disabled={disabled||!data||data.page*20>=data.total} onClick={()=>setPage((data?.page??1)+1)}>Następna</button></div></section></main>
}
