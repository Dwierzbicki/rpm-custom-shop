'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
type Order={id:string;customer:{name:string;email:string;language?:string}};
type Preview={to:string;subject:string;text:string;html:string};
export default function EmailsPage(){
 const [orders,setOrders]=useState<Order[]>([]);
 const [id,setId]=useState('');
 const [language,setLanguage]=useState<'pl'|'en'>('pl');
 const [preview,setPreview]=useState<Preview|null>(null);
 const [mode,setMode]=useState('mock');
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{
  fetch('/api/admin/orders',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Błąd pobierania zamówień');const list=Array.isArray(d.orders)?d.orders:[];setOrders(list);if(list.length){setId(list[0].id);setLanguage(list[0].customer?.language==='en'?'en':'pl')}}).catch(e=>setError(e instanceof Error?e.message:'Błąd pobierania'));
 },[]);
 useEffect(()=>{
  if(!id)return;
  let cancelled=false;
  setLoading(true);setError('');setPreview(null);
  fetch('/api/admin/emails?id='+encodeURIComponent(id)+'&language='+language,{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Błąd podglądu');if(!cancelled){setPreview(d.preview);setMode(d.mode)}}).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'Błąd podglądu')}).finally(()=>{if(!cancelled)setLoading(false)});
  return()=>{cancelled=true};
 },[id,language]);
 return <main className="admin-page rpm-settings-page">
  <div className="admin-top"><div><Link href="/admin/orders" className="admin-back">← Zamówienia</Link><span className="eyebrow">RPM CUSTOM / BACK OFFICE</span><h1>E-maile</h1><p>Podgląd potwierdzeń zamówień. Żadna wiadomość nie jest wysyłana.</p></div></div>
  <section className="rpm-settings-card"><h2>Podgląd wiadomości</h2>
   <div className="rpm-settings-grid">
    <label className="rpm-settings-field">Zamówienie<select value={id} onChange={e=>{const next=e.target.value;setId(next);const order=orders.find(o=>o.id===next);setLanguage(order?.customer.language==='en'?'en':'pl')}}>{orders.length===0&&<option value="">Brak zamówień</option>}{orders.map(o=><option key={o.id} value={o.id}>#{o.id} — {o.customer.name}</option>)}</select></label>
    <label className="rpm-settings-field">Język<select value={language} onChange={e=>setLanguage(e.target.value as 'pl'|'en')}><option value="pl">Polski</option><option value="en">Angielski</option></select></label>
   </div>
   <p className="muted">Tryb: <strong>{mode.toUpperCase()}</strong>. Podgląd nie uruchamia wysyłki. Dane przelewu pochodzą z aktualnych ustawień płatności.</p>
   {error&&<p role="alert" className="admin-warning">{error}</p>}
   {loading&&<p>Generowanie podglądu…</p>}
   {preview&&!loading&&<div style={{marginTop:20}}>
    <p><strong>Do:</strong> {preview.to}</p><p><strong>Temat:</strong> {preview.subject}</p>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',margin:'14px 0'}}>
     <button className="outline" type="button" onClick={()=>void navigator.clipboard.writeText(preview.text)}>Kopiuj treść</button>
     <button className="outline" type="button" onClick={()=>void navigator.clipboard.writeText(preview.html)}>Kopiuj HTML</button>
    </div>
    <div style={{border:'1px solid #ddd',borderRadius:12,padding:20,background:'#fff',color:'#222'}}>
     <h2 style={{color:'#111'}}>RPM CUSTOM</h2>
     <h3>{preview.subject}</h3>
     <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontFamily:'Arial,sans-serif',lineHeight:1.7}}>{preview.text}</pre>
    </div>
   </div>}
  </section>
 </main>;
}
