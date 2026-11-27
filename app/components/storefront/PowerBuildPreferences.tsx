'use client';
import {useState,useId,type ReactNode} from 'react';
import {ArrowRight,Check,Settings2,Droplets,Gauge,Wallet,Wind} from 'lucide-react';
import {validBuildProfile,rodOptionsFor,type BuildProfile} from '../../lib/power-build-profile';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
import './power-build-preferences.css';

type Choice={value:string;title:string;description?:string};
function Choices({name,value,onChange,options,label}:{name:string;value:string;onChange:(value:string)=>void;options:Choice[];label:string}){
 const uid=useId();
 return <div className="rpm-pref-choice-grid" role="group" aria-label={label}>{options.map(option=><label key={option.value} className={'rpm-pref-choice'+(value===option.value?' selected':'')}>
  <input type="radio" name={uid+'-'+name} value={option.value} checked={value===option.value} onChange={()=>onChange(option.value)} required/>
  <span className="rpm-pref-choice-content"><strong>{option.title}</strong>{option.description&&<small>{option.description}</small>}</span><span className="rpm-pref-radio-mark" aria-hidden="true">{value===option.value&&<Check size={13} strokeWidth={3}/>}</span>
 </label>)}</div>;
}
function PreferenceSection({number,title,description,icon,children}:{number:string;title:string;description?:string;icon:ReactNode;children:ReactNode}){
 return <section className="rpm-pref-section"><div className="rpm-pref-section-head"><div className="rpm-pref-section-icon">{icon}</div><div><span className="rpm-pref-step">STEP {number}</span><h3>{title}</h3>{description&&<p>{description}</p>}</div></div>{children}</section>;
}
export default function PowerBuildPreferences({version,onApply,onDraftChange}:{version:string;onApply:(profile:BuildProfile)=>void;onDraftChange:()=>void}){
 const {lang}=useStorefrontLanguage(),en=lang==='en';const tr=(pl:string,english:string)=>en?english:pl;
 const [fuel,setFuel]=useState(''),[internals,setInternals]=useState(''),[rods,setRods]=useState(''),[priority,setPriority]=useState(''),[budget,setBudget]=useState('');
 const [ethanolPercent,setEthanolPercent]=useState('');
 const budgetNumber=Number(budget);
 const budgetReady=budget==='none'||!!budget&&Number.isSafeInteger(budgetNumber)&&budgetNumber>=1000&&budgetNumber<=1000000;
 const ethanolNumber=Number(ethanolPercent);
 const fuelReady=!!fuel&&(fuel!=='ethanol'||Number.isSafeInteger(ethanolNumber)&&ethanolNumber>=1&&ethanolNumber<=100);
 const profile={...(fuel==='ethanol'?{ethanolPercent:ethanolPercent===''?undefined:ethanolNumber}:{}),induction:'turbo',fuel,internals,rods,priority,budgetPln:budget==='none'?null:budget?budgetNumber:undefined};
 const ready=validBuildProfile(profile,version);
 const completed=[fuelReady,!!internals,!!rods,!!priority,budgetReady].filter(Boolean).length;
 const chooseFuel=(value:string)=>{setFuel(value);setEthanolPercent('')};
 const chooseBudget=(value:string)=>{if(value!==budget){setBudget(value);onDraftChange()}};
 const rodLabels:Record<string,Choice>={
  stock:{value:'stock',title:tr('Seryjne','Stock'),description:tr('Ocena stanu i geometrii','Condition and geometry check')},
  forged:{value:'forged',title:tr('Kute','Forged'),description:tr('Dobór do projektu','Project-specific selection')},
  m50b25nv:{value:'m50b25nv',title:'M50B25 NV',description:tr('Hybryda OEM · do weryfikacji','OEM hybrid · verification required')},
  auto:{value:'auto',title:tr('Dobierz za mnie','Choose for me'),description:tr('Na podstawie dostępnych reguł','Using available rules')}
 };
 return <form className="rpm-build-preferences rpm-pref-studio" onChange={onDraftChange} onSubmit={e=>{e.preventDefault();if(validBuildProfile(profile,version))onApply(profile)}}>
  <header className="rpm-pref-header"><div><span className="eyebrow">RPM CUSTOM / PROJECT SETUP</span><h2><Settings2 size={23}/> {tr('Skonfiguruj swój projekt','Configure your build')}</h2><p>{tr('Określ założenia techniczne. Na tej podstawie przygotujemy zestaw części w trzech wariantach.','Set your technical requirements. We will prepare a parts selection in three tiers.')}</p></div><div className="rpm-pref-progress"><strong>{completed}/5</strong><small>{tr('Uzupełnione wybory','Selections completed')}</small><progress value={completed} max={5} aria-label={tr('Uzupełnione wybory','Selections completed')}/></div></header>
  <div className="rpm-pref-induction"><Wind size={20}/><div><strong>Turbo</strong><small>{tr('Typ modyfikacji','Induction type')}</small></div><span>{tr('Wolnossący i kompresor w przygotowaniu','Naturally aspirated and supercharger planned')}</span></div>
  <div className="rpm-pref-sections">
   <PreferenceSection number="01" title={tr('Paliwo','Fuel')} description={tr('Wybierz paliwo, na którym będzie strojony silnik.','Choose the fuel the engine will be tuned on.')} icon={<Droplets size={21}/>}>
    <Choices name="fuel" label={tr('Paliwo','Fuel')} value={fuel} onChange={chooseFuel} options={[
     {value:'pb95',title:'PB95'},{value:'pb98',title:'PB98'},{value:'pb100',title:'PB100'},
     {value:'ethanol',title:tr('Paliwo + Ethanol','Petrol + Ethanol'),description:tr('Własna mieszanka','Custom blend')},{value:'flex',title:'Flex Fuel',description:tr('Zmienna zawartość etanolu','Variable ethanol content')}
    ]}/>
    {fuel==='ethanol'&&<label className="rpm-pref-number">{tr('Końcowa zawartość etanolu (%)','Final ethanol content (%)')}<div><input type="number" min={1} max={100} step={1} required value={ethanolPercent} placeholder="50" onChange={e=>setEthanolPercent(e.target.value)}/><span>%</span></div><small>{tr('Np. 50% = E50.','E.g. 50% = E50.')}</small></label>}
   </PreferenceSection>
   <PreferenceSection number="02" title={tr('Konstrukcja silnika','Engine construction')} description={tr('Wybierz preferowane elementy dołu silnika.','Choose your preferred short-block components.')} icon={<Settings2 size={21}/>}>
    <div className="rpm-pref-internals">
     <div><h4>{tr('Tłoki','Pistons')}</h4><Choices name="pistons" label={tr('Tłoki','Pistons')} value={internals} onChange={setInternals} options={[
      {value:'stock',title:tr('Seryjne','Stock'),description:tr('Po ocenie stanu','After inspection')},{value:'forged',title:tr('Kute','Forged'),description:tr('Dobór do geometrii i CR','Match geometry and CR')},{value:'auto',title:tr('Dobierz za mnie','Choose for me'),description:tr('Według dostępnych reguł','Using available rules')}
     ]}/></div>
     <div><h4>{tr('Korbowody','Connecting rods')}</h4><Choices name="rods" label={tr('Korbowody','Connecting rods')} value={rods} onChange={setRods} options={rodOptionsFor(version).map(value=>rodLabels[value])}/></div>
    </div>
    {rods==='m50b25nv'&&<p className="rpm-pref-notice" role="status">{tr('M50B25 NV: sprawdź długość, sworzeń, stopę i geometrię układu korbowego. Wybór nie potwierdza zamienności.','M50B25 NV: verify length, pin, big end and crank assembly geometry. Selection does not confirm interchangeability.')}</p>}
   </PreferenceSection>
   <PreferenceSection number="03" title={tr('Charakterystyka silnika','Engine characteristics')} description={tr('Co jest dla Ciebie najważniejsze?','What matters most to you?')} icon={<Gauge size={21}/>}>
    <Choices name="priority" label={tr('Charakterystyka silnika','Engine characteristics')} value={priority} onChange={setPriority} options={[
     {value:'response',title:tr('Szybka reakcja turbo','Fast turbo response'),description:tr('Reakcja na gaz','Throttle response')},
     {value:'power',title:tr('Maksymalna moc','Maximum power'),description:tr('Priorytet osiągów','Performance priority')},
     {value:'reliability',title:tr('Trwałość','Durability'),description:tr('Priorytet rezerwy i ochrony','Headroom and protection')},
     {value:'cost',title:tr('Cena / osiągi','Price / performance'),description:tr('Priorytet kosztów','Cost priority')},
     {value:'balanced',title:tr('Zbalansowana konfiguracja','Balanced build'),description:tr('Kompromis wymagań','Balance of requirements')}
    ]}/>
   </PreferenceSection>
   <PreferenceSection number="04" title={tr('Budżet na części','Parts budget')} description={tr('Podaj własny limit lub wybierz szybki przedział.','Enter your own limit or choose a quick amount.')} icon={<Wallet size={21}/>}>
    <div className="rpm-pref-budget-presets">{[5000,10000,15000,20000,30000,50000].map(n=><button type="button" className={budget===String(n)?'selected':''} key={n} aria-pressed={budget===String(n)} onClick={()=>chooseBudget(String(n))}>{n.toLocaleString(en?'en-GB':'pl-PL')} zł</button>)}<button type="button" className={budget==='none'?'selected':''} aria-pressed={budget==='none'} onClick={()=>chooseBudget('none')}>{tr('Bez limitu','No limit')}</button></div>
    <label className="rpm-pref-number">{tr('Własny budżet','Custom budget')}<div><input type="number" min={1000} max={1000000} step={1} required={budget!=='none'} value={budget==='none'?'':budget} placeholder={budget==='none'?tr('Bez limitu','No limit'):'25000'} onChange={e=>setBudget(e.target.value)}/><span>PLN</span></div><small>{tr('Tylko części, bez robocizny i dostawy.','Parts only, excluding labour and delivery.')}</small></label>
   </PreferenceSection>
  </div>
  <footer className="rpm-pref-footer"><div><strong>{ready?tr('Projekt gotowy do analizy','Ready to analyse'):tr('Uzupełnij wszystkie wybory','Complete all selections')}</strong><p>{tr('Preferencje nie potwierdzają zgodności ani trwałości części. Budżet porównujemy z wycenionymi produktami.','Preferences do not establish compatibility or durability. Budget is compared with priced products.')}</p></div><button className="primary" type="submit" disabled={!ready}>{tr('Wygeneruj zestaw części','Generate parts selection')} <ArrowRight size={18}/></button></footer>
 </form>;
}
