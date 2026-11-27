export const ADMIN_GROUPS=[
 {id:'start',label:'',links:[{href:'/admin',label:'Pulpit',icon:'dashboard'}]},
 {id:'sales',label:'Sprzedaż',links:[{href:'/admin/orders',label:'Zamówienia',icon:'orders'},{href:'/admin/quote-requests',label:'Zapytania ofertowe',icon:'quotes'}]},
 {id:'catalog',label:'Katalog',links:[{href:'/admin/products',label:'Produkty RPM',icon:'products'},{href:'/admin/suppliers/fmic',label:'Katalog FMIC',icon:'package'},{href:'/admin/variants',label:'Warianty produktów',icon:'variants'},{href:'/admin/product-descriptions',label:'Opisy i parametry',icon:'file'}]},
 {id:'suppliers',label:'Dostawcy',links:[{href:'/admin/suppliers',label:'Dostawcy i oferty',icon:'truck'},{href:'/admin/settings/fmic-commercial',label:'Ceny i dostawa FMIC',icon:'percent'},{href:'/admin/b2b-monitor',label:'Automatyzacja B2B',icon:'monitor'}]},
 {id:'motolab',label:'MotoLab',links:[{href:'/admin/settings/power-guides',label:'Power Guides',icon:'wrench'},{href:'/admin/community',label:'RPM Community',icon:'users'}]},
 {id:'settings',label:'Ustawienia',links:[{href:'/admin/settings',label:'Ustawienia sklepu',icon:'settings'},{href:'/admin/emails',label:'E-maile',icon:'mail'}]},
 {id:'tools',label:'Narzędzia',links:[{href:'/admin/link-audit',label:'Audyt linków',icon:'link'},{href:'/admin/image-audit',label:'Audyt zdjęć',icon:'image'}]}
] as const;
export type AdminLink=typeof ADMIN_GROUPS[number]['links'][number];
export const ADMIN_LINKS:AdminLink[]=ADMIN_GROUPS.flatMap(g=>[...g.links] as AdminLink[]);
export function activeAdminLink(path:string):AdminLink|undefined{
 if(path==='/admin'||path==='/admin/overview')return ADMIN_LINKS.find(l=>l.href==='/admin');
 if(path==='/admin/motolab-dyno')return ADMIN_LINKS.find(l=>l.href==='/admin/settings/power-guides');
 return ADMIN_LINKS.filter(l=>l.href!=='/admin'&&(path===l.href||path.startsWith(l.href+'/'))).sort((a,b)=>b.href.length-a.href.length)[0];
}
const SETTINGS_LABELS:Record<string,string>={'/admin/settings/company':'Dane firmy','/admin/settings/payments':'Płatności','/admin/settings/shipping':'Dostawa i odbiór','/admin/settings/appearance':'Wygląd sklepu'};
export function adminPageLabel(path:string){return SETTINGS_LABELS[path]??activeAdminLink(path)?.label??'Panel administratora'}
