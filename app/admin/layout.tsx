'use client';
import '../styles/admin-local.css';
import '../styles/admin-workspace.css';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';
import {LayoutDashboard,Package,ShoppingBag,Mail,Menu,X,ExternalLink,Settings,LogOut,Wrench,Truck,Monitor,FileText,Users,ClipboardList,Percent,Link2,Layers,Image} from 'lucide-react';
const groups=[
 {label:'SPRZEDAŻ',links:[{href:'/admin',label:'Pulpit',icon:LayoutDashboard},{href:'/admin/orders',label:'Zamówienia',icon:ShoppingBag},{href:'/admin/quote-requests',label:'Zapytania ofertowe',icon:ClipboardList}]},
 {label:'KATALOG',links:[{href:'/admin/suppliers/fmic',label:'Katalog FMIC',icon:Package},{href:'/admin/products',label:'Produkty własne RPM',icon:Package}]},
 {label:'KONFIGURACJA',links:[{href:'/admin/settings/fmic-commercial',label:'Ceny i dostawa FMIC',icon:Percent},{href:'/admin/settings',label:'Ustawienia sklepu',icon:Settings},{href:'/admin/settings/power-guides',label:'POWER GUIDES',icon:Wrench},{href:'/admin/motolab-dyno',label:'Sprawdzone setupy RPM',icon:Wrench},{href:'/admin/emails',label:'E-maile',icon:Mail},{href:'/admin/community',label:'RPM Community',icon:Users}]},
 {label:'ZAAWANSOWANE',links:[{href:'/admin/suppliers',label:'Oferty i deduplikacja',icon:Truck},{href:'/admin/b2b-monitor',label:'Automatyzacja B2B',icon:Monitor},{href:'/admin/link-audit',label:'Sprawdzenie poprawności linków',icon:Link2},{href:'/admin/image-audit',label:'Audyt zdjęć',icon:Image},{href:'/admin/product-descriptions',label:'Opisy i parametry',icon:FileText},{href:'/admin/variants',label:'RPM Variant Manager',icon:Layers}]}
];
const links=groups.flatMap(g=>g.links);
const activeLink=(href:string,path:string)=>href==='/admin'?(path==='/admin'||path==='/admin/overview'):href==='/admin/settings'?(path===href||path.startsWith(href+'/')&&!links.some(l=>l.href!==href&&l.href===path)):path===href;
export default function AdminLayout({children}:{children:React.ReactNode}){
 const path=usePathname();
 const [open,setOpen]=useState(false);
 if(path==='/admin/login')return <>{children}</>;
 return <div className="rpm-admin-shell"><aside className={'rpm-admin-nav '+(open?'is-open':'')}><div className="rpm-admin-brand"><img className="rpm-admin-original-logo" src="/rpm-logo.png.png" alt="RPM Custom"/><small>PANEL ADMINISTRATORA</small><button className="rpm-admin-close" onClick={()=>setOpen(false)} aria-label="Zamknij menu"><X size={20}/></button></div><div className="rpm-admin-nav-label">ZARZĄDZANIE SKLEPEM</div><nav aria-label="Nawigacja administratora">{groups.map(({label,links:entries})=><div className="rpm-admin-nav-group" key={label}><small>{label}</small>{entries.map(({href,label,icon:Icon})=><Link key={href} href={href} onClick={()=>setOpen(false)} className={'rpm-admin-nav-item '+(activeLink(href,path)?'active':'')}><Icon size={19}/><span>{label}</span></Link>)}</div>)}</nav><div className="rpm-admin-nav-bottom"><Link href="/" className="rpm-admin-nav-item"><ExternalLink size={18}/> Zobacz sklep</Link><button type="button" className="rpm-admin-nav-item rpm-admin-logout" onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'});window.location.assign('/admin/login')}}><LogOut size={18}/> Wyloguj</button><small>RPM Custom Shop · Back Office</small></div></aside>{open&&<button className="rpm-admin-backdrop" onClick={()=>setOpen(false)} aria-label="Zamknij nawigację"/>}<div className="rpm-admin-main"><div className="rpm-admin-mobile-bar"><button onClick={()=>setOpen(true)} aria-label="Otwórz menu"><Menu size={23}/></button><strong>RPM CUSTOM / ADMIN</strong></div><div className="rpm-admin-desktop-bar"><span>Back Office / <strong>{links.find(x=>activeLink(x.href,path))?.label??({"/admin/settings/company":"Dane firmy","/admin/settings/payments":"Płatności","/admin/settings/shipping":"Dostawa i odbiór"} as Record<string,string>)[path]??'Ustawienia'}</strong></span><Link href="/" target="_blank"><ExternalLink size={15}/> Otwórz sklep</Link></div><div className="rpm-admin-workspace" key={path}>{children}</div></div></div>;
}
