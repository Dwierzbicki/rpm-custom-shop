import type {Product} from '../data';

export type CatalogFilter={key:string;label:string;values:string[]};
const categoryKeys:Record<string,string[]>={
 Turbo:['Producent','Model','Flansza','Wastegate','Łożyskowanie','Moc [KM]'],
 Kolektory:['Producent','Silnik','Flansza','Wastegate','Materiał'],
 Intercoolery:['Producent','Wymiary','Średnica','Materiał'],
 Wastegate:['Producent','Średnica','Typ'],
 Osprzęt:['Producent','Średnica','Flansza','Materiał','Typ'],
 Elektronika:['Producent','Typ','Zakres pomiarowy'],
 Paliwo:['Producent','Wydajność','Typ','Ciśnienie'],
};
const clean=(s:string)=>s.trim();
export function productAttributes(p:Product):Record<string,string>{
 const attrs:Record<string,string>={...(p.attributes??{})};
 if(p.brand)attrs['Producent']??=p.brand;
 if(p.engine&&p.engine!=='Uniwersalne')attrs['Silnik']??=p.engine;
 if(p.category==='Turbo')attrs['Model']??=p.name.replace(/^Turbosprężarka\s*/i,'').trim();
 const dimensions=p.name.match(/\d{2,4}\s*[×xX]\s*\d{2,4}(?:\s*[×xX]\s*\d{2,4})?/);
 if(dimensions&&p.category==='Intercoolery')attrs['Wymiary']??=dimensions[0].replace(/\s/g,'').replace(/[xX]/g,'×')+' mm';
 const diameter=p.name.match(/(\d{2,3})\s*mm/i);
 if(diameter&&['Wastegate','Osprzęt','Intercoolery'].includes(p.category))attrs['Średnica']??=diameter[1]+' mm';
 const flange=p.name.match(/\b(T3|T4|T25|T28|V[- ]?Band)\b/i);
 if(flange)attrs['Flansza']??=flange[1].toUpperCase();
 for(const group of p.optionGroups??[]){
  const key=Object.keys(attrs).find(k=>k.toLocaleLowerCase('pl')===group.name.toLocaleLowerCase('pl'));
  if(!key&&group.options.length===1)attrs[group.name]=group.options[0].label;
 }
 return attrs;
}
export function buildCatalogFilters(products:Product[],category:string):CatalogFilter[]{
 const keys=categoryKeys[category]??['Producent','Silnik','Typ','Materiał','Średnica'];
 const attributes=products.map(productAttributes);
 return keys.map(key=>({key,label:key,values:Array.from(new Set(attributes.map(a=>a[key]).filter((v):v is string=>typeof v==='string'&&!!clean(v)))).sort((a,b)=>a.localeCompare(b,'pl',{numeric:true}))})).filter(f=>f.values.length>0);
}
export function matchesCatalogAttributes(p:Product,chosen:Record<string,string>):boolean{
 const attrs=productAttributes(p);
 return Object.entries(chosen).every(([key,value])=>!value||attrs[key]===value);
}
