'use client';
import {useEffect,useState} from 'react';
type Catalog={stats:{total:number;available:number;mapped:number;updated_at:string|null};groups:{source_category:string;target_category:string[]|null;mapping_status:string;total:number}[];products:{sku:string;name:string;source_price:string;proposed_gross:string;available:boolean;mapping_status:string}[]};
export default function FmicPanel(){
 const [data,setData]=useState<Catalog|null>(null),[q,setQ]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(query=''){setBusy(true);setError('');try{const r=await fetch('/api/admin/suppliers/fmic?q='+encodeURIComponent(query),{cache:'no-store'});if(!r.ok)throw Error('Nie udało się pobrać katalogu FMIC');setData(await r.json())}catch(e){setError(String(e))}finally{setBusy(false)}}
 useEffect(()=>{void load()},[]);
 return <section className="rpm-settings-card"><h2>FMIC — katalog XML</h2><p>Ceny proponowane brutto: −5%, zaokrąglenie w górę do pełnego PLN. Katalog dostawcy nie jest jeszcze publikowany w sklepie.</p>
 {error&&<p role="alert">{error}</p>}
 {data&&<><div className="rpm-settings-grid"><div>Produkty: <strong>{data.stats.total.toLocaleString('pl-PL')}</strong></div><div>Dostępne: <strong>{data.stats.available.toLocaleString('pl-PL')}</strong></div><div>Dopasowane: <strong>{data.stats.mapped.toLocaleString('pl-PL')}</strong></div><div>Do weryfikacji: <strong>{(data.stats.total-data.stats.mapped).toLocaleString('pl-PL')}</strong></div></div><p>Ostatnia aktualizacja: {data.stats.updated_at?new Date(data.stats.updated_at).toLocaleString('pl-PL'):'Brak importu'}</p></>}
 <form onSubmit={e=>{e.preventDefault();void load(q)}}><label>SKU lub nazwa <input value={q} onChange={e=>setQ(e.target.value)} maxLength={120}/></label> <button className="primary" disabled={busy}>Szukaj / odśwież</button></form>
 {data&&<><h3>Produkty (maks. 50 wyników)</h3><div style={{overflowX:'auto'}}><table><thead><tr><th>SKU</th><th>Produkt</th><th>FMIC</th><th>RPM brutto</th><th>Dostępność</th></tr></thead><tbody>{data.products.map(p=><tr key={p.sku}><td>{p.sku}</td><td>{p.name}</td><td>{p.source_price} zł</td><td>{p.proposed_gross} zł</td><td>{p.available?'Dostępny':'Niedostępny'}</td></tr>)}</tbody></table></div>
 <h3>Mapowanie kategorii</h3>{data.groups.map((g,i)=><div key={i} className="rpm-admin-settings-hub-link"><span><strong>{g.source_category||'Brak kategorii'}</strong><small>{g.target_category?.join(' > ')||'Nieprzypisana'} · {g.mapping_status}</small></span><strong>{g.total}</strong></div>)}</>}
 </section>
}
