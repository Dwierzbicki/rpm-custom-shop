'use client';
import {useEffect,useState} from 'react';
type Row={sku:string;source_url:string;data:Record<string,unknown>;fetched_at?:string};
export default function FmicEnrichment(){
 const [sku,setSku]=useState('E4-FR02-TBS'),[rows,setRows]=useState<Row[]>([]),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const endpoint='/api/admin/suppliers/fmic/enrichment';
 async function load(){const r=await fetch(endpoint,{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);setEnabled(d.enabled);setRows(d.rows)}
 useEffect(()=>{void load().catch(e=>setError(String(e)))},[]);
 async function run(){setBusy(true);setError('');try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sku})});const d=await r.json();if(!r.ok)throw Error(d.error);await load()}catch(e){setError(String(e))}finally{setBusy(false)}}
 return <div role="tabpanel"><h2>Wzbogacanie produktów FMIC</h2><p className="fc-note">Pilotaż danych strukturalnych JSON-LD. Wyniki przypisujemy do dokładnego SKU, w oddzielnej tabeli. Nie zmieniamy cen, dostępności ani publicznej karty produktu.</p>
 {!enabled&&<p className="admin-warning">Pobieranie wyłączone do czasu potwierdzenia warunków FMIC.</p>}
 <form className="fc-toolbar" onSubmit={e=>{e.preventDefault();void run()}}><label>SKU produktu<input value={sku} onChange={e=>setSku(e.target.value)} maxLength={120}/></label><button className="primary" disabled={!enabled||busy||!sku.trim()}>{busy?'Pobieranie…':'Sprawdź pojedynczy produkt'}</button></form>{error&&<p role="alert">{error}</p>}
 <div className="fc-table-wrap"><table className="fc-table"><thead><tr><th>SKU / źródło</th><th>Producent</th><th>Odczytane dane</th></tr></thead><tbody>{rows.map(r=><tr key={r.sku}><td><strong>{r.sku}</strong><small><a href={r.source_url} target="_blank" rel="noreferrer">FMIC ↗</a></small><small>{r.fetched_at?new Date(r.fetched_at).toLocaleString('pl-PL'):''}</small></td><td>{String(r.data.brand||'—')}</td><td><details><summary>Zobacz wynik</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(r.data,null,2)}</pre></details></td></tr>)}{!rows.length&&<tr><td colSpan={3}>Brak zapisanych wyników pilotażu.</td></tr>}</tbody></table></div></div>
}
