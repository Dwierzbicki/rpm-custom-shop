'use client';
import {analyseDyno,type DynoMeasurement} from '../../lib/motolab-dyno';
export default function DynoCurve({measurement,english}:{measurement:DynoMeasurement;english:boolean}){
 const a=analyseDyno(measurement);if(!a)return null;
 const pts=measurement.points,lo=a.rpmMin,hi=a.rpmMax;
 const pMax=Math.max(1,a.powerPeak.powerPs),tMax=Math.max(1,a.torquePeak.torqueNm);
 const x=(rpm:number)=>44+rpmToRatio(rpm)*472;
 function rpmToRatio(rpm:number){return (rpm-lo)/(hi-lo)}
 const line=(key:'powerPs'|'torqueNm',max:number)=>pts.map(p=>x(p.rpm).toFixed(2)+','+(185-p[key]/max*145).toFixed(2)).join(' ');
 return <figure style={{margin:'16px 0',padding:12,border:'1px solid #444',borderRadius:8}}>
  <svg viewBox="0 0 560 220" role="img" aria-label={english?'Measured dyno points, separate power and torque scales':'Punkty hamowni, osobne skale mocy i momentu'} style={{display:'block',width:'100%',maxWidth:800}}>
   {[0,1,2,3,4].map(i=><g key={i}><line x1="44" x2="516" y1={185-i*145/4} y2={185-i*145/4} stroke="currentColor" opacity=".15"/><text x="39" y={189-i*145/4} textAnchor="end" fill="#ed4561" fontSize="10">{Math.round(pMax*i/4)}</text><text x="521" y={189-i*145/4} fill="#439be1" fontSize="10">{Math.round(tMax*i/4)}</text><text x={44+i*118} y="203" textAnchor="middle" fill="currentColor" fontSize="10">{Math.round(lo+(hi-lo)*i/4)}</text></g>)}
   <text x="44" y="23" fill="#ed4561" fontSize="12">{english?'Power (PS)':'Moc (KM)'}</text><text x="516" y="23" textAnchor="end" fill="#439be1" fontSize="12">{english?'Torque (Nm)':'Moment (Nm)'}</text>
   <polyline points={line('powerPs',pMax)} fill="none" stroke="#ed4561" strokeWidth="2.3"/><polyline points={line('torqueNm',tMax)} fill="none" stroke="#439be1" strokeWidth="2.3"/>
  </svg>
  <figcaption style={{fontSize:12}}>{english?'Imported points joined by straight lines. Separate scales; sampled maxima, not inferred peaks.':'Importowane punkty połączone odcinkami. Osobne skale; maksima z próbek, bez szacowania szczytów.'}</figcaption>
 </figure>;
}
