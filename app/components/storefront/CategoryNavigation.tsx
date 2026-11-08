'use client';
import type {Dispatch,SetStateAction} from 'react';
import {ArrowRight,ChevronRight,Menu,X} from 'lucide-react';
import {FMIC_CATEGORY_TREE} from '../../fmic-categories';

export type CategoryNavigationProps={
 mobileMenu:boolean;
 setMobileMenu:Dispatch<SetStateAction<boolean>>;
 activeFmicRoot:number|null;
 setActiveFmicRoot:Dispatch<SetStateAction<number|null>>;
 activeFmicSub:number|null;
 setActiveFmicSub:Dispatch<SetStateAction<number|null>>;
 onOpenCatalogPath:(names:string[])=>void;
 onMotoLab:()=>void;
};

/** Desktop three-level hover menu and mobile category drawer. */
export default function CategoryNavigation({
 mobileMenu,setMobileMenu,activeFmicRoot,setActiveFmicRoot,activeFmicSub,
 setActiveFmicSub,onOpenCatalogPath,onMotoLab
}:CategoryNavigationProps){
 return (
  <>
 <nav className="rpm-desktop-categories" aria-label="Kategorie produktów">
 {FMIC_CATEGORY_TREE.map((root,i)=><div key={root.name} className={'rpm-desktop-root'+(activeFmicRoot===i?' active':'')} onMouseEnter={()=>{setActiveFmicRoot(i);setActiveFmicSub(null)}} onMouseLeave={()=>{setActiveFmicRoot(null);setActiveFmicSub(null)}}>
 <button type="button" className="rpm-desktop-root-button" onClick={()=>onOpenCatalogPath([root.name])}>{root.name}</button>
 {activeFmicRoot===i&&<div className="rpm-desktop-level2">
 {root.children.map((sub,j)=><div className="rpm-desktop-sub" key={j} onMouseEnter={()=>setActiveFmicSub(j)}>
 <button type="button" onClick={()=>onOpenCatalogPath([root.name,sub.name])}>{sub.name}{sub.children.length>0&&<ChevronRight size={14}/>}</button>
 {activeFmicSub===j&&sub.children.length>0&&<div className="rpm-desktop-level3">{sub.children.map((leaf,k)=><button type="button" key={k} onClick={()=>onOpenCatalogPath([root.name,sub.name,leaf.name])}>{leaf.name}</button>)}</div>}
 </div>)}
 </div>}</div>)}
 <button type="button" className="rpm-desktop-motolab" onClick={onMotoLab}>MOTOLAB <ArrowRight size={14}/></button>
 </nav>
 <nav className="rpm-clean-nav" aria-label="Nawigacja sklepu">
 <button type="button" className="rpm-clean-categories-button" aria-expanded={mobileMenu} aria-controls="rpm-category-drawer" onClick={()=>{setMobileMenu(v=>!v);setActiveFmicRoot(null);setActiveFmicSub(null)}}>{mobileMenu?<X size={19}/>:<Menu size={19}/>} <span>KATEGORIE PRODUKTÓW</span> <ChevronRight size={15}/></button>
 <button type="button" className="rpm-clean-motolab" onClick={onMotoLab}>MOTOLAB <ArrowRight size={16}/></button>
 </nav>
 {mobileMenu&&<div className="rpm-drawer-backdrop" onClick={()=>setMobileMenu(false)} aria-hidden="true"/>}
 <aside id="rpm-category-drawer" className={'rpm-category-drawer'+(mobileMenu?' is-open':'')} aria-label="Kategorie produktów" aria-hidden={!mobileMenu}>
 <div className="rpm-drawer-head"><div className="rpm-drawer-heading"><span className="rpm-drawer-eyebrow">RPM CUSTOM / SKLEP</span><strong>Kategorie produktów</strong></div><button type="button" onClick={()=>setMobileMenu(false)} aria-label="Zamknij kategorie"><X size={22}/></button></div><div className="rpm-drawer-hint">Wybierz dział lub rozwiń strzałką podkategorie</div>
 <div className="rpm-drawer-scroll">
 {FMIC_CATEGORY_TREE.map((root,i)=><div key={root.name} className={"rpm-drawer-root"+(activeFmicRoot===i?" is-active":"")}>
 <div className="rpm-drawer-root-line"><button type="button" onClick={()=>onOpenCatalogPath([root.name])}>{root.name}</button><button type="button" className="rpm-drawer-expand" aria-label={'Rozwiń '+root.name} aria-expanded={activeFmicRoot===i} onClick={()=>{setActiveFmicRoot(activeFmicRoot===i?null:i);setActiveFmicSub(null)}}><ChevronRight size={18}/></button></div>
 {activeFmicRoot===i&&<div className="rpm-drawer-subs">{root.children.map((sub,j)=><div key={j} className={"rpm-drawer-sub"+(activeFmicSub===j?" is-active":"")}><div className="rpm-drawer-sub-line"><button type="button" onClick={()=>onOpenCatalogPath([root.name,sub.name])}>{sub.name}</button>{sub.children.length>0&&<button type="button" className="rpm-drawer-expand" aria-label={'Rozwiń '+sub.name} aria-expanded={activeFmicSub===j} onClick={()=>setActiveFmicSub(activeFmicSub===j?null:j)}><ChevronRight size={16}/></button>}</div>{activeFmicSub===j&&sub.children.length>0&&<div className="rpm-drawer-leaves">{sub.children.map((leaf,k)=><button type="button" key={k} onClick={()=>onOpenCatalogPath([root.name,sub.name,leaf.name])}>{leaf.name}</button>)}</div>}</div>)}</div>}
 </div>)}
 </div></aside>
  </>
 );
}
