'use client';
import {useEffect,useRef,useState} from 'react';
type Report={stats:{status:string;total:number}[];examples:{url:string;status:string;detail:string|null}[]};
const endpoint='/api/admin/suppliers/fmic/images';
export default function FmicImages(){
 const [report,setReport]=useState<Report|null>(null),[running,setRunning]=useState(false),[error,setError]=useState('');
 const stop=useRef(false),active=useRef(false),mounted=useRef(true);
 async function read(){const r=await fetch(endpoint,{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);if(mounted.current)setReport(d)}
 async function post(action:string){const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});const d=await r.json();if(!r.ok)throw Error(d.error);return d}
 useEffect(()=>{mounted.current=true;void read().catch(e=>setError(String(e)));return()=>{mounted.current=false;stop.current=true}},[]);
 async function run(action:'seed'|'retry'|'batch'){
 if(active.current)return;active.current=true;stop.current=false;setRunning(true);setError('');
 try{if(action!=='batch'){await post(action);await read()}
 else{let n=0;while(!stop.current){const d=await post('batch');if(!d.processed)break;n++;if(n%5===0)await read();await new Promise(r=>setTimeout(r,1000))}await read()}}
 catch(e){if(mounted.current)setError(String(e))}
 finally{active.current=false;if(mounted.current)setRunning(false)}
 }
 const counts=Object.fromEntries((report?.stats??[]).map(s=>[s.status,s.total]));
 const total=Object.values(counts).reduce((a,b)=>a+b,0),pending=counts.pending??0,checked=total-pending;
 return <div role="tabpanel"><h2>Image Quality Center</h2><p className="fc-note">Audyt unikalnych adresów. Białe obrazy i potwierdzone HTTP 404/410 są ukrywane w podglądzie; pozostałe błędy wymagają weryfikacji.</p>
 <div className="fc-kpis">{[['Adresy w kolejce',total],['Sprawdzone',checked],['Poprawne',counts.ok??0],['Puste',counts.blank??0],['Brak pliku',counts.missing??0],['Do weryfikacji',counts.review??0]].map(([label,value])=><div className="fc-kpi" key={label}><small>{label}</small><strong>{Number(value).toLocaleString('pl-PL')}</strong></div>)}</div>
 <progress className="fc-progress" max={Math.max(1,total)} value={checked}/><p>{total?(checked/total*100).toFixed(2):'0'}% · pozostało {pending.toLocaleString('pl-PL')}</p>
 <div className="fc-toolbar"><button className="outline" disabled={running} onClick={()=>void run('seed')}>Aktualizuj kolejkę z XML</button><button className="primary" disabled={running||!pending} onClick={()=>void run('batch')}>Rozpocznij / wznów audyt</button><button className="outline" disabled={!running} onClick={()=>{stop.current=true}}>Zatrzymaj po partii</button><button className="outline" disabled={running||!counts.review} onClick={()=>void run('retry')}>Ponów niepewne wyniki</button></div>
 <p className="fc-note">Skanowanie trwa tylko podczas otwartej zakładki. Zamknięcie widoku zatrzymuje wysyłanie kolejnych partii; zapisane wyniki pozostają w bazie.</p>{error&&<p role="alert">{error}</p>}
 <div className="fc-table-wrap"><table className="fc-table"><thead><tr><th>Ostatnie nieprawidłowości</th><th>Status</th><th>Szczegóły</th></tr></thead><tbody>{report?.examples.map(e=><tr key={e.url}><td style={{overflowWrap:'anywhere'}}>{e.url}</td><td>{e.status}</td><td>{e.detail??'Jednolicie biały obraz'}</td></tr>)}</tbody></table></div></div>
}
