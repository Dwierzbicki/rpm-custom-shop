'use client';
import {useEffect,useState} from 'react';
import {POWER_ENGINES} from '../../../lib/storefront-config';
import {emptyKnowledge,validKnowledgeInput,type KnowledgeKind,type KnowledgeInput,type KnowledgeRecord,type EngineEntry,type TechnicalEntry} from '../../../lib/motolab-knowledge';
const statuses={draft:'Szkic',approved:'Zatwierdzony',rejected:'Odrzucony'};
export default function KnowledgeEditor({kind}:{kind:KnowledgeKind}){
 const [rows,setRows]=useState<KnowledgeRecord[]>([]),[draft,setDraft]=useState<KnowledgeInput|null>(null),[saved,setSaved]=useState<KnowledgeRecord|null>(null);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[note,setNote]=useState(''),[filter,setFilter]=useState('all'),[query,setQuery]=useState(''),[truncated,setTruncated]=useState(false),[dirty,setDirty]=useState(false);
 const load=async()=>{setLoading(true);setError('');try{const r=await fetch('/api/admin/motolab-knowledge?kind='+kind,{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);setRows(d.records);setTruncated(d.truncated)}catch(e){setError(e instanceof Error?e.message:'Błąd odczytu')}finally{setLoading(false)}};
 useEffect(()=>{void load()},[kind]);
 const patch=(p:Partial<KnowledgeInput>)=>{setDraft(d=>d?{...d,...p}:d);setDirty(true);setMessage('')};
 const entryPatch=(p:Partial<EngineEntry>|Partial<TechnicalEntry>)=>{if(draft)patch({entry:{...draft.entry,...p} as EngineEntry|TechnicalEntry})};
 const open=(r:KnowledgeRecord|null)=>{if(dirty&&!window.confirm('Porzucić niezapisane zmiany?'))return;setSaved(r);setDraft(r??emptyKnowledge(kind,crypto.randomUUID()));setDirty(!r);setNote('');setError('');setMessage('')};
 async function send(body:unknown){
  setBusy(true);setError('');setMessage('');
  try{const r=await fetch('/api/admin/motolab-knowledge',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error);const record=d.record as KnowledgeRecord;setRows(old=>[record,...old.filter(x=>x.id!==record.id)]);setSaved(record);setDraft(record);setDirty(false);setNote('');setMessage('Zapisano: '+statuses[record.status]);}catch(e){setError(e instanceof Error?e.message:'Błąd zapisu')}finally{setBusy(false)}
 }
 const visible=rows.filter(r=>(filter==='all'||r.status===filter)&&JSON.stringify(r.entry).toLowerCase().includes(query.trim().toLowerCase()));
 const e=draft?.entry;
 return <section className="rpm-settings-card"><h2>{kind==='engine'?'Edytor konfiguracji silników':'Kolejka danych technicznych SKU'}</h2><p>Rekordy są prywatne dla administratora. Zapis zawsze tworzy szkic; osobne zatwierdzenie potwierdza sprawdzenie źródła, nie kompatybilność ani limit wytrzymałości. Nie zmienia aktywnych reguł sklepu.</p>
 <div className="admin-toolbar"><button type="button" className="primary" disabled={busy||loading} onClick={()=>open(null)}>+ {kind==='engine'?'Dodaj konfigurację':'Dodaj parametr'}</button><button type="button" className="outline" disabled={busy||loading} onClick={()=>void load()}>Odśwież listę</button></div>
 <div className="rpm-settings-grid"><label className="rpm-settings-field">Status<select value={filter} onChange={ev=>setFilter(ev.target.value)}><option value="all">Wszystkie</option>{Object.entries(statuses).map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label><label className="rpm-settings-field">Szukaj<input value={query} onChange={ev=>setQuery(ev.target.value)}/></label></div>
 {loading?<p>Ładowanie…</p>:<><p>{visible.length} / {rows.length} rekordów{truncated?' · pokazano ostatnich 200':''}</p>{visible.map(r=><div key={r.id} className="admin-toolbar"><button type="button" className="outline" disabled={busy} onClick={()=>open(r)}>{r.entry.kind==='engine'?r.entry.version.toUpperCase()+' / '+r.entry.variant+' / '+r.entry.configuration:r.entry.sku+' / '+r.entry.parameter} · {statuses[r.status]}</button></div>)}</>}
 {draft&&e&&<fieldset disabled={busy} className="rpm-settings-card"><h3>{saved?statuses[saved.status]:'Nowy szkic'}{dirty?' · niezapisane zmiany':''}</h3>
 {e.kind==='engine'?<div className="rpm-settings-grid">
 <label className="rpm-settings-field">Silnik bazowy<select value={e.version} onChange={ev=>entryPatch({version:ev.target.value})}>{POWER_ENGINES.flatMap(g=>g.versions.map(v=><option key={v.id} value={v.id}>{v.name}</option>))}</select></label>
 {([['variant','Wersja (NV / TU / VVT-i)'],['configuration','Konfiguracja (OEM / hybryda / kuta / stroker)'],['block','Blok / kod'],['crank','Wał'],['rods','Korbowody'],['pistons','Tłoki'],['head','Głowica'],['fuel','Paliwo']] as const).map(([key,label])=><label key={key} className="rpm-settings-field">{label}<input maxLength={key==='variant'?100:key==='configuration'?120:200} value={e[key]} onChange={ev=>entryPatch({[key]:ev.target.value})}/></label>)}
 {([['boreMm','Średnica cylindra (mm)'],['strokeMm','Skok (mm)'],['rodLengthMm','Długość korbowodu (mm)'],['compressionRatio','CR'],['targetPowerPs','Cel projektowy (KM)'],['targetTorqueNm','Cel projektowy (Nm)']] as const).map(([key,label])=><label key={key} className="rpm-settings-field">{label}<input type="number" step="any" value={e[key]??''} onChange={ev=>entryPatch({[key]:ev.target.value===''?null:Number(ev.target.value)})}/></label>)}
 <p>Nieznane liczby zostaw puste. Cele mocy i momentu nie są limitami wytrzymałości.</p>
 </div>:<div className="rpm-settings-grid">
 <label className="rpm-settings-field">Katalog<select value={e.catalogSource} onChange={ev=>entryPatch({catalogSource:ev.target.value as TechnicalEntry['catalogSource']})}><option value="fmic">FMIC</option><option value="manual">RPM Custom</option></select></label>
 {([['sku','Dokładne SKU',120],['parameter','Klucz parametru (np. rod_length)',80],['value','Wartość',500],['unit','Jednostka',40],['conditions','Warunki pomiaru / wariant',500]] as const).map(([key,label,max])=><label key={key} className="rpm-settings-field">{label}<input value={e[key]} maxLength={max} onChange={ev=>entryPatch({[key]:ev.target.value})}/></label>)}
 {saved?.identity&&<p>SKU przy ostatnim zapisie: <strong>{saved.identity.name}</strong> · {saved.identity.sku} · {saved.identity.brand}</p>}
 </div>}
 <label className="rpm-settings-field">Uwagi<textarea maxLength={2000} value={e.notes} onChange={ev=>entryPatch({notes:ev.target.value})}/></label>
 <h3>Źródło i dowód</h3><div className="rpm-settings-grid">
 <label className="rpm-settings-field">Rodzaj źródła<select value={draft.sourceKind} onChange={ev=>patch({sourceKind:ev.target.value as KnowledgeInput['sourceKind']})}><option value="workshop">Pomiar / doświadczenie warsztatowe</option><option value="manufacturer">Producent / OEM</option><option value="supplier">Dostawca</option><option value="other">Inne</option></select></label>
 <label className="rpm-settings-field">Adres dokumentacji (HTTPS)<input type="url" maxLength={2048} value={draft.sourceUrl} onChange={ev=>patch({sourceUrl:ev.target.value})}/></label>
 <label className="rpm-settings-field">Strona / tabela / identyfikator pomiaru<input maxLength={500} value={draft.sourceLocator} onChange={ev=>patch({sourceLocator:ev.target.value})}/></label>
 <label className="rpm-settings-field">Krótki dowód / własne podsumowanie<textarea maxLength={500} value={draft.excerpt} onChange={ev=>patch({excerpt:ev.target.value})}/></label></div>
 <button type="button" className="primary" disabled={!dirty||!validKnowledgeInput(draft)} onClick={()=>void send({action:'save',record:draft})}>Zapisz szkic</button>
 {saved&&<p>Rewizja {saved.revision} · {saved.updatedAt.slice(0,10)}{saved.reviewNote?' · '+saved.reviewNote:''}</p>}
 {saved?.status==='draft'&&!dirty&&<div><label className="rpm-settings-field">Uzasadnienie weryfikacji<textarea maxLength={500} value={note} onChange={ev=>setNote(ev.target.value)}/></label><div className="admin-toolbar"><button type="button" className="primary" disabled={!note.trim()} onClick={()=>void send({action:'review',kind,id:saved.id,revision:saved.revision,decision:'approved',note})}>Zatwierdź dane</button><button type="button" className="outline" disabled={!note.trim()} onClick={()=>void send({action:'review',kind,id:saved.id,revision:saved.revision,decision:'rejected',note})}>Odrzuć</button></div></div>}
 </fieldset>}{error&&<p role="alert" className="rpm-settings-error">{error}</p>}{message&&<p role="status" className="rpm-settings-success">{message}</p>}
 </section>;
}
