// Reviewed pilot: exact supplier index and variant, supplemented by manufacturer model data.
// This is deliberately not an automated assertion of compatibility with other variants.
import type {TechnicalField} from './fmic-technical';
export type ReviewedProductSpec={fields:TechnicalField[];sources:{label:string;url:string;scope:string}[]};
const specs:Record<string,ReviewedProductSpec>={
 '102167108':{
  fields:[
   {key:'power',label:'Deklarowana moc',value:'735 HP'},
   {key:'compressor_wheel',label:'Wirnik ssący',value:'62 × 82,2 mm'},
   {key:'turbine_wheel',label:'Wirnik wydechowy',value:'66,1 × 74,17 mm'},
   {key:'bearing',label:'Łożyskowanie',value:'Podwójne kulkowe'},
   {key:'turbine_inlet',label:'Wlot muszli wydechowej',value:'T3'},
   {key:'ar',label:'A/R',value:'0,82'},
   {key:'oil_feed',label:'Zasilanie olejem',value:'1/8-27 NPSF'}
  ],
  sources:[
   {label:'Pulsar Turbo Systems',url:'https://pulsarturbo.com/product/pte-6266-ball-bearing-turbo-up-to-735hp/',scope:'Dokumentacja rodziny 6266E'},
   {label:'FMIC',url:'https://fmic.eu/377508-turbocharger-pulsar-psr-pte-6266e-735hp-82-t3-inlet-3-v-band-outlet-ball-bearings-102167108.html',scope:'Dokładny wariant 102167108'}
  ]
 }
};
export function reviewedProductSpec(sku:string,name:string):ReviewedProductSpec|undefined{
 if(sku==='102167108'&&!(/pulsar/i.test(name)&&/6266E/i.test(name)&&/(?:[.,]82)\s+T3\b/i.test(name)))return undefined;
 return specs[sku];
}
