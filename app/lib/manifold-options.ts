import type {Product,ProductOptionGroup} from '../data';

// Nominal valve diameters observed in the FMIC Zawory Wastegate leaf on 2026-11-26.
// Diameter is not a guarantee of flange/mounting compatibility.
export const wastegateDiameters=[35,38,40,44,45,50,54,60] as const;
export function wastegateDiameterGroup():ProductOptionGroup{
 return {id:'rpm-wg-diameter',name:'Średnica WG',required:true,options:[{id:'internal',label:'Wewnętrzny WG — bez wyjścia',price:0},...wastegateDiameters.map(mm=>({id:'wg-'+mm,label:mm+' mm',price:0}))]};
}
export function termShieldGroup():ProductOptionGroup{
 return {id:'rpm-thermal-insulation',name:'Izolacja termiczna',required:false,options:[{id:'none',label:'Bez izolacji',price:0},{id:'termshield',label:'TermShield',price:1600}]};
}
/** Targeted persistence: keep any existing operator-managed group untouched. */
export function withTermShieldOption(groups:ProductOptionGroup[]):ProductOptionGroup[]{
 return groups.some(g=>g.id==='rpm-thermal-insulation')?groups:[...groups,termShieldGroup()];
}
export function bmwChassisGroup():ProductOptionGroup{
 return {id:'rpm-chassis',name:'Nadwozie',required:true,options:['E36','E46','E8x','E9x'].map(label=>({id:label.toLowerCase(),label:'BMW '+label,price:0}))};
}
function flangeGroup(extended=false):ProductOptionGroup{
 return {id:'rpm-flange',name:'Flansza turbosprężarki',required:true,options:[
 {id:'t3-single',label:'T3 Single Scroll',price:0},{id:'t4-single',label:'T4 Single Scroll',price:0},
 {id:'t3-twin',label:'T3 Twin Scroll',price:0},{id:'t4-twin',label:'T4 Twin Scroll',price:0},
 ...(extended?[{id:'vband-single',label:'V-Band',price:0},{id:'t25-single',label:'T25',price:0}]:[])]};
}
// The admin may store either the legacy group or the canonical exhaust leaf.
export function isManifoldCategory(category:string):boolean{
 return ['Kolektory','Kolektory wydechowe','Kolektory wydechowe nierdzewne','Kolektory wydechowe żeliwne'].includes(category);
}
export function isBmwManifold(item:Pick<Product,'category'|'brand'|'engine'|'name'>){
 return isManifoldCategory(item.category)&&/^rpm custom$/i.test(item.brand.trim())&&/\bM(?:50|52|54)(?:B\d+|TU)?\b/i.test(item.engine+' '+item.name);
}
export function withManifoldOptions<T extends Product>(item:T):T{
 if(!isManifoldCategory(item.category))return item;
 const groups=(item.optionGroups??[]).filter(g=>g.id!=='rpm-wastegate');
 if(!groups.some(g=>g.id==='rpm-flange'))groups.unshift(flangeGroup());
 if(isBmwManifold(item)){
  const index=groups.findIndex(g=>g.id==='rpm-chassis');
  if(index<0)groups.unshift(bmwChassisGroup());
  else groups[index]={...groups[index],required:true};
 }
 if(/^rpm custom$/i.test(item.brand.trim())){
  const flangeIndex=groups.findIndex(g=>g.id==='rpm-flange');
  const existing=groups[flangeIndex];
  if(!existing.options.some(o=>o.id==='t25-single'))groups[flangeIndex]={...existing,options:[...existing.options,{id:'t25-single',label:'T25',price:0}]};
  const index=groups.findIndex(g=>g.id==='rpm-wg-diameter');
  if(index<0)groups.splice(groups.findIndex(g=>g.id==='rpm-flange')+1,0,wastegateDiameterGroup());
  else {const existing=groups[index];groups[index]={...existing,required:true,options:existing.options.some(o=>o.id==='internal')?existing.options:[wastegateDiameterGroup().options[0],...existing.options]};}
  // Correct the original generated description without replacing operator-written content.
  const description=item.description.replace('Liczba przyłączy wastegate wynika z wyboru flanszy: single scroll — jedno, twin scroll — dwa.','Flansze T4 mają zawsze dwa wyjścia WG. Dla T3, T25 i V-Band można wybrać wewnętrzny WG (bez wyjść w kolektorze) lub zewnętrzny WG o wybranej średnicy. T3 Twin Scroll z zewnętrznym WG ma dwa wyjścia, pozostałe warianty jedno. Przy dwóch wyjściach oba mają ten sam rozmiar. Typ mocowania WG wymaga potwierdzenia.').replace('Liczba przyłączy wastegate jest dobierana automatycznie do flanszy.','Flansze T4 mają zawsze dwa wyjścia WG. Dla T3, T25 i V-Band można wybrać wewnętrzny WG (bez wyjść w kolektorze) lub zewnętrzny WG o wybranej średnicy. T3 Twin Scroll z zewnętrznym WG ma dwa wyjścia, pozostałe warianty jedno. Przy dwóch wyjściach oba mają ten sam rozmiar. Typ mocowania WG wymaga potwierdzenia.');
  return {...item,description,configurable:true,optionGroups:groups};
 }
 return {...item,configurable:true,optionGroups:groups};
}
/** Explicit operator preset. Keep existing prices/options for matching groups. */
export function manifoldPreset(kind:'bmw'|'2jz-ge',existing:ProductOptionGroup[]=[]):ProductOptionGroup[]{
 const groups:ProductOptionGroup[]=[
 ...(kind==='bmw'?[{id:'rpm-engine',name:'Silnik',required:true,options:['M50','M52','M54'].map(label=>({id:label.toLowerCase(),label,price:0}))},bmwChassisGroup()]:[]),
 flangeGroup(true),
 wastegateDiameterGroup(),
 {id:'rpm-egt',name:'EGT',required:true,options:[{id:'no',label:'Bez króćców EGT',price:0},{id:'yes',label:'Z króćcami EGT',price:0}]},
 termShieldGroup()
 ];
 return [...groups.map(g=>{
  const old=existing.find(x=>x.id===g.id);
  return old?{...old,required:g.required,options:[...old.options,...g.options.filter(o=>!old.options.some(x=>x.id===o.id))]}:g;
 }),...existing.filter(g=>g.id!=='rpm-wastegate'&&!(kind==='2jz-ge'&&['rpm-chassis','rpm-engine'].includes(g.id))&&!groups.some(x=>x.id===g.id))];
}

/** Approved package for existing six-cylinder RPM manifolds. Preserve old IDs,
 * labels and prices so existing configurations and carts remain valid. */
export function withEgtSevenOption(groups:ProductOptionGroup[]):ProductOptionGroup[]{
 const g=groups.find(g=>g.id==='rpm-egt');
 if(!g||!g.options.some(o=>o.id==='yes')||!g.options.some(o=>o.id==='no'))throw Error('Missing existing EGT options');
 if(g.options.some(o=>o.id==='seven'))return groups;
 return groups.map(x=>x===g?{...x,options:[...x.options,{id:'seven',label:'7× EGT (6 runnerów + 1 zbiorczy) z termoparami',price:2450}]}:x);
}
