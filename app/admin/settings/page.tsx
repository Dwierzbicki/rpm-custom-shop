import Link from 'next/link';
import {Truck,CreditCard,Building2,Package,Percent,ShieldCheck,Mail,Settings2,ArrowRight} from 'lucide-react';
const groups=[
 {title:'Sprzedaż',items:[
 {href:'/admin/settings/shipping',title:'Dostawa i odbiór',desc:'Kurier, darmowa dostawa i odbiór osobisty',icon:Truck},
 {href:'/admin/settings/payments',title:'Płatności',desc:'Przelew i płatność przy odbiorze',icon:CreditCard}]},
 {title:'Sklep',items:[
 {href:'/admin/settings/company',title:'Dane firmy',desc:'Dane kontaktowe, NIP i adres',icon:Building2},
 {href:'/admin/settings/appearance',title:'Wygląd sklepu',desc:'Logo i efekty wizualne',icon:Settings2}]}
];
const planned=[
 {title:'Marże i reguły cenowe',desc:'Narzuty globalne, dostawców, kategorii i produktów',icon:Percent},
 {title:'Reguły produktów',desc:'Widoczność, stany magazynowe i mapowanie kategorii',icon:Package},
 {title:'Komunikacja',desc:'Szablony i automatyczne powiadomienia',icon:Mail},
 {title:'Bezpieczeństwo i audyt',desc:'Role administratorów i historia zmian',icon:ShieldCheck},
 {title:'SEO i podatki',desc:'Metadane produktów i reguły VAT',icon:Settings2}
];
export default function SettingsPage(){
 return <main className="admin-page rpm-settings-page">
 <div className="admin-top"><div><h1>Ustawienia sklepu</h1><p>Dane firmy, wygląd, dostawa i płatności.</p></div></div>
 {groups.map(group=><section className="rpm-settings-card" key={group.title}><h2>{group.title}</h2><div className="rpm-admin-settings-list">{group.items.map(({href,title,desc,icon:Icon})=><Link key={href} href={href} className="rpm-admin-settings-hub-link"><Icon size={20}/><span><strong>{title}</strong><small>{desc}</small></span><ArrowRight size={16}/></Link>)}</div></section>)}
 <details className="rpm-admin-planned" id="suppliers"><summary>Planowane rozszerzenia</summary><p>Te funkcje nie są jeszcze aktywne.</p><div className="rpm-admin-settings-list">{planned.map(({title,desc,icon:Icon})=><div key={title} className="rpm-admin-settings-hub-link rpm-admin-settings-hub-planned"><Icon size={20}/><span><strong>{title}</strong><small>{desc}</small></span><em>W planie</em></div>)}</div></details>
 </main>;
}
