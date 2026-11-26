'use client';
import {useEffect,useId,useState} from 'react';
import './logo-laser.css';
// Outline approximates the exterior of the original 2048 × 701 RPM artwork.
const outline='M195 30H1290C1386 30 1463 85 1463 160V193L1567 289L1840 34H2021V666H1845V242L1567 503L1442 387C1410 429 1355 454 1288 454V666H1113V454H829V662H655V454H424L200 662H20V614L195 454C94 454 20 399 20 325V160C20 83 93 30 195 30Z';
export function LogoLaser(){
 const id=useId().replace(/[^a-zA-Z0-9_-]/g,'');
 return <svg className="rpm-logo-laser" viewBox="0 0 2048 701" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <defs><filter id={id+'-glow'} x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="22"/></filter></defs>
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
   <path className="rpm-laser-glow" d={outline} pathLength={1000} stroke="#ff0026" strokeWidth={70} filter={'url(#'+id+'-glow)'}/>
   <path className="rpm-laser-tail" d={outline} pathLength={1000} stroke="#ff1333" strokeWidth={25}/>
   <path className="rpm-laser-hot" d={outline} pathLength={1000} stroke="#ff6a53" strokeWidth={12}/>
   <path className="rpm-laser-tip" d={outline} pathLength={1000} stroke="#fff3db" strokeWidth={29}/>
  </g>
  <g className="rpm-laser-sparks">
   <animateMotion dur="10s" repeatCount="indefinite" path={outline} keyPoints="0;1;1" keyTimes="0;0.45;1" calcMode="linear"/>
   <circle r="32" fill="#ff1633" filter={'url(#'+id+'-glow)'}/>
   <circle r="15" fill="#fff5d8"/>
   {[0,1,2,3,4].map((n)=><g key={n} transform={'rotate('+(n*72+16)+')'}><path className="rpm-laser-spark" style={{animationDelay:(n*.045)+'s'}} d="M22 0L62 0" stroke={n%2?'#ffb45b':'#ff522f'} strokeWidth={7} strokeLinecap="round"/></g>)}
  </g>
 </svg>;
}
export default function HeaderLogo({onHome}:{onHome:()=>void}){
 const [enabled,setEnabled]=useState(false);
 const [cycle,setCycle]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/settings/appearance',{cache:'no-store',signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error('Appearance unavailable');const d=await r.json();if(!controller.signal.aborted)setEnabled(d.appearance?.logoLaserEnabled===true)})
   .catch(()=>{if(!controller.signal.aborted)setEnabled(false)});
  return()=>controller.abort();
 },[]);
 return <button className="logo rpm-header-logo rpm-laser-logo-button" onClick={onHome} onPointerEnter={e=>{if(enabled&&e.pointerType==='mouse')setCycle(c=>c+1)}} aria-label="RPM Custom — strona główna"><img src="/optimized/logo.webp" width={1024} height={350} alt="RPM Custom — Exhaust & Intake Solutions" className="brand-logo"/>{enabled&&<LogoLaser key={cycle}/>}</button>;
}
