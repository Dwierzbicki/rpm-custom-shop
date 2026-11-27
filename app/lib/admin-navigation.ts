/** Six business workspaces. Existing route URLs remain the source of truth. */
export const ADMIN_GROUPS=[
 {id:'start',label:'Pulpit',href:'/admin',icon:'dashboard',links:[{href:'/admin',label:'Pulpit'}]},
 {id:'sales',label:'Sprzedaż',href:'/admin/orders',icon:'orders',links:[{href:'/admin/orders',label:'Zamówienia'},{href:'/admin/quote-requests',label:'Zapytania ofertowe'},{href:'/admin/emails',label:'Podgląd wiadomości',tab:'/admin/orders'}]},
 {id:'catalog',label:'Katalog',href:'/admin/products',icon:'package',links:[{href:'/admin/products',label:'Produkty RPM'},{href:'/admin/suppliers/fmic',label:'Katalog FMIC'},{href:'/admin/fmic-product',label:'Karta produktu',tab:'/admin/suppliers/fmic'},{href:'/admin/variants',label:'Warianty'},{href:'/admin/product-descriptions',label:'Opisy i parametry',tab:'/admin/product-descriptions'},{href:'/admin/image-audit',label:'Audyt zdjęć',tab:'/admin/product-descriptions'},{href:'/admin/link-audit',label:'Audyt linków',tab:'/admin/product-descriptions'}]},
 {id:'suppliers',label:'Dostawcy',href:'/admin/suppliers',icon:'truck',links:[{href:'/admin/suppliers',label:'Integracje i oferty'},{href:'/admin/suppliers/pricing',label:'Ceny i marże'},{href:'/admin/settings/fmic-commercial',label:'Symulacja FMIC',tab:'/admin/suppliers/pricing'},{href:'/admin/b2b-monitor',label:'Automatyzacja B2B'}]},
 {id:'motolab',label:'MotoLab',href:'/admin/settings/power-guides',icon:'wrench',links:[{href:'/admin/settings/power-guides',label:'Power Guides'}]},
 {id:'settings',label:'Ustawienia',href:'/admin/settings/company',icon:'settings',links:[{href:'/admin/settings',label:'Ustawienia sklepu'},{href:'/admin/settings/company',label:'Dane firmy'},{href:'/admin/settings/payments',label:'Płatności'},{href:'/admin/settings/shipping',label:'Dostawa'},{href:'/admin/settings/appearance',label:'Wygląd',tab:'/admin/settings/appearance'},{href:'/admin/community',label:'Treści strony głównej',tab:'/admin/settings/appearance'}]}
] as const;
export type AdminLink={href:string;label:string;tab?:string};
export type AdminGroup=typeof ADMIN_GROUPS[number];
export const ADMIN_LINKS:AdminLink[]=ADMIN_GROUPS.flatMap(g=>[...g.links] as AdminLink[]);
export function activeAdminLink(path:string):AdminLink|undefined{
 if(path==='/admin'||path==='/admin/overview')return ADMIN_LINKS.find(l=>l.href==='/admin');
 if(path==='/admin/motolab-dyno')return ADMIN_LINKS.find(l=>l.href==='/admin/settings/power-guides');
 return ADMIN_LINKS.filter(l=>l.href!=='/admin'&&(path===l.href||path.startsWith(l.href+'/'))).sort((a,b)=>b.href.length-a.href.length)[0];
}
export function activeAdminGroup(path:string):AdminGroup|undefined{
 const active=activeAdminLink(path);return ADMIN_GROUPS.find(g=>g.links.some(l=>l.href===active?.href));
}
export function adminPageLabel(path:string){return activeAdminLink(path)?.label??'Panel administratora'}
export function workspaceTabs(group:AdminGroup|undefined):AdminLink[]{
 if(!group||group.id==='start'||group.id==='motolab')return [];
 return (group.links as readonly AdminLink[]).filter(l=>!l.tab||l.href===l.tab).map(l=>({...l,label:l.href==='/admin/product-descriptions'?'Centrum jakości':l.href==='/admin/settings/appearance'?'Wygląd i treści':l.label}));
}
export function detailTabs(path:string):AdminLink[]{
 const group=activeAdminGroup(path),active=activeAdminLink(path);if(!group||!active?.tab)return [];
 return (group.links as readonly AdminLink[]).filter(l=>l.tab===active.tab&&active.tab!=='/admin/suppliers/fmic'&&active.tab!=='/admin/orders'&&active.tab!=='/admin/suppliers/pricing');
}
