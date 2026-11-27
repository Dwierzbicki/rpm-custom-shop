'use client';
import {Check,ChevronRight} from 'lucide-react';
import {proposeBuildTier,type BuildProfile,type BuildTier} from '../../lib/power-build-profile';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
export default function PowerBuildTier({profile,tier,onTier}:{profile:BuildProfile;tier:string;onTier:(tier:BuildTier)=>void}){
 const {lang}=useStorefrontLanguage();const tr=(pl:string,en:string)=>lang==='en'?en:pl;
 const proposed=proposeBuildTier(profile);
 const options:{id:BuildTier;name:string;desc:string}[]=[
 {id:'budget',name:'Budget',desc:tr('Priorytet kosztów przy zachowaniu wymagań technicznych.','Cost-conscious without overlooking technical requirements.')},
 {id:'recommended',name:'Smart',desc:tr('Balans kosztów, osiągów i rezerwy wydajności.','Balance of cost, performance and headroom.')},
 {id:'premium',name:'Premium',desc:tr('Większa rezerwa wydajności i termiczna — do potwierdzenia doborem części.','Greater performance and thermal headroom — subject to component selection.')}];
 return <section className="rpm-build-preferences rpm-build-tier-result" aria-label={tr('Proponowany wariant','Proposed build tier')}>
 <header><span className="eyebrow">RPM CUSTOM / BUILD STRATEGY</span><h2>{tr('Proponowany wariant projektu','Proposed build tier')}</h2><p>{proposed==='budget'?tr('Wybrana charakterystyka stawia na stosunek ceny do osiągów — Budget to wstępna propozycja.','Your selected characteristics prioritize price/performance — Budget is the preliminary suggestion.'):tr('Smart to wstępny punkt wyjścia dla podanych wymagań.','Smart is the preliminary starting point for the submitted requirements.')}</p></header>
 <p>{tr('To propozycja według preferencji, nie wynik porównania pełnych zestawów. Budżet sprawdzamy na podstawie wycenionych części. Dla obsługiwanych scenariuszy zestawy różnią się doborem części i regułami zgodności.','This is a preference-based suggestion, not a comparison of complete builds. Budget is checked against priced items. Supported scenarios use different component selections and compatibility rules.')}</p>
 <div className="rpm-builder-options rpm-builder-tiers">{options.map(option=><button type="button" key={option.id} aria-pressed={tier===option.id} onClick={()=>onTier(option.id)}><small>{option.id===proposed?tr('Wstępnie proponowany','Preliminary suggestion'):tr('Alternatywa','Alternative')}</small><strong>{option.name}</strong><span>{option.desc}</span>{tier===option.id?<Check size={17}/>:<ChevronRight size={17}/>}</button>)}</div>
 </section>;
}
