'use client';
import '../styles/admin-local.css';
import '../styles/admin-workspace.css';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import {LayoutDashboard,Package,ShoppingBag,Menu,X,ExternalLink,Settings,LogOut,Wrench,Truck} from 'lucide-react';
import {ADMIN_GROUPS,activeAdminLink,activeAdminGroup,adminPageLabel,workspaceTabs,detailTabs} from '../lib/admin-navigation';
const icons={dashboard:LayoutDashboard,orders:ShoppingBag,package:Package,truck:Truck,wrench:Wrench,settings:Settings};
export default function AdminLayout({children}:{children:React.ReactNode}){
 const path=usePathname(),active=activeAdminLink(path),group=activeAdminGroup(path),pageLabel=adminPageLabel(path),tabs=workspaceTabs(group),details=detailTabs(path);
 const [open,setOpen]=useState(false);
 useEffect(()=>{setOpen(false)},[path]);
 useEffect(()=>{if(!open)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[open]);
 if(path==='/admin/login')return <>{children}</>;
 return <div className="rpm-admin-shell">
 <aside id="rpm-admin-navigation" className={'rpm-admin-nav '+(open?'is-open':'')}>
 <div className="rpm-admin-brand"><img className="rpm-admin-original-logo" src="/rpm-logo.png.png" alt="RPM Custom"/><small>PANEL ADMINISTRATORA</small><button className="rpm-admin-close" type="button" onClick={()=>setOpen(false)} aria-label="Zamknij menu"><X size={20}/></button></div>
 <nav className="rpm-admin-workspaces-nav" aria-label="Główne moduły">{ADMIN_GROUPS.map(g=>{const Icon=icons[g.icon],selected=group?.id===g.id;return <Link key={g.id} href={g.href} onClick={()=>setOpen(false)} aria-current={selected?'true':undefined} className={'rpm-admin-nav-item '+(selected?'active':'')}><Icon size={20}/><span>{g.label}</span></Link>})}</nav>
 <div className="rpm-admin-nav-bottom"><Link href="/" target="_blank" rel="noopener noreferrer" className="rpm-admin-nav-item"><ExternalLink size={18}/> Zobacz sklep</Link><button type="button" className="rpm-admin-nav-item rpm-admin-logout" onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'});window.location.assign('/admin/login')}}><LogOut size={18}/> Wyloguj</button><small>RPM Custom · Back Office</small></div>
 </aside>{open&&<button className="rpm-admin-backdrop" onClick={()=>setOpen(false)} aria-label="Zamknij nawigację"/>}
 <div className="rpm-admin-main"><div className="rpm-admin-mobile-bar"><button type="button" onClick={()=>setOpen(true)} aria-label="Otwórz menu" aria-expanded={open} aria-controls="rpm-admin-navigation"><Menu size={23}/></button><strong>{group?.label??pageLabel}</strong></div><div className="rpm-admin-desktop-bar"><span>Back Office / <strong>{group?.label??pageLabel}</strong>{group&&group.label!==pageLabel?' / '+pageLabel:''}</span></div>
 {tabs.length>0&&<nav className="rpm-admin-workspace-tabs" aria-label="Sekcje modułu">{tabs.map(t=>{const selected=(active?.tab??active?.href)===t.href;return <Link key={t.href} href={t.href} aria-current={selected?'page':undefined} className={selected?'active':''}>{t.label}</Link>})}</nav>}
 {details.length>0&&<nav className="rpm-admin-detail-tabs" aria-label="Podsekcje modułu">{details.map(t=><Link key={t.href} href={t.href} aria-current={active?.href===t.href?'page':undefined} className={active?.href===t.href?'active':''}>{t.label}</Link>)}</nav>}
 <div className="rpm-admin-workspace" key={path}>{children}</div></div>
 </div>;
}
