'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Wrench,Gauge,Database,Search,BrainCircuit,ExternalLink} from 'lucide-react';
import GuideRecommendations from './GuideRecommendations';
import DynoAdmin from '../../motolab-dyno/DynoAdmin';
import {EngineDatabasePanel,TechnicalResearchPanel,PowerBuilderPanel} from './KnowledgePanels';
import './workspace.css';
const tabs=[
 {id:'research',label:'Research',icon:Search},
 {id:'engines',label:'Baza silników',icon:Database},
 {id:'dyno',label:'Hamownia',icon:Gauge},
 {id:'recommendations',label:'Rekomendacje',icon:Wrench},
 {id:'builder',label:'Status AI',icon:BrainCircuit}
] as const;
type TabId=typeof tabs[number]['id'];
export default function PowerGuidesWorkspace({initialTab}:{initialTab:string}){
 const initial=tabs.find(t=>t.id===initialTab)?.id??'engines';
 const [active,setActive]=useState<TabId>(initial);
 const [visited,setVisited]=useState<TabId[]>([initial]);
 function choose(id:TabId){setActive(id);setVisited(old=>old.includes(id)?old:[...old,id]);const url=new URL(window.location.href);url.searchParams.set('tab',id);window.history.replaceState(window.history.state,'',url);}
 return <main className="admin-page rpm-settings-page rpm-power-admin-workspace">
  <div className="admin-top"><div><span className="eyebrow">RPM CUSTOM / MOTOLAB</span><h1>POWER GUIDES</h1><p>Research → weryfikacja → rekomendacje.</p></div><Link href="/power-guides" className="outline" target="_blank" rel="noopener noreferrer">Podgląd konfiguratora <ExternalLink size={16}/></Link></div>
  <nav className="rpm-power-admin-tabs" aria-label="Moduły Power Guides">{tabs.filter(t=>t.id!=='builder'||active==='builder').map(({id,label,icon:Icon})=><button type="button" key={id} aria-pressed={active===id} className={active===id?'active':''} onClick={()=>choose(id)}><Icon size={20}/><span><strong>{label}</strong></span></button>)}</nav>
  <div className="rpm-power-admin-panels">
   {visited.includes('recommendations')&&<div hidden={active!=='recommendations'}><GuideRecommendations/></div>}
   {visited.includes('engines')&&<div hidden={active!=='engines'}><EngineDatabasePanel/></div>}
   {visited.includes('research')&&<div hidden={active!=='research'}><TechnicalResearchPanel/><details className="rpm-power-fold rpm-settings-card"><summary>Status i możliwości AI</summary><PowerBuilderPanel/></details></div>}
   {visited.includes('dyno')&&<div hidden={active!=='dyno'}><DynoAdmin/></div>}
   {visited.includes('builder')&&<div hidden={active!=='builder'}><PowerBuilderPanel/></div>}
  </div>
 </main>;
}
