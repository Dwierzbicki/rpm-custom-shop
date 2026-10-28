export type Engine = 'BMW M50/M52' | 'BMW M54' | 'Toyota 2JZ-GE' | 'Toyota 2JZ-GTE';
export type Product = {slug:string;name:string;engine:Engine;description:string;basePrice:number|null;leadTime:string;};
// IMPORTANT: null means price not provided by the shop owner. Never show a fabricated price.
export const products:Product[] = [
 {slug:'kolektor-bmw-m50-m52',name:'Kolektor turbo M50 / M52',engine:'BMW M50/M52',description:'Kolektor wykonywany metodą TIG. Indywidualny dobór flanszy i wyjść wastegate.',basePrice:null,leadTime:'Do potwierdzenia'},
 {slug:'kolektor-bmw-m54',name:'Kolektor turbo M54',engine:'BMW M54',description:'Kolektor turbo projektowany pod wybraną konfigurację silnika i turbosprężarki.',basePrice:null,leadTime:'Do potwierdzenia'},
 {slug:'kolektor-toyota-2jz-ge',name:'Kolektor turbo 2JZ-GE',engine:'Toyota 2JZ-GE',description:'Kolektor turbo do projektu 2JZ-GE, z opcjami konfiguracji.',basePrice:null,leadTime:'Do potwierdzenia'},
 {slug:'kolektor-toyota-2jz-gte',name:'Kolektor turbo 2JZ-GTE',engine:'Toyota 2JZ-GTE',description:'Kolektor turbo do projektu 2JZ-GTE, z opcjami konfiguracji.',basePrice:null,leadTime:'Do potwierdzenia'}
];
// Surcharges are deliberately unpriced until confirmed by RPM Custom.
export const surcharges:{flange:Record<string,number|null>;wastegate:Record<string,number|null>;egt:Record<string,number|null>} = {
 flange:{T3:0,T4:null,'V-Band':null},wastegate:{Single:0,Twin:null},egt:{Nie:0,Tak:null}
};
export function calculatePrice(p:Product,flange:string,wastegate:string,egt:string):number|null {
 const values=[p.basePrice,surcharges.flange[flange],surcharges.wastegate[wastegate],surcharges.egt[egt]];
 return values.every(v=>typeof v==='number') ? (values as number[]).reduce((a,b)=>a+b,0):null;
}
export const money=(v:number)=>new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(v);
