'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Activity,RefreshCcw,ShieldCheck,Monitor,AlertTriangle,Clock3,ClipboardList,CheckCircle2,StopCircle} from 'lucide-react';

type Supplier='fmic'|'mtuning';
type Status='queued'|'offline_reported'|'cancelled';
type Task={
 id:string;orderId:string;supplier:Supplier;jobId:string;fingerprint:string;
 status:Status;createdAt:string;updatedAt:string;
};
type Event={
 id:string;taskId:string;jobId:string;event:'queued'|'requeued'|'cancelled'|'offline_reported';
 runId:string|null;items:number|null;trace?:Array<{action:string;result:string;elapsedMs:number}>;
 durationMs:number|null;createdAt:string;
};
type ResponseData={
 summary:{queued:number;offline_reported:number;cancelled:number;total:number};
 tasks:Task[];events:Event[];limit:number;asOf:string;mode:'offline-demo-only';liveVendorWorker:false;
};
const statusName:Record<Status,string>={
 queued:'Oczekuje na test',offline_reported:'Raport symulacji',cancelled:'Anulowano',
};
const eventName:Record<Event['event'],string>={
 queued:'Zadanie dodane',requeued:'Zadanie przywrócone',
 cancelled:'Zadanie anulowane',offline_reported:'Raport symulacji zarejestrowany',
};
const time=(value:string)=>new Date(value).toLocaleString('pl-PL',{
 year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',
});

