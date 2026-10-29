import Link from 'next/link';
import {Truck,CreditCard,Building2,Wrench,Package,Percent,PlugZap,ShieldCheck,Mail,Settings2,ArrowRight} from 'lucide-react';

const groups=[
 {title:'Sprzedaż i obsługa',description:'Ustawienia działających funkcji sklepu.',items:[
  {href:'/admin/settings/shipping',title:'Dostawa i odbiór',desc:'Kurier, darmowa dostawa i odbiór osobisty',icon:Truck},
  {href:'/admin/settings/payments',title:'Płatności',desc:'Przelew i płatność przy odbiorze',icon:CreditCard},
  {href:'/admin/settings/company',title:'Dane firmy',desc:'Dane kontaktowe, NIP i adres',icon:Building2},
  {href:'/admin/settings/power-guides',title:'POWER GUIDES',desc:'Rekomendacje, powiązania produktów i ceny',icon:Wrench}
 ]},
 {title:'Rozwój platformy',description:'Planowane moduły — jeszcze bez aktywnej konfiguracji.',items:[]}
];
const planned=[
 {title:'Dostawcy i integracje',desc:'FMIC, MTuning, import i synchronizacja katalogów',icon:PlugZap},
 {title:'Marże i reguły cenowe',desc:'Narzuty globalne, dostawców, kategorii i produktów',icon:Percent},
 {title:'Reguły produktów',desc:'Widoczność, stany magazynowe i mapowanie kategorii',icon:Package},
 {title:'Komunikacja',desc:'Szablony i automatyczne powiadomienia',icon:Mail},
 {title:'Bezpieczeństwo i audyt',desc:'Role administratorów i historia zmian',icon:ShieldCheck},
 {title:'SEO i podatki',desc:'Metadane produktów i reguły VAT',icon:Settings2}
];
export default function SettingsPage(){
 return <main className="admin-page rpm-settings-page">
  <div className="admin-top"><div><span className="eyebrow">RPM CUSTOM / BACK OFFICE</span><h1>Centrum ustawień</h1><p>Wszystkie konfiguracje sklepu w jednym miejscu. Dostępne moduły i planowane rozszerzenia są wyraźnie rozdzielone.</p></div></div>
  {groups.slice(0,1).map(group=><section className="rpm-settings-card" key={group.title}><h2>{group.title}</h2><p>{group.description}</p><div className="rpm-admin-settings-hub-grid">{group.items.map(({href,title,desc,icon:Icon})=><Link key={href} href={href} className="rpm-admin-settings-hub-link"><Icon size={22}/><span><strong>{title}</strong><small>{desc}</small></span><ArrowRight size={17}/></Link>)}</div></section>)}
  <section className="rpm-settings-card" id="suppliers"><h2>Rozwój platformy</h2><p>Moduły zaplanowane pod rozbudowę sklepu i integrację hurtowni. Na razie nie są aktywnymi ustawieniami.</p><div className="rpm-admin-settings-hub-grid">{planned.map(({title,desc,icon:Icon})=><div key={title} className="rpm-admin-settings-hub-link rpm-admin-settings-hub-planned"><Icon size={22}/><span><strong>{title}</strong><small>{desc}</small></span><em>W planie</em></div>)}</div></section>
 </main>;
}
