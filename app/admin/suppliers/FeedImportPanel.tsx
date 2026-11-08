'use client';
import {useRef,useState} from 'react';

type Supplier='fmic'|'mtuning';
type Preview={
 canImport:boolean;
 fingerprint:string;
 counts:{create:number;update:number;unchanged:number};
 totalIssues:number;
 issues:{line:number;message:string}[];
 sample:{line:number;sku:string;name:string;purchaseNet:number;available:boolean;action:'create'|'update'|'unchanged';matchStatus:string}[];
 note:string;
};
type Props={onImported:()=>void|Promise<void>};

export default function FeedImportPanel({onImported}:Props){
 const [supplier,setSupplier]=useState<Supplier>('fmic');
 const [filename,setFilename]=useState('');
 const [csv,setCsv]=useState('');
 const [shippingNet,setShippingNet]=useState('');
 const [leadDays,setLeadDays]=useState('');
 const [confirmed,setConfirmed]=useState(false);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false);
 const busyRef=useRef(false);
 const [error,setError]=useState('');
 const [result,setResult]=useState('');
 const invalidate=()=>{setPreview(null);setError('');setResult('')};

 function payload(){
  if(!csv.trim())throw new Error('Wybierz plik CSV dostawcy.');
  if(shippingNet.trim()===''||leadDays.trim()==='')throw new Error('Podaj koszt dostawy netto na pozycję i termin realizacji.');
  const shipping=Number(shippingNet),lead=Number(leadDays);
  if(!Number.isFinite(shipping)||shipping<0||shipping>1_000_000||!Number.isInteger(lead)||lead<0||lead>365){
   throw new Error('Nieprawidłowy koszt dostawy lub termin realizacji.');
  }
  return {csv,options:{supplier,shippingNet:shipping,leadDays:lead,pricesNetPLNConfirmed:confirmed}};
 }

 async function request(method:'POST'|'PUT'){
  if(busyRef.current)return;
  busyRef.current=true;setBusy(true);setError('');setResult('');
  try{
   const body=payload();
   if(method==='PUT'&&(!preview?.canImport||!confirmed))throw new Error('Najpierw zatwierdź poprawny podgląd i ceny netto PLN.');
   if(method==='PUT'&&!window.confirm('Zaimportować oferty do bazy dostawców? To NIE zmieni cen ani dostępności produktów w sklepie.'))return;
   const response=await fetch('/api/admin/suppliers/feed',{
    method,headers:{'Content-Type':'application/json'},
    body:JSON.stringify(method==='PUT'?{...body,fingerprint:preview!.fingerprint,confirm:'IMPORT_SUPPLIER_OFFERS'}:body),
   });
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||'Błąd importu CSV');
   if(method==='POST'){setPreview(data as Preview);return}
   setPreview(null);
   setResult('Import #'+data.importId+': nowe '+data.create+', zaktualizowane '+data.update+', bez zmian '+data.unchanged+'. Ceny katalogowe bez zmian.');
   await onImported();
  }catch(e){setError(e instanceof Error?e.message:'Nieznany błąd');if(method==='PUT')setPreview(null)}
  finally{busyRef.current=false;setBusy(false)}
 }
 return <section className="rpm-settings-card">
  <h2>Import feedu CSV — FMIC / MTuning</h2>
  <p>Najpierw podgląd i kontrola błędów, potem ręczne zatwierdzenie. Plik aktualizuje tylko oferty dostawców — nie publikuje cen, nie tworzy produktów i nie składa zamówień.</p>
  <div className="rpm-settings-grid">
   <label>Dostawca
    <select value={supplier} disabled={busy} onChange={e=>{setSupplier(e.target.value as Supplier);invalidate()}}>
     <option value="fmic">FMIC</option><option value="mtuning">MTuning</option>
    </select>
   </label>
   <label>Plik CSV (maks. 5 MB)
    <input type="file" accept=".csv,text/csv" disabled={busy} onChange={async e=>{
     invalidate();const file=e.currentTarget.files?.[0];
     if(!file){setCsv('');setFilename('');return}
     if(file.size>5_000_000){setError('Plik przekracza 5 MB');setCsv('');return}
     try{setCsv(await file.text());setFilename(file.name)}catch{setError('Nie można odczytać pliku CSV');setCsv('')}
    }}/>
   </label>
   <label>Dostawa netto na pozycję (PLN)
    <input type="number" inputMode="decimal" step="0.01" min="0" max="1000000" value={shippingNet} onChange={e=>{setShippingNet(e.target.value);invalidate()}} disabled={busy} placeholder="Wpisz nawet 0, jeśli potwierdzone"/>
   </label>
   <label>Termin realizacji (dni)
    <input type="number" min="0" max="365" step="1" value={leadDays} onChange={e=>{setLeadDays(e.target.value);invalidate()}} disabled={busy} placeholder="Potwierdzony termin"/>
   </label>
  </div>
  <label style={{display:'flex',gap:10,alignItems:'start',margin:'16px 0'}}>
   <input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>{setConfirmed(e.target.checked);invalidate()}}/>
   <span>Potwierdzam, że ceny w pliku są <strong>netto w PLN</strong>, a stan magazynowy jest aktualny. Wartości dostawy i terminu pochodzą od dostawcy.</span>
  </label>
  <p><small>Wymagane kolumny: SKU, nazwa, cena netto, stan. Opcjonalne: marka, EAN, MPN, wariant. Separator: średnik, przecinek lub tabulator. Dopuszczalne maksymalnie 10 000 wierszy; wszystkie błędy i duplikaty blokują zapis.</small></p>
  {filename&&<p>Wybrany plik: <strong>{filename}</strong></p>}
  <button type="button" className="primary" disabled={busy||!csv.trim()} onClick={()=>void request('POST')}>{busy?'Przetwarzanie...':'Sprawdź podgląd CSV'}</button>
  {preview&&<div style={{marginTop:18}}>
   <h3>Podgląd importu</h3>
   <p>Nowe: <strong>{preview.counts.create}</strong> · Aktualizacje: <strong>{preview.counts.update}</strong> · Bez zmian: <strong>{preview.counts.unchanged}</strong> · Błędy: <strong>{preview.totalIssues}</strong></p>
   {preview.issues.length>0&&<div role="alert"><strong>Import zablokowany:</strong><ul>{preview.issues.map((e,i)=><li key={i}>Wiersz {e.line}: {e.message}</li>)}</ul>{preview.totalIssues>preview.issues.length&&<p>Pokazano pierwszych 50 błędów.</p>}</div>}
   <div style={{maxHeight:330,overflow:'auto',marginBottom:14}}>
    {preview.sample.map((row,i)=><div key={i} className="rpm-admin-settings-hub-link" style={{marginBottom:6,flexWrap:'wrap'}}>
     <span><strong>{row.sku} — {row.name}</strong><small>{row.purchaseNet.toFixed(2)} zł netto · {row.available?'Dostępny':'Brak stanu'} · {row.action==='create'?'Nowa oferta':row.action==='update'?'Aktualizacja':'Bez zmian'} · {row.matchStatus}</small></span>
    </div>)}
   </div>
   <p><small>{preview.note}</small></p>
   <button type="button" className="primary" disabled={busy||!preview.canImport} onClick={()=>void request('PUT')}>Zatwierdź i importuj oferty</button>
  </div>}
  {error&&<p role="alert" style={{color:'#ff899b',marginTop:12}}>{error}</p>}
  {result&&<p role="status" style={{marginTop:12}}>{result}</p>}
 </section>;
}
