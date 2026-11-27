'use client';
import {useState} from 'react';
import {Settings2,ArrowRight} from 'lucide-react';
import {validBuildProfile,type BuildProfile} from '../../lib/power-build-profile';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
export default function PowerBuildPreferences({onApply}:{onApply:(profile:BuildProfile)=>void}){
 const {lang}=useStorefrontLanguage();const tr=(pl:string,en:string)=>lang==='en'?en:pl;
 const [fuel,setFuel]=useState(''),[internals,setInternals]=useState(''),[priority,setPriority]=useState(''),[budget,setBudget]=useState('');
 const profile={induction:'turbo',fuel,internals,priority,budgetPln:budget==='none'?null:budget?Number(budget):undefined};
 return <form className="rpm-build-preferences" onSubmit={e=>{e.preventDefault();if(validBuildProfile(profile))onApply(profile)}}>
  <header><span className="eyebrow">RPM CUSTOM / PROJECT PARAMETERS</span><h2><Settings2 size={22}/> {tr('Parametry techniczne projektu','Technical project parameters')}</h2><p>{tr('Uzupełnij wymagania przed doborem części. Na tym etapie pracujemy na istniejących regułach i katalogu, bez aktywnego AI.','Complete the requirements before selecting parts. This stage uses existing rules and catalogue data; AI is not active yet.')}</p></header>
  <div className="rpm-build-preferences-grid">
   <label>{tr('Typ modyfikacji','Induction')}<select value="turbo" onChange={()=>{}}><option value="turbo">Turbo</option><option disabled value="na">{tr('Wolnossący — w przygotowaniu','Naturally aspirated — planned')}</option><option disabled value="supercharger">{tr('Kompresor — w przygotowaniu','Supercharger — planned')}</option></select></label>
   <label>{tr('Paliwo','Fuel')}<select required value={fuel} onChange={e=>setFuel(e.target.value)}><option value="">{tr('Wybierz paliwo','Choose fuel')}</option><option value="pb95">PB95</option><option value="pb98">PB98 / PB100</option><option value="e85">E85</option><option value="flex">Flex Fuel</option></select></label>
   <label>{tr('Wnętrze silnika','Engine internals')}<select required value={internals} onChange={e=>setInternals(e.target.value)}><option value="">{tr('Wybierz preferencję','Choose preference')}</option><option value="stock">{tr('Seryjne — wymaga oceny','Stock — requires assessment')}</option><option value="forged">{tr('Kute tłoki i korbowody','Forged pistons and rods')}</option><option value="auto">{tr('Dobór na podstawie analizy','Choose after assessment')}</option></select></label>
   <label>{tr('Priorytet projektu','Build priority')}<select required value={priority} onChange={e=>setPriority(e.target.value)}><option value="">{tr('Wybierz priorytet','Choose priority')}</option><option value="response">{tr('Szybka reakcja turbo','Fast turbo response')}</option><option value="power">{tr('Maksymalna moc','Maximum power')}</option><option value="reliability">{tr('Trwałość','Durability')}</option><option value="cost">{tr('Cena / osiągi','Price / performance')}</option><option value="balanced">{tr('Zbalansowana konfiguracja','Balanced build')}</option></select></label>
   <label>{tr('Budżet na części','Parts budget')}<select required value={budget} onChange={e=>setBudget(e.target.value)}><option value="">{tr('Wybierz budżet','Choose budget')}</option>{[5000,10000,15000,20000,25000,30000,40000,50000,75000,100000,150000].map(n=><option key={n} value={n}>{n.toLocaleString(lang==='en'?'en-GB':'pl-PL')} PLN</option>)}<option value="none">{tr('Bez ustalonego limitu','No fixed limit')}</option></select></label>
  </div>
  <p>{tr('Budżet jest porównywany z sumą wybranych produktów. Priorytet i wnętrze silnika są wymaganiami projektu, a nie automatycznym potwierdzeniem doboru.','Budget is compared with the selected product subtotal. Priority and internals are project requirements, not automatic compatibility approval.')}</p>
  <button className="primary" type="submit" disabled={!validBuildProfile(profile)}>{tr('Przygotuj konfigurację','Prepare configuration')} <ArrowRight size={17}/></button>
 </form>;
}
