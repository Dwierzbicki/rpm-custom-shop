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
type CartReview={id:string;taskId:string;orderId:string;supplier:'fmic';
 jobId:string;runId:string;verdict:'verified'|'needs_review';items:number;
 cartAddRequests:number;durationMs:number;calculatedGrossPLN:number|null;
 observedSubtotalGrossPLN:number|null;issues:string[];createdAt:string};
type AgentEvent={
 id:string;taskId:string;orderId:string;supplier:'fmic';jobId:string;
 runId:string;seq:number;mode:'inspect'|'cart-only';
 phase:'started'|'inspect_product'|'inspected'|'cart_add'|'cart_add_ack'|
  'inspect_cart'|'cart_verified'|'needs_review'|'completed_readonly'|'stopped';
 stepIndex:number|null;createdAt:string;
};
const agentPhaseName:Record<AgentEvent['phase'],string>={
 started:'Agent rozpoczął zadanie',
 inspect_product:'Otwieranie karty produktu',
 inspected:'Karta i SKU sprawdzone',
 cart_add:'Przygotowanie dodania do koszyka',
 cart_add_ack:'Dodanie do koszyka zgłoszone',
 inspect_cart:'Sprawdzanie zawartości koszyka',
 cart_verified:'Lokalna kontrola koszyka zakończona — sprawdź ręcznie',
 needs_review:'Wymagana ręczna kontrola koszyka',
 completed_readonly:'Inspekcja tylko do odczytu zakończona',
 stopped:'Agent zatrzymany',
};
const terminalPhases:AgentEvent['phase'][]=[
 'cart_verified','needs_review','completed_readonly','stopped'];
type ResponseData={
 summary:{queued:number;offline_reported:number;cancelled:number;total:number};
 tasks:Task[];events:Event[];cartReviews:CartReview[];agentEvents:AgentEvent[];
 limit:number;asOf:string;mode:'local-agent-telemetry';liveVendorWorker:false;localAgentTelemetryEnabled:boolean;
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
 const cartReviewsByTask=useMemo(()=>{
  const map=new Map<string,CartReview[]>();
  for(const review of data?.cartReviews??[]){
   map.set(review.taskId,[...(map.get(review.taskId)??[]),review]);
  }
  return map;
 },[data]);
 const agentEventsByTask=useMemo(()=>{
  const output=new Map<string,AgentEvent[]>();
  for(const event of data?.agentEvents??[]){
   output.set(event.taskId,[...(output.get(event.taskId)??[]),event]);
  }
  return output;
 },[data]);
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
    <p>Kolejka FMIC/MTuning, etapy pracy lokalnego agenta Playwright i historia kontroli koszyka.</p>
   </div>
   <div className="admin-toolbar">
    <Link href="/admin/orders" className="outline">Zamówienia</Link>
    <button className="outline" type="button" disabled={polling}
     onClick={()=>void refresh()}><RefreshCcw size={16}/> {polling?'Odświeżanie…':'Odśwież'}</button>
   </div>
  </div>

  <div className="admin-warning" style={{marginBottom:18}}>
   <ShieldCheck size={22}/>
   <div><strong>Monitorowanie lokalnego agenta FMIC — bez wysyłania zamówień</strong>
    <p>Etapy pracy są raportowane do PostgreSQL z komputera operatora, gdy agent jest uruchomiony
     z bezpiecznym tokenem. Panel nie przesyła obrazu przeglądarki ani nie steruje nią zdalnie.
     W trybie „tylko koszyk” agent nie przechodzi do płatności i nigdy nie klika „Złóż zamówienie”.</p>
    <p><small>{data?.localAgentTelemetryEnabled
     ?'Raportowanie etapów agenta jest skonfigurowane po stronie serwera.'
     :'Raportowanie agenta nie jest jeszcze skonfigurowane na serwerze (RPM_B2B_AGENT_TOKEN).'}</small></p>
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
      const live=(agentEventsByTask.get(task.id)??[]).filter(item=>item.jobId===task.jobId);
      const last=live[0];
      const isRunning=!!last&&!terminalPhases.includes(last.phase)&&
       Date.now()-new Date(last.createdAt).getTime()<90000;
      const isStale=!!last&&!terminalPhases.includes(last.phase)&&!isRunning;
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
       {last&&<div style={{marginTop:12,padding:12,border:'1px solid #6d7480',borderRadius:10}}>
        <strong>Agent FMIC: {isRunning?'W trakcie pracy (ostatni etap świeży)':
         isStale?'Brak aktualizacji — sprawdź komputer operatora':
         last.phase==='stopped'?'Zatrzymany':
         'Zakończony — wymagana kontrola operatora'}</strong>
        <small style={{display:'block'}}>Tryb: {last.mode==='inspect'?'Tylko podgląd':'Wyłącznie przygotowanie koszyka'}
         {' · '}Przebieg: {last.runId.slice(0,8)}
         {' · '}Ostatni sygnał: {time(last.createdAt)}</small>
        <details style={{marginTop:8}} open={isRunning}>
         <summary style={{cursor:'pointer'}}>Dziennik etapów agenta ({live.length} widocznych)</summary>
         <div style={{display:'grid',gap:5,marginTop:8}}>
          {live.slice(0,15).map(event=><small key={event.id}>
           {time(event.createdAt)} · {agentPhaseName[event.phase]}
           {event.stepIndex!==null?' · pozycja '+(event.stepIndex+1):''}
          </small>)}
         </div>
        </details>
        <small style={{display:'block',marginTop:6}}>
         To raportowanie z lokalnego programu, nie niezależne potwierdzenie zakupu od FMIC.
        </small>
       </div>}
       {(cartReviewsByTask.get(task.id)??[]).filter(review=>review.jobId===task.jobId)
        .slice(0,3).map(review=><div key={review.id}
         style={{marginTop:12,border:'1px solid #676d77',borderRadius:10,padding:12}}>
          <strong style={{color:review.verdict==='verified'?'inherit':'#ffcb82'}}>
           {review.verdict==='verified'
            ?'Koszyk FMIC zgodny z raportem (wymaga ręcznego sprawdzenia)'
            :'Koszyk FMIC — niezgodność, wymagane sprawdzenie'}
          </strong>
          <small style={{display:'block'}}>Raport: {time(review.createdAt)}
           {' · '}Przebieg {review.runId.slice(0,8)}
           {' · '}{review.items} poz.{' · '}{review.durationMs} ms</small>
          <small style={{display:'block'}}>Suma z koszyka:
           {' '}{review.observedSubtotalGrossPLN!==null
            ?review.observedSubtotalGrossPLN.toFixed(2)+' PLN':'nieustalona'}
           {' · '}Próby dodania: {review.cartAddRequests}</small>
          {review.issues.map((issue,i)=><small key={i}
           style={{display:'block',color:'#ffcb82'}}>• {issue}</small>)}
          <small style={{display:'block',marginTop:4}}>
           To raport przesłany przez operatora, nie potwierdzenie od FMIC.
           Zamówienia nie wysłano.
          </small>
         </div>)}
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
    Etapy automatu pojawiają się przy odświeżaniu co 10 sekund. Nie przesyłamy haseł, cookies ani zrzutów ekranu.
   </p>
  </section>
 </main>;
}
