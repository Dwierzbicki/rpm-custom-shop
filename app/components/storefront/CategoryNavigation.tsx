'use client';
import {useEffect,useRef} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import {ArrowRight,ChevronRight,Menu,Truck,X} from 'lucide-react';
import styles from './road-assistance-navigation.module.css';
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
 productsOnly?:boolean;
};

const shortLabels:Record<string,string>={'Układ dolotowy':'Dolot','Układ chłodzenia':'Chłodzenie','Układ paliwowy':'Paliwo','Układ wydechowy':'Wydech','Wyposażenie wnętrza i kierowcy':'Wnętrze i kierowca'};

const categoryIcons:Record<string,string>={"Układ dolotowy":"intake","Układ chłodzenia":"cooling","Układ paliwowy":"fuel","Układ wydechowy":"exhaust","Hamulce i koła":"brakes","Napęd i zawieszenie":"drivetrain","Silnik i turbo":"turbo","Elektronika":"ecu","Wyposażenie wnętrza i kierowcy":"seat","Detailing":"detail","Pozostałe":"other"};
function CategoryIcon({name}:{name:string}){
 const url='url(/category-icons/'+(categoryIcons[name]??'other')+'.svg)';
 return <span className="rpm-nav-pictogram" aria-hidden="true" style={{maskImage:url,WebkitMaskImage:url}}/>;
}

