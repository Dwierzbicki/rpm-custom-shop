'use client';
import {useState} from 'react';
import {POWER_ENGINES} from '../../../lib/storefront-config';
import {RESEARCH_SOURCES,RESEARCH_TOPICS,RESEARCH_MAX_CHARS,parseResearchRows,researchPrompt,type ResearchDraft} from '../../../lib/motolab-research-center';
export default function ResearchCenter(){
 const [version,setVersion]=useState('m50b25'),[topic,setTopic]=useState('hybrid'),[sources,setSources]=useState<string[]>(['turbobmw','zgrywus','turbo-familia','public']);
 const [raw,setRaw]=useState(''),[preview,setPreview]=useState<ResearchDraft[]|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const prompt=researchPrompt(version,topic,sources);
 const name=POWER_ENGINES.flatMap(g=>g.versions.map(v=>({id:v.id,name:v.name}))).find(v=>v.id===version)?.name??version;
 const terms=RESEARCH_TOPICS.find(t=>t.id===topic)?.query??'';
 function validate(){setError('');setMessage('');try{setPreview(parseResearchRows(JSON.parse(raw)))}catch(e){setPreview(null);setError(e instanceof Error?e.message:'Niepoprawny JSON')}}
 async function save(){if(!preview)return;setBusy(true);setError('');setMessage('');try{const r=await fetch('/api/admin/motolab-research',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(preview)});const d=await r.json();if(!r.ok)throw Error(d.error);setMessage('Dodano '+d.added+' szkiców; pominięto '+d.skipped+' istniejących lub powtórzonych. Odśwież Engine Database.');setPreview(null)}catch(e){setError(e instanceof Error?e.message:'Błąd importu')}finally{setBusy(false)}}
 return <section className="rpm-settings-card"><span className="eyebrow">RPM CUSTOM / RESEARCH CENTER</span><h2>Community & Technical Research</h2><p>Przygotuj research w zewnętrznym narzędziu lub ręcznie. Bez aktywnego API AI, opłat za model ani automatycznego scrapowania.</p>
 <div className="rpm-settings-grid"><label className="rpm-settings-field">Silnik<select value={version} onChange={e=>setVersion(e.target.value)}>{POWER_ENGINES.flatMap(g=>g.versions.map(v=><option key={v.id} value={v.id}>{v.name}</option>))}</select></label><label className="rpm-settings-field">Zakres<select value={topic} onChange={e=>setTopic(e.target.value)}>{RESEARCH_TOPICS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label></div>
 <h3>Źródła</h3><div className="rpm-settings-grid">{RESEARCH_SOURCES.map(s=><div key={s.id}><label><input type="checkbox" checked={sources.includes(s.id)} onChange={e=>setSources(old=>e.target.checked?[...old,s.id]:old.filter(id=>id!==s.id))}/> {s.label}</label>{s.url&&<p><a href={s.url} target="_blank" rel="noopener noreferrer">Otwórz źródło</a></p>}{sources.includes(s.id)&&<p><a href={'https://www.google.com/search?'+new URLSearchParams({q:[s.query,name,terms].filter(Boolean).join(' ')})} target="_blank" rel="noopener noreferrer">Szukaj konfiguracji</a></p>}</div>)}</div>
 <p>Turbo Familia Crew: tylko publiczne posty lub materiały przekazane za zgodą autora. Nie zakładamy dostępu do zawartości Facebooka.</p>
 <label className="rpm-settings-field">Prompt do researchu<textarea readOnly rows={8} value={prompt}/></label>
 <button type="button" className="outline" disabled={!prompt} onClick={async()=>{try{await navigator.clipboard.writeText(prompt);setMessage('Skopiowano prompt.')}catch{setError('Skopiuj tekst ręcznie.')}}}>Kopiuj prompt</button>
 <h3>Import wyników researchu</h3><p>Wklej tablicę JSON zgodną z promptem (1–25 rekordów). Nieznane liczby zostają puste; każdy rekord wymaga źródła. Import nie zatwierdza ani nie publikuje danych.</p>
 <label className="rpm-settings-field">JSON<textarea rows={10} maxLength={RESEARCH_MAX_CHARS} disabled={busy} value={raw} onChange={e=>{setRaw(e.target.value);setPreview(null);setMessage('');setError('')}}/></label>
 <button type="button" className="outline" disabled={busy||!raw.trim()} onClick={validate}>Sprawdź dane</button>
 {preview&&<><h3>Podgląd {preview.length} szkiców</h3><div className="rpm-power-admin-table-wrap"><table className="rpm-power-admin-table"><thead><tr><th>Konfiguracja</th><th>Źródło</th><th>Uwagi</th></tr></thead><tbody>{preview.map((r,i)=><tr key={i}><td>{r.entry.kind==='engine'?r.entry.version+' / '+r.entry.configuration:''}</td><td><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">{r.sourceLocator}</a></td><td>{r.excerpt}<p>{r.entry.notes}</p></td></tr>)}</tbody></table></div><button type="button" className="primary" disabled={busy} onClick={()=>void save()}>Importuj szkice do Engine Database</button></>}
 {error&&<p role="alert" className="rpm-settings-error">{error}</p>}{message&&<p role="status">{message}</p>}
 </section>;
}
