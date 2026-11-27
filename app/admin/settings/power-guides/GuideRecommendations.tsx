'use client';
import {useEffect,useState} from 'react';
import {powerRangesFor,POWER_ENGINES} from '../../../lib/storefront-config';
import type {Product} from '../../../data';
import {DEFAULT_GUIDE_SETTINGS,GUIDE_CATEGORIES,validGuideSettings,guidePrice,type GuidePart,type GuideSettings} from '../../../lib/power-guides';
import {useUnsavedChanges} from './useUnsavedChanges';
const engines=POWER_ENGINES.flatMap(g=>g.versions.map(v=>({id:v.id,name:v.name})));
const usages=['street','drift','track'] as const;
const tiers=['budget','recommended','premium'] as const;
const tierNames={budget:'Budżetowy',recommended:'Rekomendowany',premium:'Premium'};
const cash=(n:number|null)=>n===null?'Do wyceny':n.toLocaleString('pl-PL',{style:'currency',currency:'PLN'});
export default function GuideRecommendations(){
 const [data,setData]=useState<GuideSettings>(DEFAULT_GUIDE_SETTINGS),[loaded,setLoaded]=useState(false);
 const [catalog,setCatalog]=useState<Product[]>([]),[catalogError,setCatalogError]=useState(false);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const [engine,setEngine]=useState('m54b30'),[range,setRange]=useState(1),[usage,setUsage]=useState<GuidePart['usage']>('drift'),[tier,setTier]=useState<GuidePart['tier']>('recommended');
 const [draft,setDraft]=useState<GuidePart|null>(null),[discount,setDiscount]=useState<number|null>(null),[query,setQuery]=useState(''),[status,setStatus]=useState('all');
 const original=draft?data.parts.find(p=>p.id===draft.id):undefined;
 const dirty=(!!draft&&JSON.stringify(draft)!==JSON.stringify(original))||(discount!==null&&discount!==data.discountPercent);
 useUnsavedChanges(dirty);
 async function load(){
  setLoading(true);setLoaded(false);setError('');setSuccess('');
  try{const r=await fetch('/api/admin/power-guides',{cache:'no-store'});const v=await r.json();if(!r.ok||!validGuideSettings(v))throw Error(v.error||'Błąd odczytu');setData(v);setLoaded(true)}catch(e){setError(e instanceof Error?e.message:'Błąd odczytu')}finally{setLoading(false)}
 }
 useEffect(()=>{void load();fetch('/api/catalog',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(!Array.isArray(d.products))throw Error();setCatalog(d.products.filter((p:Product & {visible?:boolean})=>p.visible!==false))}).catch(()=>setCatalogError(true))},[]);
 const patch=(p:Partial<GuidePart>)=>{setDraft(d=>d?{...d,...p}:d);setSuccess('')};
 const open=(p:GuidePart)=>{setDraft({...p});setError('');setSuccess('')};
 function close(){if(saving||dirty&&!window.confirm('Porzucić niezapisane zmiany?'))return;setDraft(null);setDiscount(null);setError('');setSuccess('')}
 function add(){if(data.parts.length>=500)return;open({id:crypto.randomUUID(),engineVersion:engine,rangeIndex:range,usage,tier,category:'Turbosprężarka',name:'',reason:'',fmicPrice:null,manualPrice:null,fmicUrl:'',productId:null,enabled:false})}
 async function persist(next:GuideSettings){
  if(!loaded||saving||!validGuideSettings(next))return;
  setSaving(true);setError('');setSuccess('');
  try{const r=await fetch('/api/admin/power-guides',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({expected:data,settings:next})});const v=await r.json();if(!r.ok)throw Error(v.error||'Błąd zapisu');if(!validGuideSettings(v))throw Error('Niepoprawna odpowiedź zapisu. Odśwież dane.');setData(v);setDraft(null);setDiscount(null);setSuccess('Zapisano zmiany.')}catch(e){setError(e instanceof Error?e.message:'Błąd zapisu')}finally{setSaving(false)}
 }
 const next=draft?{...data,parts:original?data.parts.map(p=>p.id===draft.id?draft:p):[...data.parts,draft]}:null;
 const rows=data.parts.filter(p=>p.engineVersion===engine&&p.rangeIndex===range&&p.usage===usage&&p.tier===tier);
 const visible=rows.filter(p=>(status==='all'||(status==='published')===p.enabled)&&[p.name,p.category,catalog.find(x=>x.id===p.productId)?.sku??''].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 const band=powerRangesFor(engine)[range];
 return <section className="rpm-settings-card rpm-record-workspace rpm-guide-admin">
 {loading?<p>Ładowanie rekomendacji…</p>:!loaded?<div><h2>Rekomendacje</h2><button className="outline" type="button" onClick={()=>void load()}>Ponów odczyt</button></div>:draft?<fieldset disabled={saving} className="rpm-record-editor">
 <div className="rpm-power-section-heading"><button type="button" className="outline" onClick={close}>← Wróć do listy</button><span className="rpm-power-status">{dirty?'Niezapisane zmiany':draft.enabled?'Opublikowana':'Ukryta'}</span></div>
 <h2>{draft.name||'Nowa rekomendacja'}</h2><p>{engine.toUpperCase()} · {band?.min}–{band?.max} KM · {usage.toUpperCase()} · {tierNames[tier]}</p>
 <h3>Część</h3><div className="rpm-settings-grid">
 <label className="rpm-settings-field">Kategoria<select value={draft.category} onChange={e=>patch({category:e.target.value})}>{[...new Set([...GUIDE_CATEGORIES,draft.category])].map(c=><option key={c}>{c}</option>)}</select></label>
 <label className="rpm-settings-field">Model / nazwa<input maxLength={180} value={draft.name} onChange={e=>patch({name:e.target.value})}/></label>
 <label className="rpm-settings-field">Powiązany produkt RPM Custom<select value={draft.productId??''} onChange={e=>patch({productId:e.target.value?Number(e.target.value):null})}><option value="">Brak powiązania</option>{catalog.map(p=><option key={p.id} value={p.id}>{p.name} — {p.sku} ({cash(p.price)})</option>)}{draft.productId!==null&&!catalog.some(p=>p.id===draft.productId)&&<option value={draft.productId}>Produkt #{draft.productId} (niedostępny)</option>}</select></label>
 <label className="rpm-settings-field">Link FMIC<input type="url" maxLength={1000} value={draft.fmicUrl} placeholder="https://fmic.pl/..." onChange={e=>patch({fmicUrl:e.target.value})}/></label>
 </div>{catalogError&&<p role="alert">Nie udało się odczytać katalogu. Zapisane powiązania pozostają bez zmian.</p>}
 {catalog.filter(p=>p.id===draft.productId).map(p=><div key={p.id} className="rpm-guide-mini-product">{p.images?.[0]?<img src={p.images[0]} alt="" loading="lazy"/>:<span className="rpm-guide-mini-placeholder">RPM</span>}<div><b>{p.name}</b><small>{p.brand} · {p.sku}</small><strong>{cash(p.price)}</strong></div></div>)}
 <h3>Cena</h3><div className="rpm-settings-grid"><label className="rpm-settings-field">Cena FMIC (PLN)<input type="number" min="0" max="10000000" step=".01" value={draft.fmicPrice??''} onChange={e=>patch({fmicPrice:e.target.value===''?null:Number(e.target.value)})}/></label><label className="rpm-settings-field">Cena ręczna RPM (PLN)<input type="number" min="0" max="10000000" step=".01" placeholder={'Automatycznie −'+data.discountPercent+'%'} value={draft.manualPrice??''} onChange={e=>patch({manualPrice:e.target.value===''?null:Number(e.target.value)})}/></label><p>Cena RPM: <strong>{cash(guidePrice(draft,data.discountPercent))}</strong> · {draft.manualPrice!==null?'ręczna':'automatyczna'}</p></div>
 <label className="rpm-settings-field">Dlaczego polecamy?<textarea rows={4} maxLength={1000} value={draft.reason} onChange={e=>patch({reason:e.target.value})}/></label>
 <label><input type="checkbox" checked={draft.enabled} onChange={e=>patch({enabled:e.target.checked})}/> Publikuj rekomendację po zapisaniu</label>
 <div className="rpm-record-actions">{original&&<button type="button" className="outline rpm-record-delete" onClick={()=>{if(window.confirm('Trwale usunąć tę rekomendację? Niezapisane zmiany nie zostaną zachowane.'))void persist({...data,parts:data.parts.filter(p=>p.id!==draft.id)})}}>Usuń</button>}{dirty&&next&&!validGuideSettings(next)&&<small>Sprawdź nazwę, ceny i link FMIC.</small>}<button type="button" className="outline" onClick={close}>Anuluj</button><button type="button" className="primary" disabled={!dirty||!next||!validGuideSettings(next)} onClick={()=>next&&void persist(next)}>{saving?'Zapisywanie…':'Zapisz rekomendację'}</button></div>
 </fieldset>:discount!==null?<fieldset className="rpm-record-editor" disabled={saving}><div className="rpm-power-section-heading"><button type="button" className="outline" onClick={close}>← Wróć do listy</button><h2>Rabat domyślny</h2></div><label className="rpm-settings-field rpm-record-search">Rabat od FMIC (%)<input type="number" min="0" max="95" step=".1" value={Number.isNaN(discount)?'':discount} onChange={e=>setDiscount(e.target.value===''?NaN:Number(e.target.value))}/></label><p>Dotyczy wszystkich rekomendacji z ceną FMIC, które nie mają ręcznej ceny RPM.</p><div className="rpm-record-actions"><button type="button" className="outline" onClick={close}>Anuluj</button><button type="button" className="primary" disabled={!dirty||!validGuideSettings({...data,discountPercent:discount})} onClick={()=>{if(window.confirm('Zmienić rabat domyślny dla wszystkich rekomendacji?'))void persist({...data,discountPercent:discount})}}>Zapisz rabat</button></div></fieldset>:<>
 <div className="rpm-power-section-heading"><div><h2>Rekomendacje</h2><p>Ręczne zestawy części · {data.parts.length}/500 rekordów</p></div><button type="button" className="primary" disabled={data.parts.length>=500} onClick={add}>+ Dodaj część</button></div>
 <div className="rpm-settings-grid"><label className="rpm-settings-field">Silnik<select value={engine} onChange={e=>{setEngine(e.target.value);setRange(0)}}>{engines.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="rpm-settings-field">Moc<select value={range} onChange={e=>setRange(Number(e.target.value))}>{powerRangesFor(engine).map((x,i)=><option key={i} value={i}>{x.min}–{x.max} KM</option>)}</select></label><label className="rpm-settings-field">Przeznaczenie<select value={usage} onChange={e=>setUsage(e.target.value as GuidePart['usage'])}>{usages.map(x=><option key={x}>{x}</option>)}</select></label><label className="rpm-settings-field">Wariant<select value={tier} onChange={e=>setTier(e.target.value as GuidePart['tier'])}>{tiers.map(x=><option key={x} value={x}>{tierNames[x]}</option>)}</select></label></div>
 <div className="rpm-record-counts">{(['all','published','hidden'] as const).map(s=><button type="button" key={s} aria-pressed={status===s} className={status===s?'active':''} onClick={()=>setStatus(s)}>{s==='all'?'Wszystkie':s==='published'?'Opublikowane':'Ukryte'} <strong>{s==='all'?rows.length:rows.filter(p=>p.enabled===(s==='published')).length}</strong></button>)}<button type="button" className="outline" onClick={()=>void load()}>Odśwież</button></div>
 <label className="rpm-settings-field rpm-record-search">Szukaj<input placeholder="Nazwa, kategoria, SKU…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 <div className="rpm-power-admin-table-wrap"><table className="rpm-power-admin-table"><thead><tr><th>Część</th><th>Cena RPM</th><th>Status</th><th></th></tr></thead><tbody>{visible.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.category}</small></td><td>{cash(guidePrice(p,data.discountPercent))}</td><td><span className={'rpm-power-status '+(p.enabled?'approved':'draft')}>{p.enabled?'Opublikowana':'Ukryta'}</span></td><td><button type="button" className="outline" onClick={()=>open(p)}>Otwórz</button></td></tr>)}</tbody></table>{!visible.length&&<p className="rpm-record-empty">Brak części dla wybranych filtrów.</p>}</div>
 <details className="rpm-power-fold"><summary>Ustawienia cen</summary><div className="rpm-power-section-heading"><p>Domyślny rabat FMIC: <strong>{data.discountPercent}%</strong></p><button type="button" className="outline" onClick={()=>{setDiscount(data.discountPercent);setSuccess('');setError('')}}>Edytuj rabat</button></div></details>
 </>}
 {error&&<p role="alert" className="rpm-settings-error">{error}</p>}{success&&<p role="status" className="rpm-settings-success">{success}</p>}
 </section>;
}
