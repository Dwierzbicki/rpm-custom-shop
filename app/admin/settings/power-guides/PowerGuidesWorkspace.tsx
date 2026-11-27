'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Wrench,Gauge,Database,Search,BrainCircuit,ExternalLink} from 'lucide-react';
import GuideRecommendations from './GuideRecommendations';
import DynoAdmin from '../../motolab-dyno/DynoAdmin';
import {EngineDatabasePanel,TechnicalResearchPanel,PowerBuilderPanel} from './KnowledgePanels';
import './workspace.css';
const tabs=[
 {id:'recommendations',label:'Rekomendacje i ceny',icon:Wrench,detail:'Ręczne rekomendacje i powiązania katalogu'},
 {id:'engines',label:'Engine Database',icon:Database,detail:'Wersje silników i zakresy projektowe'},
 {id:'research',label:'Technical Research',icon:Search,detail:'SKU, dane producentów i źródła'},
 {id:'dyno',label:'Dyno Intelligence',icon:Gauge,detail:'Konfiguracje, wykresy i pomiary'},
 {id:'builder',label:'Power Builder AI',icon:BrainCircuit,detail:'Reguły, selektory i status rozwoju'}
] as const;
type TabId=typeof tabs[number]['id'];
export default function PowerGuidesWorkspace({initialTab}:{initialTab:string}){
 const initial=tabs.find(t=>t.id===initialTab)?.id??'recommendations';
 const [active,setActive]=useState<TabId>(initial);
 const [visited,setVisited]=useState<TabId[]>([initial]);
 function choose(id:TabId){setActive(id);setVisited(old=>old.includes(id)?old:[...old,id]);}
 return <main className="admin-page rpm-settings-page rpm-power-admin-workspace">
  <div className="admin-top"><div><Link href="/admin/settings" className="admin-back">← Ustawienia sklepu</Link><span className="eyebrow">RPM CUSTOM / MOTOLAB</span><h1>POWER GUIDES</h1><p>Jedno centrum zarządzania konfiguracjami, wiedzą techniczną i pomiarami hamowni.</p></div><Link href="/power-guides" className="outline" target="_blank" rel="noopener noreferrer">Podgląd konfiguratora <ExternalLink size={16}/></Link></div>
  <nav className="rpm-power-admin-tabs" aria-label="Moduły Power Guides">{tabs.map(({id,label,icon:Icon,detail})=><button type="button" key={id} aria-pressed={active===id} className={active===id?'active':''} onClick={()=>choose(id)}><Icon size={20}/><span><strong>{label}</strong><small>{detail}</small></span></button>)}</nav>
  <div className="rpm-power-admin-panels">
   {visited.includes('recommendations')&&<div hidden={active!=='recommendations'}><GuideRecommendations/></div>}
   {visited.includes('engines')&&<div hidden={active!=='engines'}><EngineDatabasePanel/></div>}
   {visited.includes('research')&&<div hidden={active!=='research'}><TechnicalResearchPanel/></div>}
   {visited.includes('dyno')&&<div hidden={active!=='dyno'}><DynoAdmin/></div>}
   {visited.includes('builder')&&<div hidden={active!=='builder'}><PowerBuilderPanel/></div>}
  </div>
 </main>;
}
