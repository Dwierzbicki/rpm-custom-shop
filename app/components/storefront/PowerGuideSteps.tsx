'use client';
import {useState} from 'react';
import {Check,ChevronRight,ArrowLeft} from 'lucide-react';
import {POWER_ENGINES,powerRangesFor,approvedPowerRange,rangeForPower} from '../../lib/storefront-config';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
type Props={engine:string;version:string;range:number;targetPower:number|null;usage:string;onEngine:(v:string)=>void;onVersion:(v:string)=>void;onPower:(power:number,range:number)=>void;onUsage:(v:string)=>void};
export default function PowerGuideSteps({engine,version,range,targetPower,usage,onEngine,onVersion,onPower,onUsage}:Props){
 const {lang}=useStorefrontLanguage();const tr=(pl:string,en:string)=>lang==='en'?en:pl;
 const family=POWER_ENGINES.find(e=>e.id===engine);
 const validVersion=family?.versions.some(v=>v.id===version);
 const ranges=powerRangesFor(version);
 const next=!family?0:!validVersion?1:!ranges[range]?2:!usage?3:4;
 const [editing,setEditing]=useState<number|null>(null);
 const step=editing===null?next:Math.min(editing,next);
 const labels=[tr('Rodzina','Family'),tr('Wersja','Version'),tr('Moc','Power'),tr('Przeznaczenie','Use case')];
 const values=[family?.id.toUpperCase(),validVersion?family?.versions.find(v=>v.id===version)?.name:null,ranges[range]&&targetPower!==null?targetPower+' '+tr('KM','PS'):null,usage?.toUpperCase()];
 const choose=(action:()=>void)=>{action();setEditing(null)};
 return <section className="rpm-builder-wizard" aria-label={tr('Konfiguracja silnika','Engine configuration')}><nav className="rpm-builder-progress" aria-label={tr('Etapy konfiguracji','Configuration steps')}>{labels.map((label,i)=><button type="button" key={i} disabled={i>next} className={i===step?'current':i<next?'complete':''} aria-current={i===step?'step':undefined} onClick={()=>setEditing(i)}><span>{i<next?<Check size={15}/>:i+1}</span><div><small>{label}</small><strong>{values[i]||'—'}</strong></div></button>)}</nav>{step<4?<div className="rpm-builder-panel"><div className="rpm-builder-panel-head"><span className="eyebrow">0{step+1} / 04</span><h2>{[tr('Wybierz rodzinę silnika','Choose an engine family'),tr('Wybierz wersję silnika','Choose an engine variant'),tr('Jaki jest Twój cel mocy?','What is your power target?'),tr('Do czego budujesz auto?','What is the car built for?')][step]}</h2></div>
 {step===0&&<div className="rpm-builder-options">{POWER_ENGINES.map(e=><button type="button" key={e.id} aria-pressed={engine===e.id} onClick={()=>choose(()=>onEngine(e.id))}><small>{e.make}</small><strong>{e.id.toUpperCase()}</strong><span>{e.subtitle}</span><ChevronRight size={17}/></button>)}</div>}
 {step===1&&<div className="rpm-builder-options">{family?.versions.map(v=><button type="button" key={v.id} aria-pressed={version===v.id} onClick={()=>choose(()=>onVersion(v.id))}><strong>{v.name}</strong><span>{v.id==='m50b30-stroker'?tr('Blok M50 + wał B30 / konfiguracja własna','M50 block + B30 crank / custom build'):v.detail.replace('wolnossący',tr('wolnossący','naturally aspirated')).replace('fabrycznie turbo',tr('fabrycznie turbo','factory turbo'))}</span><ChevronRight size={17}/></button>)}</div>}
 {step===2&&<><p className="rpm-guide-helper">{tr("Zakresy projektowe MotoLab, nie limity seryjnych podzespołów.","MotoLab project bands, not stock component limits.")} {!approvedPowerRange(version)&&tr("Zakres wstępny, do zatwierdzenia.","Provisional range, pending approval.")}</p><PowerTargetSlider key={version} version={version} targetPower={targetPower} onConfirm={(power,index)=>choose(()=>onPower(power,index))}/></>}
 {step===3&&<div className="rpm-builder-options">{[{id:'street',name:tr('Ulica','Street'),desc:tr('Codzienna jazda','Daily driving')},{id:'drift',name:'Drift',desc:tr('Kontrolowany poślizg','Controlled sliding')},{id:'track',name:tr('Tor','Track'),desc:tr('Jazda torowa','Circuit driving')}].map(v=><button type="button" key={v.id} aria-pressed={usage===v.id} onClick={()=>choose(()=>onUsage(v.id))}><strong>{v.name}</strong><span>{v.desc}</span><ChevronRight size={17}/></button>)}</div>}
 {step>0&&<button type="button" className="outline rpm-builder-prev" onClick={()=>setEditing(step-1)}><ArrowLeft size={15}/>{tr('Poprzedni krok','Previous step')}</button>}</div>:<div className="rpm-builder-completed"><Check size={20}/>{tr('Silnik i zastosowanie wybrane. Uzupełnij parametry techniczne poniżej.','Engine and use case selected. Complete the technical parameters below.')}</div>}</section>
}

function PowerTargetSlider({version,targetPower,onConfirm}:{version:string;targetPower:number|null;onConfirm:(power:number,range:number)=>void}){
 const {lang}=useStorefrontLanguage();const tr=(pl:string,en:string)=>lang==='en'?en:pl;
 const ranges=powerRangesFor(version),min=ranges[0]?.min??250,max=ranges.at(-1)?.max??250;
 const [power,setPower]=useState(targetPower!==null&&rangeForPower(version,targetPower)>=0?targetPower:min);
 const index=rangeForPower(version,power),band=ranges[index];
 const change=(value:number)=>setPower(Math.max(min,Math.min(max,value)));
 const percent=max>min?(power-min)/(max-min)*100:0;
 return <div className="rpm-power-slider">
 <label htmlFor="rpm-target-power" className="rpm-power-slider-label">{tr('Moc docelowa na silniku','Target crankshaft power')}</label>
 <div className="rpm-power-slider-value"><button className="outline" type="button" aria-label={tr('Zmniejsz moc o 10 KM','Decrease power by 10 PS')} disabled={power<=min} onClick={()=>change(power-10)}>−</button><output htmlFor="rpm-target-power">{power}<small>{tr('KM','PS')}</small></output><button type="button" className="outline" aria-label={tr('Zwiększ moc o 10 KM','Increase power by 10 PS')} disabled={power>=max} onClick={()=>change(power+10)}>+</button></div>
 <input id="rpm-target-power" type="range" min={min} max={max} step={10} value={power} aria-valuetext={power+' '+tr('KM','PS')} onChange={e=>change(Number(e.target.value))} style={{background:`linear-gradient(to right,var(--rpm-color-accent) ${percent}%,var(--rpm-color-panel-border) ${percent}%)`}}/>
 <div className="rpm-power-slider-bounds"><span>{min} {tr('KM','PS')}</span><span>{max} {tr('KM','PS')}</span></div>
 <p className="rpm-power-slider-band">{tr('Przedział doboru części','Component selection band')}: <strong>{band?band.min+'–'+band.max+' '+tr('KM','PS'):'—'}</strong></p>
 <button type="button" className="primary rpm-power-slider-confirm" disabled={index<0} onClick={()=>onConfirm(power,index)}>{tr('Dalej','Continue')} <ChevronRight size={18}/></button>
 </div>;
}