export default function B2BMonitorPage(){
 const [data,setData]=useState<ResponseData|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [polling,setPolling]=useState(false);
 const [supplier,setSupplier]=useState<'all'|Supplier>('all');
 const [filter,setFilter]=useState<'all'|Status>('all');
 const [query,setQuery]=useState('');
 const [autoRefresh,setAutoRefresh]=useState(true);
 const refresh=useCallback(async(silent=false)=>{
  if(!silent)setPolling(true);
  try{
   const response=await fetch('/api/admin/b2b-monitor',{cache:'no-store'});
   const json=await response.json();
   if(!response.ok)throw new Error(json.error||'Nie udało się pobrać danych monitoringu');
   setData(json as ResponseData);
   setError('');
  }catch(e){setError(e instanceof Error?e.message:'Błąd monitoringu')}
  finally{setLoading(false);if(!silent)setPolling(false)}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 useEffect(()=>{
  if(!autoRefresh)return;
  const timer=window.setInterval(()=>{if(!document.hidden)void refresh(true)},10000);
  return ()=>window.clearInterval(timer);
 },[autoRefresh,refresh]);
 const tasks=useMemo(()=>data?.tasks.filter(task=>
  (supplier==='all'||task.supplier===supplier)&&
  (filter==='all'||task.status===filter)&&
  (!query.trim()||[task.orderId,task.jobId,task.supplier].some(field=>
   field.toLowerCase().includes(query.trim().toLowerCase())))
 )??[],[data,supplier,filter,query]);
 const eventsByTask=useMemo(()=>{
  const output=new Map<string,Event[]>();
  for(const event of data?.events??[]){
   output.set(event.taskId,[...(output.get(event.taskId)??[]),event]);
  }
  return output;
 },[data]);
 return <main className="admin-page" style={{maxWidth:1320}}>
  <div className="admin-top" style={{alignItems:'flex-start'}}>
   <div>
    <span className="eyebrow">RPM CUSTOM / B2B OPERATIONS</span>
    <h1><Monitor size={26} style={{verticalAlign:'middle',marginRight:10}}/>Automatyzacja B2B</h1>
    <p>Podgląd kolejki zadań FMIC i MTuning, przebiegów testowych i zdarzeń historycznych.</p>
   </div>
   <div className="admin-toolbar">
    <Link href="/admin/orders" className="outline">Zamówienia</Link>
    <button className="outline" type="button" disabled={polling}
     onClick={()=>void refresh()}><RefreshCcw size={16}/> {polling?'Odświeżanie…':'Odśwież'}</button>
   </div>
  </div>

  <div className="admin-warning" style={{marginBottom:18}}>
   <ShieldCheck size={22}/>
   <div><strong>Tryb bezpieczny: lokalna symulacja, bez wysyłania zamówień</strong>
    <p>Ten panel pokazuje zadania zapisane w PostgreSQL i raporty przekazane przez operatora.
     Nie jest to podgląd otwartej przeglądarki dostawcy ani prawdziwego robota.
     Żadne zadanie nie uruchamia zakupów i nie klika przycisku „Złóż zamówienie”.</p>
   </div>
  </div>

  {error&&<div role="alert" className="admin-warning"><AlertTriangle size={18}/><div>{error}</div></div>}
  <div className="admin-stats">
   <div><span>Wszystkie zadania</span><strong>{data?.summary.total??'—'}</strong></div>
   <div><span>Oczekują na symulację</span><strong>{data?.summary.queued??'—'}</strong></div>
   <div><span>Zgłoszone symulacje</span><strong>{data?.summary.offline_reported??'—'}</strong></div>
   <div><span>Anulowane</span><strong>{data?.summary.cancelled??'—'}</strong></div>
  </div>

  <section className="rpm-settings-card" style={{marginTop:20}}>
   <div style={{display:'flex',gap:12,justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}>
    <div>
     <h2 style={{marginBottom:4}}><Activity size={20} style={{verticalAlign:'middle',marginRight:8}}/>Kolejka zadań i historia</h2>
     <p className="muted" style={{fontSize:13,margin:0}}>
      {data?'Ostatnia aktualizacja: '+time(data.asOf):'Brak danych'} · Automatyczne odświeżanie co 10 sekund
     </p>
    </div>
    <label style={{display:'flex',gap:7,alignItems:'center'}}>
     <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)}/>
     Odświeżaj automatycznie
    </label>
   </div>
   <div style={{display:'flex',gap:10,flexWrap:'wrap',margin:'16px 0'}}>
    <label> Dostawca
     <select value={supplier} onChange={e=>setSupplier(e.target.value as typeof supplier)}>
      <option value="all">Wszyscy dostawcy</option><option value="fmic">FMIC</option>
      <option value="mtuning">MTuning</option>
     </select>
    </label>
    <label> Status
     <select value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}>
      <option value="all">Wszystkie</option><option value="queued">Oczekujące</option>
      <option value="offline_reported">Z raportem offline</option>
      <option value="cancelled">Anulowane</option>
     </select>
    </label>
    <label> Numer RPM / identyfikator zadania
     <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Szukaj po ID…" />
    </label>
   </div>
   {loading?<p role="status">Pobieranie danych automatyzacji…</p>:
    tasks.length===0?<p className="muted">Brak zadań spełniających kryteria. Dodaj zadanie DEMO w szczegółach zatwierdzonego zamówienia.</p>:
    <div style={{display:'grid',gap:12}}>
     {tasks.map(task=>{
      const recent=eventsByTask.get(task.id)??[];
      const report=recent.find(event=>event.event==='offline_reported');
      return <article key={task.id} className="rpm-admin-settings-hub-link" style={{
       display:'block',padding:16,borderRadius:12,
      }}>
       <div style={{display:'flex',gap:12,justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap'}}>
        <div>
         <strong style={{fontSize:17}}>{task.supplier.toUpperCase()} · Zamówienie RPM #{task.orderId}</strong>
         <div style={{fontSize:13,marginTop:5}}><strong>Status:</strong> {statusName[task.status]}</div>
         <div style={{fontSize:12,opacity:.8,overflowWrap:'anywhere'}}>Job ID: {task.jobId}</div>
         <small>Aktualizacja: {time(task.updatedAt)}</small>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
         {task.status==='queued'?<Clock3 size={19}/>:task.status==='offline_reported'?
          <CheckCircle2 size={19}/>:<StopCircle size={19}/>}
         <Link href="/admin/orders" className="outline">Otwórz zamówienia</Link>
        </div>
       </div>
       <details style={{marginTop:12}}>
        <summary style={{cursor:'pointer',fontWeight:600}}>
         <ClipboardList size={16} style={{verticalAlign:'middle',marginRight:7}}/>
         Historia i logi ({recent.length})
        </summary>
        <div style={{display:'grid',gap:10,marginTop:12,paddingLeft:10,borderLeft:'2px solid #717781'}}>
         {recent.map(event=><div key={event.id}>
          <strong style={{fontSize:13}}>{eventName[event.event]}</strong>
          <small style={{display:'block'}}>{time(event.createdAt)}
           {event.runId?' · Run '+event.runId:''}
           {event.durationMs!==null?' · '+event.durationMs+' ms':''}</small>
          {event.event==='offline_reported'&&<small>
           Liczba pozycji: {event.items??'—'} · Wynik deklarowany przez operatora, niezweryfikowany przez serwer
          </small>}
          {!!event.trace?.length&&<div style={{display:'grid',gap:5,marginTop:6}}>
           {event.trace.map((step,i)=><small key={i}>
            <strong>{i+1}. {step.action}</strong> · {step.result} · {step.elapsedMs} ms
           </small>)}
          </div>}
         </div>)}
         {recent.length===0&&<p className="muted">Brak zarejestrowanych zdarzeń.</p>}
        </div>
       </details>
       {report&&task.status==='offline_reported'&&<p style={{fontSize:12,marginTop:10}}>
        Ostatni raport: {time(report.createdAt)}. Nie oznacza złożenia zamówienia u dostawcy.
       </p>}
      </article>;
     })}
    </div>}
   <p className="muted" style={{fontSize:12,marginTop:14}}>
    Wyświetlamy maksymalnie {data?.limit??100} ostatnio aktualizowanych zadań i 10 ostatnich zdarzeń na zadanie.
    Podgląd nie zawiera haseł, adresów dostawy ani danych klientów.
   </p>
  </section>
 </main>;
}
