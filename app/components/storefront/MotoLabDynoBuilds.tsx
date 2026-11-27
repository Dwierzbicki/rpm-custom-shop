'use client';
import {useEffect,useState} from 'react';
import {ChevronDown,ExternalLink,Gauge,Info,RefreshCw} from 'lucide-react';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
import DynoCurve from './DynoCurve';
import {displacementCc,analyseDyno,validDynoBuild,type DynoBuild} from '../../lib/motolab-dyno';

export default function MotoLabDynoBuilds({version}:{version:string}){
 const {lang}=useStorefrontLanguage(),en=lang==='en';
 const tr=(pl:string,english:string)=>en?english:pl;
 const [result,setResult]=useState<{version:string;state:'ready'|'error';rows:DynoBuild[]}|null>(null);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const c=new AbortController();
  fetch('/api/motolab-dyno?'+new URLSearchParams({version}),{signal:c.signal,cache:'no-store'}).then(async r=>{
   if(!r.ok)throw Error('Request failed');
   const d=await r.json();
   if(!Array.isArray(d.builds)||!d.builds.every((b:unknown)=>validDynoBuild(b)&&b.version===version&&b.published&&b.attested))throw Error('Invalid dyno response');
   if(!c.signal.aborted)setResult({version,state:'ready',rows:d.builds});
  }).catch(()=>{if(!c.signal.aborted)setResult({version,state:'error',rows:[]})});
  return()=>c.abort();
 },[version,retry]);
 const current=result?.version===version?result:null;
 const rows=current?.rows??[];
 const fmt=(n:number)=>n.toLocaleString(en?'en-GB':'pl-PL');
 return <details className="rpm-build-more rpm-dyno-library">
  <summary><Gauge size={19} aria-hidden="true"/><span>{tr('Sprawdzone konfiguracje z hamowni','Real-world dyno builds')}</span><small>{current?.state==='ready'?rows.length+' '+tr(rows.length===1?'projekt':rows.length>=2&&rows.length<=4?'projekty':'projektów','builds'):tr('Baza pomiarów','Measurement library')}</small><ChevronDown size={16} aria-hidden="true"/></summary>
  <div className="rpm-dyno-library-body">
   {!current?<div className="rpm-dyno-state" role="status"><Gauge size={24}/><div><strong>{tr('Sprawdzamy dostępne pomiary','Checking available measurements')}</strong><p>{tr('Wczytywanie konfiguracji dla wybranego silnika…','Loading configurations for the selected engine…')}</p></div></div>:current.state==='error'?<div className="rpm-dyno-state" role="status"><Info size={24}/><div><strong>{tr('Nie udało się pobrać danych','Unable to load data')}</strong><p>{tr('Baza pomiarów jest chwilowo niedostępna.','The measurement library is temporarily unavailable.')}</p><button className="outline" type="button" onClick={()=>{setResult(null);setRetry(v=>v+1)}}><RefreshCw size={15}/>{tr('Spróbuj ponownie','Try again')}</button></div></div>:!rows.length?<div className="rpm-dyno-state"><Gauge size={24}/><div><strong>{tr('Brak opublikowanych pomiarów','No published measurements')}</strong><p>{tr('Dla wybranego silnika nie ma jeszcze zatwierdzonych projektów z wykresem hamowni.','There are no approved projects with a dyno graph for this engine yet.')}</p></div></div>:<>
   <p className="rpm-dyno-intro">{tr('Rzeczywiste projekty dla wybranego silnika, niezależnie od celu mocy. Wynik dotyczy konkretnego auta i nie gwarantuje powtórzenia.','Real projects for the selected engine, regardless of power target. Results apply to individual vehicles and are not guaranteed to repeat.')}</p>
   {rows.map(b=>{
    const analysis=b.measurement?analyseDyno(b.measurement):null;
    const geometry=b.geometry;
    const geometryRows=geometry?([['block','Blok','Block'],['crank','Wał','Crankshaft'],['head','Głowica','Head'],['rods','Korbowody','Rods'],['pistons','Tłoki','Pistons'],['boreMm','Średnica (mm)','Bore (mm)'],['strokeMm','Skok (mm)','Stroke (mm)']] as const).filter(([k])=>geometry[k]!==null&&geometry[k]!==''):[];
    const conditions=b.conditions;
    const conditionRows=conditions?([['turbo','Turbo','Turbo'],['camshafts','Wałki rozrządu','Camshafts'],['ecu','ECU','ECU'],['dyno','Hamownia','Dyno'],['correction','Korekcja','Correction'],['boostBar','Doładowanie względne (bar)','Gauge boost (bar)'],['compressionRatio','Stopień sprężania','Compression ratio']] as const).filter(([k])=>conditions[k]!==null&&conditions[k]!==''):[];
    return <article className="rpm-dyno-project" key={b.id}>
     <header><div><h3>{b.title}</h3><div className="rpm-dyno-tags"><span>{b.fuel}</span><span>{b.usage==='street'?tr('Ulica','Street'):b.usage==='track'?tr('Tor','Track'):'Drift'}</span><span>{b.basis==='wheel'?tr('Na kołach','At wheels'):tr('Na silniku / przeliczone','At crank / calculated')}</span></div></div></header>
     <div className="rpm-dyno-metrics"><div><small>{tr('Moc','Power')}</small><strong>{fmt(b.powerPs)} <span>{tr('KM','PS')}</span></strong></div><div><small>{tr('Moment obrotowy','Torque')}</small><strong>{fmt(b.torqueNm)} <span>Nm</span></strong></div>{geometry&&displacementCc(geometry)!==null&&<div><small>{tr('Pojemność obliczona','Calculated displacement')}</small><strong>{fmt(displacementCc(geometry)!)} <span>cm³</span></strong></div>}</div>
     <small className="rpm-dyno-attestation">{tr('Wynik i konfiguracja potwierdzone przez administratora RPM','Result and build attested by RPM administrator')}</small>
     <div className="rpm-dyno-graph"><div className="rpm-dyno-graph-head"><strong>{tr('Wykres hamowni','Dyno graph')}</strong><a href={b.chartUrl} target="_blank" rel="noopener noreferrer">{tr('Otwórz oryginał','Open original')} <ExternalLink size={14}/></a></div><a href={b.chartUrl} target="_blank" rel="noopener noreferrer"><img className="rpm-dyno-chart" src={b.chartUrl} alt={tr('Wykres hamowni: ','Dyno graph: ')+b.title} loading="lazy"/></a></div>
     {b.measurement&&<details className="rpm-dyno-subsection"><summary>{tr('Interaktywny wykres i dane pomiarowe','Interactive chart and measurement data')}<ChevronDown size={15}/></summary><DynoCurve measurement={b.measurement} english={en}/><p>{b.measurement.source==='csv'?tr('Dane CSV','CSV data'):tr('Ręczna transkrypcja','Manual transcription')} · {b.measurement.points.length} {tr('punktów','points')}{!!analysis?.inconsistentPoints&&' · '+tr('Rozbieżność KM/Nm/RPM — do interpretacji','PS/Nm/RPM discrepancy — interpret cautiously')}</p></details>}
     {geometry&&geometryRows.length>0&&<details className="rpm-dyno-subsection"><summary>{tr('Geometria i skład silnika','Engine geometry and components')}<ChevronDown size={15}/></summary><dl className="rpm-dyno-specs">{geometryRows.map(([key,pl,english])=><div key={key}><dt>{tr(pl,english)}</dt><dd>{geometry[key]}</dd></div>)}</dl></details>}
     {conditions&&conditionRows.length>0&&<details className="rpm-dyno-subsection"><summary>{tr('Warunki pomiaru','Measurement conditions')}<ChevronDown size={15}/></summary><dl className="rpm-dyno-specs">{conditionRows.map(([key,pl,english])=><div key={key}><dt>{tr(pl,english)}</dt><dd>{conditions[key]}</dd></div>)}</dl></details>}
     {b.notes&&<details className="rpm-dyno-subsection"><summary>{tr('Uwagi do projektu','Project notes')}<ChevronDown size={15}/></summary><p style={{whiteSpace:'pre-wrap'}}>{b.notes}</p>{en&&<small>Project notes are shown in their original language.</small>}</details>}
     <details className="rpm-dyno-subsection"><summary>{tr('Lista zastosowanych części','Installed components')} ({b.parts.length})<ChevronDown size={15}/></summary><div className="rpm-dyno-parts">{b.parts.map((p,i)=><div key={i}><strong>{p.qty} × {p.name}</strong>{p.sku&&<small>SKU: {p.sku}</small>}{p.note&&<p>{p.note}</p>}{p.sku&&<a href={'/sklep?'+new URLSearchParams({q:p.sku})}>{tr('Sprawdź produkt w sklepie','Check product in shop')} <ExternalLink size={13}/></a>}</div>)}</div></details>
    </article>
   })}
   </>}
  </div>
 </details>;
}
