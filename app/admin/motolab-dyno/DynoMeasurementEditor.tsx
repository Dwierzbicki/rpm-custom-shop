'use client';
import {useState} from 'react';
import {analyseDyno,parseDynoCsv,emptyDynoConditions,type DynoBuild,type DynoConditions} from '../../lib/motolab-dyno';
import DynoCurve from '../../components/storefront/DynoCurve';
export default function DynoMeasurementEditor({build,onChange}:{build:DynoBuild;onChange:(p:Partial<DynoBuild>)=>void}){
 const [raw,setRaw]=useState(''),[error,setError]=useState('');
 const c=build.conditions??emptyDynoConditions;
 const update=(p:Partial<DynoConditions>)=>onChange({conditions:{...c,...p}});
 const analysis=build.measurement?analyseDyno(build.measurement):null;
 const importPoints=(value:string,source:'csv'|'manual-transcription')=>{
  try{const measurement=parseDynoCsv(value,source);onChange({measurement});setError('');setRaw('')}catch(e){setError(e instanceof Error?e.message:'Błąd importu')}
 };
 return <section style={{borderTop:'1px solid var(--rpm-color-panel-border)',paddingTop:20,marginTop:20}}>
  <h3>Parametry pomiaru i konfiguracji</h3><p>Podaj rzeczywiste dane. Nieznane pola pozostaw puste. Dane będą widoczne po publikacji.</p>
  <div className="rpm-settings-grid">
   {([['turbo','Turbo — model, A/R, flansza'],['camshafts','Wałki rozrządu'],['ecu','Sterownik / ECU'],['dyno','Hamownia / typ'],['correction','Norma korekcji (np. DIN, SAE)']] as const).map(([key,label])=><label key={key} className="rpm-settings-field">{label}<input maxLength={200} value={c[key]} onChange={e=>update({[key]:e.target.value})}/></label>)}
   {([['boostBar','Maks. doładowanie względne (bar)',0,10],['compressionRatio','Stopień sprężania (CR)',4,20]] as const).map(([key,label,min,max])=><label key={key} className="rpm-settings-field">{label}<input type="number" step=".01" min={min} max={max} value={c[key]??''} onChange={e=>update({[key]:e.target.value===''?null:Number(e.target.value)})}/></label>)}
  </div>
  <h3>Analiza przebiegu hamowni</h3><p>Importuj jeden przebieg CSV z nagłówkiem <code>rpm,power_ps,torque_nm</code> (RPM, KM metryczne, Nm; zgodna baza pomiaru mocy i momentu). Dopuszczalny separator przecinek lub średnik; 2–400 punktów, rosnące RPM. Nie przeliczamy mocy z kół na silnik.</p>
  <label className="rpm-settings-field">Plik CSV<input type="file" accept=".csv,text/csv,text/plain" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>50000){setError('Plik przekracza 50 KB.');return}try{importPoints(await file.text(),'csv')}catch{setError('Nie udało się odczytać pliku.')}}}/></label>
  <label className="rpm-settings-field">Ręczna transkrypcja z wykresu (nie AI)<textarea rows={5} maxLength={50000} placeholder={'rpm,power_ps,torque_nm'} value={raw} onChange={e=>setRaw(e.target.value)}/></label>
  <button className="outline" type="button" disabled={!raw.trim()} onClick={()=>importPoints(raw,'manual-transcription')}>Przelicz punkty</button>
  {error&&<p role="alert">{error}</p>}
  {build.measurement&&analysis&&<>
   <p>{build.measurement.points.length} punktów · {build.measurement.source==='csv'?'CSV':'Ręczna transkrypcja'} · {analysis.rpmMin}–{analysis.rpmMax} RPM</p>
   <DynoCurve measurement={build.measurement} english={false}/>
   <p>Najwyższa moc z próbek: <strong>{analysis.powerPeak.powerPs} KM @ {analysis.powerPeak.rpm} RPM</strong></p>
   <p>Najwyższy moment z próbek: <strong>{analysis.torquePeak.torqueNm} Nm @ {analysis.torquePeak.rpm} RPM</strong></p>
   {[['3000',analysis.torqueAt3000],['4000',analysis.torqueAt4000]].map(([rpm,v])=><p key={String(rpm)}>{String(rpm)} RPM: {v&&typeof v==='object'?(v.torqueNm+' Nm'+(v.interpolated?' (interpolacja)':'')):'brak danych'}</p>)}
   {!!analysis.inconsistentPoints&&<p role="alert">Uwaga: {analysis.inconsistentPoints} punktów ma rozbieżność relacji KM/Nm/RPM. Sprawdź jednostki, bazę pomiaru i transkrypcję. Nie korygujemy danych automatycznie.</p>}
   <div className="admin-toolbar"><button type="button" className="outline" onClick={()=>onChange({powerPs:analysis.powerPeak.powerPs,torqueNm:analysis.torquePeak.torqueNm})}>Przenieś maksima z próbek do formularza</button><button type="button" className="outline" onClick={()=>onChange({measurement:undefined})}>Usuń punkty</button></div>
  </>}
  <p>Automatyczne odczytywanie zdjęć i PDF przez AI nie jest jeszcze aktywne. Publikacja nadal wymaga potwierdzenia konfiguracji i wykresu przez administratora.</p>
 </section>;
}
