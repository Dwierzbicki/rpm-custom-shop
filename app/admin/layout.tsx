'use client';
import '../styles/admin-local.css';
import '../styles/admin-workspace.css';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import {LayoutDashboard,Package,ShoppingBag,Mail,Menu,X,ExternalLink,Settings,LogOut,Wrench,Truck,Monitor,FileText,Users,ClipboardList,Percent,Link2,Layers,Image,ChevronDown,Box} from 'lucide-react';
import {ADMIN_GROUPS,activeAdminLink,adminPageLabel} from '../lib/admin-navigation';
const icons={dashboard:LayoutDashboard,orders:ShoppingBag,quotes:ClipboardList,products:Box,package:Package,variants:Layers,file:FileText,truck:Truck,percent:Percent,monitor:Monitor,wrench:Wrench,users:Users,settings:Settings,mail:Mail,link:Link2,image:Image};
export default function AdminLayout({children}:{children:React.ReactNode}){
 const path=usePathname(),active=activeAdminLink(path),pageLabel=adminPageLabel(path);
 const [open,setOpen]=useState(false),[toolsOpen,setToolsOpen]=useState(false);
 const onTool=ADMIN_GROUPS.some(g=>g.id==='tools'&&g.links.some(l=>l.href===active?.href));
 const expanded=toolsOpen||onTool;
 useEffect(()=>{setOpen(false)},[path]);
 useEffect(()=>{if(!open)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[open]);
 if(path==='/admin/login')return <>{children}</>;
 return <div className="rpm-admin-shell">
 <aside id="rpm-admin-navigation" className={'rpm-admin-nav '+(open?'is-open':'')}>
 <div className="rpm-admin-brand"><img className="rpm-admin-original-logo" src="/rpm-logo.png.png" alt="RPM Custom"/><small>PANEL ADMINISTRATORA</small><button className="rpm-admin-close" type="button" onClick={()=>setOpen(false)} aria-label="Zamknij menu"><X size={20}/></button></div>
 <nav aria-label="Nawigacja administratora">{ADMIN_GROUPS.map(group=><div className={'rpm-admin-nav-group rpm-admin-nav-group-'+group.id} key={group.id}>
 {group.id==='tools'?<button className="rpm-admin-group-toggle" type="button" aria-expanded={expanded} aria-controls="rpm-admin-tools" disabled={onTool} onClick={()=>setToolsOpen(v=>!v)}><span>{group.label}</span><ChevronDown size={14} className={expanded?'is-open':''}/></button>:group.label?<small>{group.label}</small>:null}
 <div className="rpm-admin-group-links" id={group.id==='tools'?'rpm-admin-tools':undefined} hidden={group.id==='tools'&&!expanded}>{group.links.map(({href,label,icon})=>{const Icon=icons[icon],selected=active?.href===href;return <Link key={href} href={href} onClick={()=>setOpen(false)} aria-current={selected?'page':undefined} className={'rpm-admin-nav-item '+(selected?'active':'')}><Icon size={18}/><span>{label}</span></Link>})}</div>
 </div>)}</nav>
 <div className="rpm-admin-nav-bottom"><Link href="/" target="_blank" rel="noopener noreferrer" className="rpm-admin-nav-item"><ExternalLink size={18}/> Zobacz sklep</Link><button type="button" className="rpm-admin-nav-item rpm-admin-logout" onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'});window.location.assign('/admin/login')}}><LogOut size={18}/> Wyloguj</button><small>RPM Custom · Back Office</small></div>
 </aside>{open&&<button className="rpm-admin-backdrop" onClick={()=>setOpen(false)} aria-label="Zamknij nawigację"/>}
 <div className="rpm-admin-main"><div className="rpm-admin-mobile-bar"><button type="button" onClick={()=>setOpen(true)} aria-label="Otwórz menu" aria-expanded={open} aria-controls="rpm-admin-navigation"><Menu size={23}/></button><strong>{pageLabel}</strong></div><div className="rpm-admin-desktop-bar"><span>Back Office / <strong>{pageLabel}</strong></span></div><div className="rpm-admin-workspace" key={path}>{children}</div></div>
 </div>;
}
