'use client';
import {useEffect,useState} from 'react';
type Report={control?:{enabled:boolean;heartbeat:string|null;last_error:string|null;processed:string};stats:{status:string;total:number}[];examples:{url:string;status:string;detail:string|null}[]};
const endpoint='/api/admin/suppliers/fmic/images';
export default function FmicImages(){
 const [report,setReport]=useState<Report|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const running=!!report?.control?.enabled;
 async function read(){const r=await fetch(endpoint,{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);setReport(d);setError('')}
 useEffect(()=>{let active=true;let timer:ReturnType<typeof setTimeout>;async function poll(){try{const r=await fetch(endpoint,{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);if(active){setReport(d);setError('')}}catch(e){if(active)setError(String(e))}finally{if(active)timer=setTimeout(poll,5000)}}void poll();return()=>{active=false;clearTimeout(timer)}},[]);
 async function run(action:'seed'|'retry'|'start'|'pause'){
 if(busy)return;setBusy(true);setError('');
 try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});const d=await r.json();if(!r.ok)throw Error(d.error);await read()}catch(e){setError(String(e))}finally{setBusy(false)}
 }
 const counts=Object.fromEntries((report?.stats??[]).map(s=>[s.status,s.total]));
 const total=Object.values(counts).reduce((a,b)=>a+b,0),pending=counts.pending??0,checked=total-pending;
 return <div role="tabpanel"><h2>Centrum jakości zdjęć</h2><div className="rpm-admin-audit-state" role="status"><strong>{!report?'Pobieranie stanu…':running?(pending?'Audyt włączony · praca serwerowa':'Kolejka ukończona · automatyczne oczekiwanie'):'Audyt wstrzymany'}</strong><span>Ostatnia aktywność: {report?.control?.heartbeat?new Date(report.control.heartbeat).toLocaleString('pl-PL'):'—'}</span></div><p className="fc-note">Audyt unikalnych adresów. Białe obrazy i potwierdzone HTTP 404/410 są ukrywane w podglądzie; pozostałe błędy wymagają weryfikacji.</p>
 <div className="fc-kpis">{[['Adresy w kolejce',total],['Sprawdzone',checked],['Poprawne',counts.ok??0],['Puste',counts.blank??0],['Brak pliku',counts.missing??0],['Do weryfikacji',counts.review??0]].map(([label,value])=><div className="fc-kpi" key={label}><small>{label}</small><strong>{Number(value).toLocaleString('pl-PL')}</strong></div>)}</div>
 <progress className="fc-progress" max={Math.max(1,total)} value={checked}/><p>{total?(checked/total*100).toFixed(2):'0'}% · pozostało {pending.toLocaleString('pl-PL')}</p>
 <div className="fc-toolbar"><button className="outline" disabled={busy} onClick={()=>void run('seed')}>Aktualizuj kolejkę z XML</button><button className="primary" disabled={busy||running||!report} onClick={()=>void run('start')}>Rozpocznij / wznów audyt</button><button className="outline" disabled={busy||!running} onClick={()=>void run('pause')}>Wstrzymaj po bieżącej partii</button><button className="outline" disabled={busy||running||!counts.review} onClick={()=>void run('retry')}>Ponów niepewne wyniki</button></div>
 <p className="fc-note">Audyt działa na serwerze, niezależnie od otwartej zakładki. Po wdrożeniu lub restarcie wznawia pracę, jeśli jest włączony. Wstrzymanie kończy bieżącą partię.</p>{error&&<p role="alert">{error}</p>}{report?.control?.last_error&&<p role="alert">Ostatni błąd serwera: {report.control.last_error}</p>}
 <div className="fc-table-wrap"><table className="fc-table"><thead><tr><th>Ostatnie nieprawidłowości</th><th>Status</th><th>Szczegóły</th></tr></thead><tbody>{report?.examples.map(e=><tr key={e.url}><td style={{overflowWrap:'anywhere'}}><a href={e.url} target="_blank" rel="noopener noreferrer">{e.url}</a></td><td>{e.status}</td><td>{e.detail??'Jednolicie biały obraz'}</td></tr>)}</tbody></table></div></div>
}
