'use client';
import {useEffect,useState} from 'react';
import type {ProcurementPlan} from '../../lib/procurement-plan';
import {groupSupplierPurchases} from '../../lib/procurement-export';

type ProcurementRecord={
 id:string;orderId:string;status:'draft'|'approved'|'placed_manually';
 fingerprint:string;manualReference:string|null;createdAt:string;updatedAt:string;
 approvedAt:string|null;placedAt:string|null;plan:ProcurementPlan;
};
type ResponseState={plan:ProcurementPlan;procurement:ProcurementRecord|null};
const money=(n:number)=>new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(n);
const statuses={draft:'Szkic',approved:'Zatwierdzony wewnętrznie',placed_manually:'Zamówiono ręcznie'};

export default function ProcurementPanel({orderId,orderStatus}:{orderId:string;orderStatus:string}){
 const [state,setState]=useState<ResponseState|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [stock,setStock]=useState(false),[price,setPrice]=useState(false);
 const [variants,setVariants]=useState(false),[manualOnly,setManualOnly]=useState(false);
 const [manualPlaced,setManualPlaced]=useState(false),[reference,setReference]=useState('');
 const [reloadKey,setReloadKey]=useState(0);
 useEffect(()=>{
  let cancelled=false;
  setError('');setMessage('');setState(null);
  fetch('/api/admin/procurement?orderId='+encodeURIComponent(orderId),{cache:'no-store'})
   .then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error||'Nie można pobrać podglądu');return data as ResponseState})
   .then(data=>{if(!cancelled)setState(data)})
   .catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'Błąd podglądu zakupów')});
  return ()=>{cancelled=true};
 },[orderId,orderStatus,reloadKey]);
 const refresh=()=>{setStock(false);setPrice(false);setVariants(false);setManualOnly(false);setManualPlaced(false);setReloadKey(n=>n+1)};
 async function act(operation:'draft'|'approve'|'recheck'|'mark_placed'){
  if(busy||!state)return;
  const fingerprint=operation==='draft'?state.plan.fingerprint:state.procurement?.fingerprint;
  if(!fingerprint){setError('Brak aktualnej wersji szkicu');return}
  if(operation==='approve'&&!stock||operation==='approve'&&!price||operation==='approve'&&!variants||operation==='approve'&&!manualOnly){
   setError('Zaznacz wszystkie cztery potwierdzenia przed zatwierdzeniem');return;
  }
  if(operation==='mark_placed'&&(!manualPlaced||reference.trim().length<5)){
   setError('Potwierdź rzeczywiste ręczne zamówienie i podaj numery referencyjne');return;
  }
  const confirmation=operation==='approve'
   ?'Zatwierdzić wewnętrzny szkic zakupowy? NIC nie zostanie zamówione u dostawców.'
   :operation==='mark_placed'
   ?'Czy zamówienia zostały już rzeczywiście złożone RĘCZNIE u wszystkich wymienionych dostawców?'
   :operation==='recheck'
   ?'Otworzyć ponownie zatwierdzony szkic i wymagać powtórnego zatwierdzenia?'
   :'Zapisać szkic zakupowy dla tego zamówienia?';
  if(!window.confirm(confirmation))return;
  setBusy(true);setError('');setMessage('');
  try{
   const response=await fetch('/api/admin/procurement',{
    method:operation==='draft'?'POST':'PATCH',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     orderId,fingerprint,confirm:operation==='draft'?'SAVE_DRAFT':undefined,
     operation:operation==='draft'?undefined:operation,
     confirmations:{stock,price,variants,manualOnly,manualPlaced},
     reference,
    }),
   });
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'Nie udało się zapisać');
   setMessage(data.note||'Zapisano');
   setStock(false);setPrice(false);setVariants(false);setManualOnly(false);setManualPlaced(false);
   setReloadKey(n=>n+1);
  }catch(e){setError(e instanceof Error?e.message:'Błąd zakupu')}finally{setBusy(false)}
 }
 const plan=state?.plan,record=state?.procurement;
 const exportAllowed=!!record&&(record.status==='approved'||record.status==='placed_manually')
  &&(record.status==='placed_manually'||record.fingerprint===plan?.fingerprint);
 let purchaseGroups:ReturnType<typeof groupSupplierPurchases>=[];
 if(record&&record.status!=='draft'){
  try{purchaseGroups=groupSupplierPurchases(record.plan)}catch{/* Invalid historical plans are never exportable. */}
 }
 async function downloadSupplier(supplier:'fmic'|'mtuning'){
  if(!record||busy||!exportAllowed)return;
  setBusy(true);setError('');
  try{
   const params=new URLSearchParams({orderId,supplier,fingerprint:record.fingerprint});
   const response=await fetch('/api/admin/procurement/export?'+params.toString(),{cache:'no-store'});
   if(!response.ok){
    const error=await response.json();
    throw new Error(error.error||'Nie można pobrać CSV');
   }
   const blob=await response.blob();
   const objectUrl=URL.createObjectURL(blob);
   const anchor=document.createElement('a');
   anchor.href=objectUrl;anchor.download='rpm-zakup-'+orderId+'-'+supplier+'.csv';
   document.body.append(anchor);
   anchor.click();
   anchor.remove();
   window.setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
  }catch(e){setError(e instanceof Error?e.message:'Błąd eksportu zamówienia')}
  finally{setBusy(false)}
 }
 async function downloadB2BJob(supplier:'fmic'|'mtuning'){
  if(!record||record.status!=='approved'||!exportAllowed||busy)return;
  setBusy(true);setError('');
  try{
   const params=new URLSearchParams({orderId,supplier,fingerprint:record.fingerprint});
   const response=await fetch('/api/admin/procurement/b2b-job?'+params.toString(),{cache:'no-store'});
   if(!response.ok){const data=await response.json();throw new Error(data.error||'Nie można pobrać zadania DEMO')}
   const job=await response.json();
   if(job.mode!=='fixture-only'||job.manualApprovalRequired!==true)throw new Error('Nieprawidłowy tryb zadania');
   const blob=new Blob([JSON.stringify(job,null,2)],{type:'application/json'});
   const objectUrl=URL.createObjectURL(blob);
   const anchor=document.createElement('a');
   anchor.href=objectUrl;anchor.download='rpm-b2b-demo-'+orderId+'-'+supplier+'.json';
   document.body.append(anchor);anchor.click();anchor.remove();
   window.setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
  }catch(e){setError(e instanceof Error?e.message:'Błąd przygotowania zadania testowego')}
  finally{setBusy(false)}
 }
 return <section className="rpm-settings-card" style={{marginTop:20}}>
  <h3>Zaopatrzenie / FMIC i MTuning</h3>
  <p>Wewnętrzna propozycja zakupu pod zamówienie #{orderId}. Żadne działanie w tym panelu nie składa zamówień automatycznie.</p>
  <button type="button" className="outline" disabled={busy} onClick={refresh}>Odśwież oferty i ceny</button>
  {error&&<p className="admin-warning" role="alert" style={{marginTop:10}}>{error}</p>}
  {message&&<p role="status">{message}</p>}
  {!plan?<p className="muted">Pobieranie propozycji dostawców…</p>:<>
   <p>Status zamówienia: <strong>{orderStatus}</strong>{record&&<> · Szkic zakupowy: <strong>{statuses[record.status]}</strong></>}</p>
   <p>Pozycji: {plan.lines.length} · dopasowanych: {plan.counts.ready} · bez oferty: {plan.counts.blocked} · z opcjami wymagającymi kontroli: {plan.counts.needsVariantCheck}</p>
   <p>Szacowany łączny koszt produktów i przypisanej dostawy: <strong>{money(plan.totalEstimatedNet)} netto</strong>. Koszt nie jest potwierdzeniem ceny od dostawcy.</p>
   {plan.lines.map(line=><div className="rpm-admin-settings-hub-link" key={line.index} style={{marginBottom:9,flexWrap:'wrap'}}>
    <span style={{flex:'1 1 260px'}}>
     <strong>{line.qty} × {line.name}</strong>
     <small>Produkt RPM: {line.sku} · sprzedaż: {money(line.salesGrossTotal)} brutto</small>
     {line.blocked
      ?<small style={{color:'#ff98a5'}}>WYMAGA OBSŁUGI RĘCZNEJ: {line.blocked}</small>
      :<><small>{line.supplier?.toUpperCase()} · SKU dostawcy: {line.supplierSku} · termin: {line.leadDays} dni</small>
       <small>Zakup: {money(line.purchaseNet!)} netto/szt. + dostawa {money(line.shippingNet!)} netto/szt. · razem {money(line.estimatedNetTotal!)} netto</small></>}
     {line.requiresVariantCheck&&<small style={{color:'#ffcb82'}}>KONIECZNA KONTROLA WARIANTU: {Object.entries(line.options).map(([key,value])=>key+': '+value).join(' · ')}</small>}
    </span>
   </div>)}
   {record&&record.status!=='draft'&&<div className="rpm-settings-card" style={{margin:'18px 0',padding:16}}>
    <h4>Lista zakupów dla dostawców (CSV)</h4>
    <p>Każdy dostawca otrzymuje osobną listę SKU i ilości. Pliki nie zawierają danych osobowych klientów ani adresu dostawy — uzupełnij je ręcznie w B2B.</p>
    {record.status==='placed_manually'&&<p><small>Archiwalna wersja potwierdzonego planu z chwili oznaczenia zakupu jako złożony.</small></p>}
    {!exportAllowed&&<p role="alert" style={{color:'#ffcb82'}}>
     Cena, stan lub status zmieniły się od zatwierdzenia. Wróć do ponownej kontroli planu — eksport aktualnie zablokowany.
    </p>}
    {purchaseGroups.map(group=><div className="rpm-admin-settings-hub-link" key={group.supplier} style={{margin:'8px 0',flexWrap:'wrap'}}>
     <span>
      <strong>{group.supplier.toUpperCase()}</strong>
      <small>{group.lines.length} pozycji, {group.itemCount} szt. · szacunkowo {money(group.estimatedNetTotal)} netto</small>
     </span>
     <button type="button" className="outline" disabled={busy||!exportAllowed}
      onClick={()=>void downloadSupplier(group.supplier)}>Pobierz CSV {group.supplier.toUpperCase()}</button>
     {record.status==='approved'&&<button type="button" className="outline"
      disabled={busy||!exportAllowed} onClick={()=>void downloadB2BJob(group.supplier)}>
      Pobierz zadanie DEMO B2B
     </button>}
    </div>)}
    {!purchaseGroups.length&&<p role="alert">Zapisany plan nie ma kompletnych ofert do eksportu.</p>}
    <p><small>Plik jest listą pomocniczą, a nie dyspozycją zakupową. Potwierdź ceny, dostępność, warianty i wysyłkę przed zamówieniem. Zadanie DEMO B2B działa tylko w lokalnym symulatorze Playwright i nie ma połączenia z panelem dostawcy.</small></p>
   </div>}
   {plan.notes.map((note,i)=><p key={i} className="muted" style={{fontSize:12,marginBottom:5}}>{note}</p>)}
   {!plan.canDraft&&<p role="status" style={{color:'#ffcb82'}}>
    {!['confirmed','processing'].includes(plan.orderStatus)?'Najpierw ustaw status zamówienia na Potwierdzone lub W realizacji.':
     'Nie wszystkie pozycje mają dostępne, zatwierdzone oferty. Uzupełnij powiązania w panelu Dostawcy.'}
   </p>}
   {!record&&plan.canDraft&&<button type="button" className="primary" disabled={busy} onClick={()=>void act('draft')}>Zapisz szkic zakupu</button>}
   {record?.status==='draft'&&<div style={{marginTop:15}}>
    <p>Szkic zachowuje stan cen/ofert. Gdy dostawca zmieni cenę lub dostępność, zatwierdzenie zostanie zablokowane.</p>
    <button type="button" className="outline" disabled={busy||!plan.canDraft} onClick={()=>void act('draft')}>Aktualizuj szkic do bieżących ofert</button>
    <div style={{display:'grid',gap:10,margin:'16px 0'}}>
     <label><input type="checkbox" checked={stock} onChange={e=>setStock(e.target.checked)}/> Sprawdziłem u dostawcy dostępność wymaganej liczby sztuk.</label>
     <label><input type="checkbox" checked={price} onChange={e=>setPrice(e.target.checked)}/> Potwierdziłem aktualną cenę netto, koszty dostawy i warunki zakupu.</label>
     <label><input type="checkbox" checked={variants} onChange={e=>setVariants(e.target.checked)}/> Sprawdziłem warianty, flansze, konfiguracje i zgodność SKU wszystkich pozycji.</label>
     <label><input type="checkbox" checked={manualOnly} onChange={e=>setManualOnly(e.target.checked)}/> Rozumiem, że zatwierdzenie NIE wysyła zamówienia do dostawców.</label>
    </div>
    <button type="button" className="primary" disabled={busy||!plan.canDraft||!stock||!price||!variants||!manualOnly} onClick={()=>void act('approve')}>Zatwierdź wewnętrzny plan zakupu</button>
   </div>}
   {record?.status==='approved'&&<div style={{marginTop:15}}>
    <p>Plan zatwierdzony wewnętrznie. Następny krok: wykonaj zamówienie ręcznie w B2B dostawcy. Nie oznaczaj go jako złożone, dopóki nie uzyskasz potwierdzenia.</p>
    <label style={{display:'grid',gap:6,marginBottom:12}}>Numery zamówień / referencje od wszystkich dostawców
     <textarea rows={2} maxLength={300} value={reference} onChange={e=>setReference(e.target.value)} placeholder="np. FMIC: 12345; MTuning: 98765"/>
    </label>
    <label style={{display:'block',marginBottom:12}}>
     <input type="checkbox" checked={manualPlaced} onChange={e=>setManualPlaced(e.target.checked)}/> Potwierdzam, że zamówienie zostało naprawdę złożone ręcznie u wszystkich wskazanych dostawców.
    </label>
    <button type="button" className="primary" disabled={busy||!manualPlaced||reference.trim().length<5} onClick={()=>void act('mark_placed')}>Oznacz jako zamówione ręcznie</button>
    <button type="button" className="outline" disabled={busy} style={{marginLeft:9}} onClick={()=>void act('recheck')}>Ponownie zweryfikuj plan</button>
   </div>}
   {record?.status==='placed_manually'&&<p role="status">Zarejestrowano ręczne zamówienie u dostawców. Referencje: <strong>{record.manualReference}</strong>. Nie wykonano żadnego automatycznego zamówienia.</p>}
  </>}
 </section>;
}