/** Desktop three-level hover menu and mobile category drawer. */
export default function CategoryNavigation({
 mobileMenu,setMobileMenu,activeFmicRoot,setActiveFmicRoot,activeFmicSub,
 setActiveFmicSub,onOpenCatalogPath,onMotoLab,productsOnly=false
}:CategoryNavigationProps){
 const navRef=useRef<HTMLElement>(null);
 function positionPanel(i:number){
  const root=navRef.current?.querySelectorAll<HTMLElement>('.rpm-desktop-root')[i];
  if(!root)return;
  const bounds=root.getBoundingClientRect();
  const viewport=document.documentElement.clientWidth;
  const right=viewport-bounds.left, left=bounds.right;
  const reverse=right<580&&left>right;
  root.dataset.cascadeSide=reverse?'left':'right';
  root.style.setProperty('--rpm-cascade-width',Math.max(0,Math.min(580,(reverse?left:right)-4))+'px');
  root.style.setProperty('--rpm-cascade-height',Math.max(96,window.innerHeight-bounds.bottom-12)+'px');
 }
 useEffect(()=>{
  if(activeFmicRoot===null||mobileMenu)return;
  const nav=navRef.current;
  if(!nav)return;
  const update=()=>positionPanel(activeFmicRoot);
  update();
  const observer=new ResizeObserver(update);
  observer.observe(nav);
  nav.querySelectorAll('.rpm-desktop-root-button').forEach(el=>observer.observe(el));
  window.addEventListener('resize',update);
  return()=>{observer.disconnect();window.removeEventListener('resize',update)};
 },[activeFmicRoot,mobileMenu]);
 const closeDesktop=()=>{setActiveFmicRoot(null);setActiveFmicSub(null)};
 const openDesktop=(i:number)=>{positionPanel(i);setActiveFmicRoot(i);setActiveFmicSub(null)};
 const navigate=(names:string[])=>{closeDesktop();onOpenCatalogPath(names)};
 return (
  <>
 <nav ref={navRef} className="rpm-desktop-categories rpm-classic-navigation" aria-label="Kategorie produktów">
 {FMIC_CATEGORY_TREE.map((root,i)=>{
 const isOpen=activeFmicRoot===i&&!mobileMenu;
 const selected=activeFmicSub===null?undefined:root.children[activeFmicSub];
 return <div key={root.name} className={'rpm-desktop-root'+(isOpen?' active':'')}
 onMouseEnter={()=>{if(!isOpen)openDesktop(i)}}
 onMouseLeave={e=>{if(!e.currentTarget.querySelector('.rpm-cascade-panel')?.contains(document.activeElement))closeDesktop()}}
 onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))closeDesktop()}}
 onKeyDown={e=>{if(e.key==='Escape'&&isOpen){e.preventDefault();e.currentTarget.querySelector<HTMLButtonElement>('.rpm-desktop-root-button')?.focus();closeDesktop()}}}>
 <button type="button" className="rpm-desktop-root-button" title={root.name}
 aria-expanded={isOpen} aria-controls={isOpen?'rpm-cascade-'+i:undefined}
 onFocus={()=>{if(!isOpen)openDesktop(i)}} onClick={()=>navigate([root.name])}
 onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();if(!isOpen)openDesktop(i);requestAnimationFrame(()=>navRef.current?.querySelector<HTMLButtonElement>('#rpm-cascade-'+i+' .rpm-cascade-group')?.focus())}}}>
 <span className="rpm-nav-category-label">{productsOnly?(shortLabels[root.name]??root.name):root.name}</span>
 </button>
 {isOpen&&<div className="rpm-cascade-panel" id={'rpm-cascade-'+i}>
 <div className="rpm-cascade-groups" aria-label="Podkategorie">
 {root.children.map((sub,j)=><button key={sub.name} type="button" className={'rpm-cascade-group'+(activeFmicSub===j?' is-selected':'')}
 aria-expanded={sub.children.length?activeFmicSub===j:undefined}
 onMouseEnter={()=>setActiveFmicSub(j)} onFocus={()=>setActiveFmicSub(j)}
 onKeyDown={e=>{if(e.key==='ArrowRight'&&sub.children.length){e.preventDefault();e.currentTarget.closest('.rpm-cascade-panel')?.querySelector<HTMLButtonElement>('.rpm-cascade-leaves button')?.focus()}}}
 onClick={()=>navigate([root.name,sub.name])}><span>{sub.name}</span>{sub.children.length>0&&<ChevronRight size={15} aria-hidden="true"/>}</button>)}
 </div>
 {selected&&selected.children.length>0&&<div className="rpm-cascade-leaves" key={selected.name} aria-label={selected.name}
 onKeyDown={e=>{if(e.key==='ArrowLeft'){e.preventDefault();e.currentTarget.closest('.rpm-cascade-panel')?.querySelector<HTMLButtonElement>('.rpm-cascade-group.is-selected')?.focus()}}}>
 {selected.children.map(leaf=><button type="button" key={leaf.name} onClick={()=>navigate([root.name,selected.name,leaf.name])}>{leaf.name}</button>)}
 </div>}
 </div>}</div>
 })}
 {!productsOnly&&<><button type="button" className="rpm-desktop-motolab" onClick={onMotoLab}>MOTOLAB <ArrowRight size={14}/></button>
 <a className={styles.desktopRoad} href="/autopomoc"><Truck size={15}/> AUTO POMOC</a></>}
 </nav>
 <nav className="rpm-clean-nav" aria-label="Nawigacja sklepu">
 <button type="button" className="rpm-clean-categories-button" aria-expanded={mobileMenu} aria-controls="rpm-category-drawer" onClick={()=>{setMobileMenu(v=>!v);setActiveFmicRoot(null);setActiveFmicSub(null)}}>{mobileMenu?<X size={19}/>:<Menu size={19}/>} <span>KATEGORIE PRODUKTÓW</span> <ChevronRight size={15}/></button>
 {!productsOnly&&<button type="button" className="rpm-clean-motolab" onClick={onMotoLab}>MOTOLAB <ArrowRight size={16}/></button>}
 </nav>
 {mobileMenu&&<div className="rpm-drawer-backdrop" onClick={()=>setMobileMenu(false)} aria-hidden="true"/>}
 <aside id="rpm-category-drawer" className={'rpm-category-drawer'+(mobileMenu?' is-open':'')} aria-label="Kategorie produktów" aria-hidden={!mobileMenu}>
 <div className="rpm-drawer-head"><div className="rpm-drawer-heading"><span className="rpm-drawer-eyebrow">RPM CUSTOM / SKLEP</span><strong>Kategorie produktów</strong></div><button type="button" onClick={()=>setMobileMenu(false)} aria-label="Zamknij kategorie"><X size={22}/></button></div><div className="rpm-drawer-hint">Wybierz dział lub rozwiń strzałką podkategorie</div>
 {!productsOnly&&<a className={styles.drawerRoad} href="/autopomoc"><Truck size={18}/> POMOC DROGOWA — WEZWIJ LAWETĘ <ArrowRight size={15}/></a>}
 <div className="rpm-drawer-scroll">
 {FMIC_CATEGORY_TREE.map((root,i)=><div key={root.name} className={"rpm-drawer-root"+(activeFmicRoot===i?" is-active":"")}>
 <div className="rpm-drawer-root-line"><button type="button" onClick={()=>onOpenCatalogPath([root.name])}><CategoryIcon name={root.name}/><span>{root.name}</span></button><button type="button" className="rpm-drawer-expand" aria-label={'Rozwiń '+root.name} aria-expanded={activeFmicRoot===i} onClick={()=>{setActiveFmicRoot(activeFmicRoot===i?null:i);setActiveFmicSub(null)}}><ChevronRight size={18}/></button></div>
 {activeFmicRoot===i&&<div className="rpm-drawer-subs">{root.children.map((sub,j)=><div key={j} className={"rpm-drawer-sub"+(activeFmicSub===j?" is-active":"")}><div className="rpm-drawer-sub-line"><button type="button" onClick={()=>onOpenCatalogPath([root.name,sub.name])}>{sub.name}</button>{sub.children.length>0&&<button type="button" className="rpm-drawer-expand" aria-label={'Rozwiń '+sub.name} aria-expanded={activeFmicSub===j} onClick={()=>setActiveFmicSub(activeFmicSub===j?null:j)}><ChevronRight size={16}/></button>}</div>{activeFmicSub===j&&sub.children.length>0&&<div className="rpm-drawer-leaves">{sub.children.map((leaf,k)=><button type="button" key={k} onClick={()=>onOpenCatalogPath([root.name,sub.name,leaf.name])}>{leaf.name}</button>)}</div>}</div>)}</div>}
 </div>)}
 </div></aside>
  </>
 );
}
