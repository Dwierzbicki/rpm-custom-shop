import type {TechnicalField} from './fmic-technical';
type Group={key:string;title:string;fields:TechnicalField[]};
/** Shipping weight stays in the API and logistics data, not in the product identity block. */
export function productIdentifiers(product:{sku:string;mpn?:string;ean?:string}):[string,string][]{
 const entries:[string,string][]=[['Numer katalogowy (MPN)',product.mpn===product.sku?'':product.mpn??''],['EAN',product.ean??'']];
 return entries.filter(([,value])=>value.trim().length>0);
}
/** Presentation only: keep all supplied technical fields and never infer unavailable values. */
export function groupProductSpecifications(fields:TechnicalField[],category:string[]):Group[]{
 if(!fields.length)return [];
 if(!category.includes('Turbosprężarki tuningowe'))return [{key:'general',title:'Parametry produktu',fields:[...fields]}];
 const definitions=[
  {key:'general',title:'Parametry ogólne',keys:['model','power','bearing','ar']},
  {key:'compressor',title:'Układ sprężarki',keys:['compressor_wheel','compressor_inlet','compressor_outlet']},
  {key:'turbine',title:'Układ turbiny',keys:['turbine_wheel','turbine_inlet','turbine_outlet']},
  {key:'lubrication',title:'Smarowanie i chłodzenie',keys:['oil_feed','oil_drain','water_thread']}
 ];
 const assigned=new Set(definitions.flatMap(g=>g.keys));
 const groups:Group[]=definitions.map(g=>({key:g.key,title:g.title,fields:fields.filter(f=>g.keys.includes(f.key))})).filter(g=>g.fields.length);
 const other=fields.filter(f=>!assigned.has(f.key));
 if(other.length)groups.push({key:'other',title:'Pozostałe parametry',fields:other});
 return groups;
}
