export type ProductOption={id:string;label:string;price:number};
export type ProductOptionGroup={id:string;name:string;required:boolean;options:ProductOption[]};
export type Product={id:number;name:string;brand:string;category:string;price:number;engine:string;configurable?:boolean;sku:string;description:string;images?:string[];optionGroups?:ProductOptionGroup[];attributes?:Record<string,string>};
// Legacy definitions for the two persisted RPM products; not public fallback inventory.
export const products:Product[]=[
 {id:1,name:'Kolektor turbo BMW E36 M50/M52',brand:'RPM Custom',category:'Kolektory',price:2899,engine:'BMW M50/M52',configurable:true,sku:'RPM-DEMO-001',description:'Kolektor wykonywany na zamówienie. Wybierz wymagane parametry. Zgodność i termin wymagają potwierdzenia.'},
 {id:2,name:'Kolektor turbo BMW E46 M54',brand:'RPM Custom',category:'Kolektory',price:3099,engine:'BMW M54',configurable:true,sku:'RPM-DEMO-002',description:'Kolektor wykonywany na zamówienie. Wybierz wymagane parametry. Zgodność i termin wymagają potwierdzenia.'}
];
// Preserve former product IDs for historical orders and saved links.
export const RETIRED_DEMO_MAX_ID=30;
export const isRetiredDemoProductId=(id:number)=>Number.isInteger(id)&&id>=1&&id<=RETIRED_DEMO_MAX_ID;
export type CartLine={key:string;productId:number;qty:number;options?:Record<string,string>;unitPrice?:number;fmicSku?:string;fmicName?:string;fmicImage?:string|null;fmicAvailable?:boolean};
export const money=(v:number)=>new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(v);
