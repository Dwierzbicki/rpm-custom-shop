'use client';
import {useEffect,useState} from 'react';
type Report={allowed:boolean;stats:{status:string;total:number}[];control:{enabled:boolean;heartbeat:string|null;last_error:string|null;server_time:string};examples:{sku:string;status:string;detail:string|null}[]};
const endpoint='/api/admin/suppliers/fmic/description-queue';
async function responseData(r:Response){
 if(r.status===401||r.status===403&&r.redirected||r.redirected&&r.url.includes('/login'))throw Error('Sesja administratora wygasła. Zaloguj się ponownie.');
 const raw=await r.text();let data;
 try{data=JSON.parse(raw)}catch{throw Error('Serwer zwrócił '+(raw.trim()?'nieprawidłową':'pustą')+' odpowiedź (HTTP '+r.status+'). Stan kolejki zostanie sprawdzony przy następnym odczycie.')}
 if(!r.ok)throw Error(typeof data?.error==='string'?data.error:'Błąd serwera HTTP '+r.status);
 if(!data||typeof data!=='object')throw Error('Nieprawidłowe dane z serwera.');
 return data;
}
export default function FmicDescriptionQueue({onOpen}:{onOpen:(sku:string)=>void}){
 const [report,setReport]=useState<Report|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[pollError,setPollError]=useState('');
 async function read(){const r=await fetch(endpoint,{cache:'no-store'});const d=await responseData(r);if(!Array.isArray(d.stats)||!d.control||!Array.isArray(d.examples))throw Error('Niekompletny raport kolejki.');return d as Report}
 useEffect(()=>{let active=true;let timer:ReturnType<typeof setTimeout>;async function poll(){try{const d=await read();if(active){setReport(d);setPollError('')}}catch(e){if(active)setPollError(e instanceof Error?e.message:String(e))}finally{if(active)timer=setTimeout(poll,10000)}}void poll();return()=>{active=false;clearTimeout(timer)}},[]);
 async function run(action:string){if(busy)return;setBusy(true);setError('');try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});await responseData(r);setReport(await read());setPollError('')}catch(e){setError((e instanceof Error?e.message:String(e))+' Nie ponawiam automatycznie operacji.');try{setReport(await read());setPollError('')}catch{}}finally{setBusy(false)}}
 const counts=Object.fromEntries((report?.stats??[]).map(s=>[s.status,s.total]));const pending=counts.pending??0,done=counts.done??0,review=counts.review??0,total=pending+done+review,running=!!report?.control?.enabled;
 return <section className="rpm-settings-card"><h2>Automatyczne przypisywanie opisów</h2><p className="muted">Automat przetwarza produkty bez opisu, przypisuje dane do SKU i zapisuje szkice. Nie nadpisuje istniejących opisów, nie publikuje automatycznie i nie zmienia cen.</p>
 <div className="rpm-admin-audit-state"><strong>{!report?'Ładowanie…':running?'Kolejka włączona':pending?'Kolejka wstrzymana':'Brak oczekujących produktów'}</strong><span>Ostatnia aktywność: {report?.control.heartbeat?new Date(report.control.heartbeat).toLocaleString('pl-PL'):'—'}</span></div>
 <div className="rpm-admin-supplier-kpis">{[['Kolejka',total],['Oczekuje',pending],['Przypisane',done],['Do weryfikacji',review]].map(([label,value])=><div key={String(label)}><small>{label}</small><strong>{Number(value).toLocaleString('pl-PL')}</strong></div>)}</div>
 <progress className="fc-progress" max={Math.max(1,total)} value={done+review}/><small>{total?((done+review)/total*100).toFixed(2):'0'}% przetworzonych</small>
 {!report?.allowed&&<p className="admin-warning">Automatyczne pobieranie jest wyłączone do czasu potwierdzenia warunków dostawcy.</p>}
 <div className="rpm-admin-quick-actions"><button className="outline" disabled={busy||!report||running} onClick={()=>void run('seed')}>Uzupełnij kolejkę</button><button className="primary" disabled={busy||!report||running||!report?.allowed} onClick={()=>void run('start')}>Rozpocznij / wznów</button><button className="outline" disabled={busy||!running} onClick={()=>void run('pause')}>Wstrzymaj</button><button className="outline" disabled={busy||running||!review} onClick={()=>void run('retry')}>Ponów weryfikację</button></div>
 <p className="muted">Proces serwerowy, zachowuje postęp po wdrożeniu. Maksymalnie jedno pobranie strony na 30 sekund; błędy 403, 429 i 503 wstrzymują automat.</p>
 {pollError&&<p role="status" className="rpm-settings-error">{pollError}</p>}{error&&<p role="alert" className="rpm-settings-error">{error}</p>}{report?.control.last_error&&<p role="alert" className="rpm-settings-error">{report.control.last_error}</p>}
 <div style={{overflow:'auto'}}><table style={{width:'100%'}}><thead><tr><th>SKU do weryfikacji</th><th>Powód</th><th>Akcja</th></tr></thead><tbody>{report?.examples.map(r=><tr key={r.sku}><td>{r.sku}</td><td>{r.detail}</td><td><button className="outline" onClick={()=>onOpen(r.sku)}>Otwórz ręcznie</button></td></tr>)}</tbody></table></div></section>
}
