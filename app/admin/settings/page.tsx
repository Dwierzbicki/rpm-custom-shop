import Link from 'next/link';
import {Truck,CreditCard,Building2,Settings2,ArrowRight,Users} from 'lucide-react';
const groups=[
 {title:'Sprzedaż',items:[
 {href:'/admin/settings/shipping',title:'Dostawa i odbiór',desc:'Kurier, darmowa dostawa i odbiór osobisty',icon:Truck},
 {href:'/admin/settings/payments',title:'Płatności',desc:'Przelew i płatność przy odbiorze',icon:CreditCard}]},
 {title:'Sklep',items:[
 {href:'/admin/settings/company',title:'Dane firmy',desc:'Dane kontaktowe, NIP i adres',icon:Building2},
 {href:'/admin/settings/appearance',title:'Wygląd sklepu',desc:'Logo i efekty wizualne',icon:Settings2},
 {href:'/admin/community',title:'Treści strony głównej',desc:'Sekcja RPM Community',icon:Users}]}
];
export default function SettingsPage(){
 return <main className="admin-page rpm-settings-page">
 <div className="admin-top"><div><h1>Ustawienia sklepu</h1><p>Dane firmy, wygląd, dostawa i płatności.</p></div></div>
 {groups.map(group=><section className="rpm-settings-card" key={group.title}><h2>{group.title}</h2><div className="rpm-admin-settings-list">{group.items.map(({href,title,desc,icon:Icon})=><Link key={href} href={href} className="rpm-admin-settings-hub-link"><Icon size={20}/><span><strong>{title}</strong><small>{desc}</small></span><ArrowRight size={16}/></Link>)}</div></section>)}
 </main>;
}
