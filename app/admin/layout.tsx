'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';
import {LayoutDashboard,Package,ShoppingBag,Menu,X,ExternalLink,Settings} from 'lucide-react';
const links=[{href:'/admin/overview',label:'Pulpit',icon:LayoutDashboard},{href:'/admin',label:'Produkty i konfigurator',icon:Package},{href:'/admin/orders',label:'Zamówienia',icon:ShoppingBag},{href:'/admin/settings',label:'Ustawienia',icon:Settings}];
export default function AdminLayout({children}:{children:React.ReactNode}){
 const path=usePathname();
 const [open,setOpen]=useState(false);
 return <div className="rpm-admin-shell"><aside className={'rpm-admin-nav '+(open?'is-open':'')}><div className="rpm-admin-brand"><strong>RPM <span>CUSTOM</span></strong><small>PANEL ADMINISTRATORA</small><button className="rpm-admin-close" onClick={()=>setOpen(false)} aria-label="Zamknij menu"><X size={20}/></button></div><div className="rpm-admin-nav-label">ZARZĄDZANIE SKLEPEM</div><nav aria-label="Nawigacja administratora">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} onClick={()=>setOpen(false)} className={'rpm-admin-nav-item '+(path===href?'active':'')}><Icon size={19}/><span>{label}</span></Link>)}</nav><div className="rpm-admin-nav-bottom"><Link href="/" className="rpm-admin-nav-item"><ExternalLink size={18}/> Zobacz sklep</Link><small>RPM Custom Shop · Back Office</small></div></aside>{open&&<button className="rpm-admin-backdrop" onClick={()=>setOpen(false)} aria-label="Zamknij nawigację"/>}<div className="rpm-admin-main"><div className="rpm-admin-mobile-bar"><button onClick={()=>setOpen(true)} aria-label="Otwórz menu"><Menu size={23}/></button><strong>RPM CUSTOM / ADMIN</strong></div>{children}</div></div>;
}
