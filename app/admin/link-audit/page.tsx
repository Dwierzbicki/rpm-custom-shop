'use client';
import {useEffect,useRef,useState} from 'react';
import {Play,Pause,Download,ExternalLink,RefreshCw} from 'lucide-react';
import {auditCsv,classifyAuditResponse,type AuditItem,type AuditMode,type AuditState,type AuditIssue} from '../../lib/link-audit';
import {readAudit,readAuditIssues,saveAudit} from '../../lib/link-audit-storage';
import '../../styles/admin-link-audit.css';
const delay=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
const fmt=(n:number)=>n.toLocaleString('pl-PL');
const titles:Record<AuditMode,string>={pages:'Strony, kategorie i produkty własne',special:'SKU ze znakami specjalnymi (FMIC)',all:'Cały katalog i strony'};
async function batch(mode:AuditMode,phase:string,cursor:string,signal:AbortSignal,count=false){
 const r=await fetch('/api/admin/link-audit?'+new URLSearchParams({mode,phase,cursor,...(count?{count:'1'}:{})}),{cache:'no-store',signal});
 if(!r.ok)throw Error('Nie udało się pobrać listy adresów (HTTP '+r.status+'). Sprawdź sesję i spróbuj ponownie.');
 return await r.json() as {items:AuditItem[];total?:number};
}
async function check(item:AuditItem,signal:AbortSignal){
 const url=new URL(item.path,location.origin);
 if(url.origin!==location.origin||!item.path.startsWith('/')||item.path.startsWith('//'))return 'Adres poza sklepem';
 const ctrl=new AbortController(),abort=()=>ctrl.abort();
 signal.addEventListener('abort',abort,{once:true});if(signal.aborted)ctrl.abort();
 const timer=setTimeout(abort,20000);
 try{
  const response=await fetch(url,{cache:'no-store',redirect:'manual',credentials:'same-origin',signal:ctrl.signal});
  const contentType=response.headers.get('content-type')??'';
  const html=response.status===200&&contentType.includes('text/html')?await response.text():'';
  if(!html)await response.body?.cancel().catch(()=>{});
  return classifyAuditResponse(response.status,response.type,contentType,html,item.sku);
 }catch(e){if(signal.aborted)throw e;return ctrl.signal.aborted?'Timeout':'Błąd sieci'}
 finally{clearTimeout(timer);signal.removeEventListener('abort',abort)}
}
export default function LinkAudit(){
 const [mode,setMode]=useState<AuditMode>('pages'),[state,setState]=useState<AuditState>(),[issues,setIssues]=useState<AuditIssue[]>([]),[running,setRunning]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(''),[current,setCurrent]=useState('');
 const active=useRef<AbortController|null>(null);
 const refresh=async()=>{const [saved,list]=await Promise.all([readAudit(),readAuditIssues(100)]);setState(saved);setIssues(list);if(saved)setMode(saved.mode)};
 useEffect(()=>{void refresh().catch(()=>setError('Nie można odczytać zapisanego audytu.')).finally(()=>setReady(true));return()=>active.current?.abort()},[]);
 async function run(resume:boolean){
  if(active.current||!ready)return;
  if(!navigator.locks){setError('Ta przeglądarka nie obsługuje bezpiecznej blokady audytu. Użyj aktualnego Chrome lub Edge.');return}
  const ctrl=new AbortController();active.current=ctrl;setRunning(true);setError('');
  try{await navigator.locks.request('rpm-link-audit',{ifAvailable:true},async lock=>{
   if(!lock)throw Error('Audyt jest już uruchomiony w innej karcie.');
   let s=resume?await readAudit():undefined;
   if(resume&&(!s||s.done))throw Error('Brak audytu do wznowienia.');
   if(!s){
    const first=await batch(mode,'prefix','',ctrl.signal,true);
    s={mode,phase:'prefix',cursor:'',total:first.total??0,checked:0,ok:0,issues:0,done:false,startedAt:new Date().toISOString()};
    await saveAudit(s,undefined,true);setState(s);setIssues([]);
   }
   while(!ctrl.signal.aborted&&!s.done){
    const b=await batch(s.mode,s.phase,s.cursor,ctrl.signal);
    if(ctrl.signal.aborted)break;
    if(!b.items.length){
     s=s.phase==='prefix'&&s.mode!=='pages'?{...s,phase:'supplier',cursor:''}:{...s,done:true};
     await saveAudit(s);setState(s);continue;
    }
    for(const item of b.items){
     if(ctrl.signal.aborted)break;
     setCurrent(item.path);
     const result=await check(item,ctrl.signal);
     if(ctrl.signal.aborted)break;
     if(result==='HTTP 401'||result==='HTTP 403'||result==='Blokada dostępu')throw Error('Sesja wygasła lub dostęp zablokowany. Zaloguj się i wznów audyt.');
     const issue=result==='200'?undefined:{id:s.phase+':'+item.cursor,path:item.path,sku:item.sku,result,checkedAt:new Date().toISOString()};
     s={...s,cursor:item.cursor,checked:s.checked+1,ok:s.ok+(issue?0:1),issues:s.issues+(issue?1:0)};
     await saveAudit(s,issue);setState(s);
     if(issue)setIssues(old=>old.length<100?[...old,issue]:old);
     if(['HTTP 429','HTTP 502','HTTP 503','HTTP 504','Timeout','Błąd sieci'].includes(result))throw Error('Audyt wstrzymany po błędzie serwera lub sieci. Sprawdź stan sklepu i wznów.');
     await delay(1000);
    }
   }
  })}catch(e){if(!ctrl.signal.aborted)setError(e instanceof Error?e.message:'Błąd audytu')}
  finally{active.current=null;setRunning(false);setCurrent('')}
 }
 async function download(){
  try{const rows=await readAuditIssues();const url=URL.createObjectURL(new Blob([auditCsv(rows)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='rpm-audyt-linkow.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch{setError('Nie udało się wyeksportować raportu.')}
 }
 return <main className="admin-page rpm-link-audit"><header className="admin-top"><div><span className="eyebrow">RPM CUSTOM / QA</span><h1>Sprawdzenie poprawności linków</h1><p>Audyt adresów naszego sklepu. Sprawdzamy odpowiedź GET, a dla kart produktów również zgodność SKU w HTML.</p></div></header>
 <section className="rpm-overview-section"><h2>Zakres audytu</h2><div className="rpm-link-audit-actions"><label>Zakres<select value={mode} disabled={running||!ready} onChange={e=>setMode(e.target.value as AuditMode)}>{Object.entries(titles).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><button className="primary" disabled={running||!ready} onClick={()=>{if(!state||window.confirm('Nowy audyt zastąpi zapisany raport. Kontynuować?'))void run(false)}}><Play size={17}/> Rozpocznij nowy audyt</button><button className="outline" disabled={running||!ready||!state||state.done} onClick={()=>void run(true)}><Play size={17}/> Wznów</button><button className="outline" disabled={!running} onClick={()=>active.current?.abort()}><Pause size={17}/> Wstrzymaj</button><button className="outline" disabled={running||!ready} onClick={()=>void refresh().catch(()=>setError('Błąd odczytu'))}><RefreshCw size={17}/> Odśwież</button></div>
 <p className="muted">Jedno żądanie strony naraz, co najmniej 1 s przerwy. Skan działa w tej karcie przeglądarki; zamknięcie karty zatrzymuje pracę. Postęp jest zapisywany lokalnie i można go wznowić. Katalog jest odczytywany partiami i może się zmieniać w trakcie skanu. Nie pobieramy zdjęć ani nie wysyłamy formularzy.</p>
 {error&&<p role="alert" className="admin-warning">{error}</p>}
 </section>
 <section className="rpm-overview-section"><h2>Postęp — {running?'Trwa sprawdzanie':state?.done?'Zakończony':state?'Wstrzymany':'Nie rozpoczęto'}</h2>{state&&<p className="muted">{titles[state.mode]} · {new Date(state.startedAt).toLocaleString('pl-PL')}</p>}<div className="rpm-link-audit-metrics">{[['Sprawdzono',state?.checked],['200 / poprawne',state?.ok],['Do weryfikacji',state?.issues],['Szacowana liczba adresów',state?.total]].map(([label,n])=><div key={String(label)}><small>{label}</small><strong>{typeof n==='number'?fmt(n):'—'}</strong></div>)}</div><progress aria-label="Postęp audytu" max={Math.max(1,state?.total??0,state?.checked??0)} value={state?.done?Math.max(1,state.total,state.checked):state?.checked??0}/>{current&&<p className="rpm-link-audit-current">Sprawdzam: {current}</p>}</section>
 <section className="rpm-overview-section"><div className="rpm-link-audit-report-head"><h2>Adresy do weryfikacji</h2><button className="outline" disabled={!state?.issues||running} onClick={()=>void download()}><Download size={17}/> Pobierz CSV</button></div><p className="muted">Przekierowania są oznaczane do weryfikacji, bez automatycznego przechodzenia dalej. Przeglądarka nie ujawnia ich dokładnego kodu w trybie manual. Raport CSV zawiera wszystkie zapisane problemy; poniżej maks. 100.</p>{!issues.length?<p>Brak zapisanych problemów.</p>:<div className="rpm-link-audit-table"><table><thead><tr><th>Adres / SKU</th><th>Wynik</th></tr></thead><tbody>{issues.map(i=><tr key={i.id}><td><a href={i.path} target="_blank" rel="noopener noreferrer">{i.path} <ExternalLink size={14}/></a>{i.sku&&<small>{i.sku}</small>}</td><td>{i.result}</td></tr>)}</tbody></table></div>}</section>
 </main>
}
