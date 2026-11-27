'use client';
import {useEffect,useState} from 'react';
import {useUnsavedChanges} from '../../settings/power-guides/useUnsavedChanges';
export default function FmicCatalogPriceEditor(){
 const [initial,setInitial]=useState<string|null>(null),[discount,setDiscount]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const dirty=initial!==null&&discount!==initial;const n=Number(discount),valid=discount.trim()!==''&&Number.isFinite(n)&&n>=0&&n<=99.99&&Math.abs(n*100-Math.round(n*100))<1e-7;
 useUnsavedChanges(dirty||busy);
 async function load(){setBusy(true);setInitial(null);setError('');try{const r=await fetch('/api/admin/suppliers/fmic?pricing=1',{cache:'no-store'}),d=await r.json();if(!r.ok||typeof d.discount!=='number')throw Error(d.error??'Błąd odczytu');setInitial(String(d.discount));setDiscount(String(d.discount))}catch(e){setError(String(e))}finally{setBusy(false)}}
 useEffect(()=>{void load()},[]);
 async function save(){if(!dirty||!valid||busy||!window.confirm('Przeliczyć wszystkie ceny katalogowe FMIC?'))return;setBusy(true);setError('');setMessage('');try{const r=await fetch('/api/admin/suppliers/fmic',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({discount:n})}),d=await r.json();if(!r.ok)throw Error(d.error);setInitial(String(d.discount));setDiscount(String(d.discount));setMessage('Przeliczono '+d.updated+' cen.')}catch(e){setError(String(e))}finally{setBusy(false)}}
 return <article><h3>Aktywne ceny katalogowe FMIC</h3><p>Obniżka od ceny źródłowej wpływa na katalog i wycenę koszyka. Nie jest potwierdzoną marżą.</p>{initial===null?<button className="outline" disabled={busy} onClick={()=>void load()}>{busy?'Ładowanie…':'Ponów odczyt'}</button>:<><label className="rpm-settings-field">Obniżka (%)<input type="number" min="0" max="99.99" step=".01" disabled={busy} value={discount} onChange={e=>setDiscount(e.target.value)}/></label><p>Przykład: 1000 zł → {valid?Math.ceil(1000*(100-n)/100-1e-9)+' zł':'—'}</p><div className="admin-toolbar"><button className="outline" disabled={!dirty||busy} onClick={()=>setDiscount(initial)}>Anuluj</button><button className="primary" disabled={!dirty||!valid||busy} onClick={()=>void save()}>Zapisz i przelicz ceny</button></div></>}{error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}</article>
}
