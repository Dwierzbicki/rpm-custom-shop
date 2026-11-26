import type {Product,ProductOptionGroup} from '../data';

export function bmwChassisGroup():ProductOptionGroup{
 return {id:'rpm-chassis',name:'Nadwozie',required:true,options:['E36','E46','E8x','E9x'].map(label=>({id:label.toLowerCase(),label:'BMW '+label,price:0}))};
}
function flangeGroup(extended=false):ProductOptionGroup{
 return {id:'rpm-flange',name:'Flansza turbosprężarki',required:true,options:[
 {id:'t3-single',label:'T3 Single Scroll',price:0},{id:'t4-single',label:'T4 Single Scroll',price:0},
 {id:'t3-twin',label:'T3 Twin Scroll',price:0},{id:'t4-twin',label:'T4 Twin Scroll',price:0},
 ...(extended?[{id:'vband-single',label:'V-Band',price:0}]:[])]};
}
export function isBmwManifold(item:Pick<Product,'category'|'brand'|'engine'|'name'>){
 return item.category==='Kolektory'&&/^rpm custom$/i.test(item.brand.trim())&&/\bM(?:50|52|54)(?:B\d+|TU)?\b/i.test(item.engine+' '+item.name);
}
export function withManifoldOptions<T extends Product>(item:T):T{
 if(item.category!=='Kolektory')return item;
 const groups=(item.optionGroups??[]).filter(g=>g.id!=='rpm-wastegate');
 if(!groups.some(g=>g.id==='rpm-flange'))groups.unshift(flangeGroup());
 if(isBmwManifold(item)){
  const index=groups.findIndex(g=>g.id==='rpm-chassis');
  if(index<0)groups.unshift(bmwChassisGroup());
  else groups[index]={...groups[index],required:true};
 }
 return {...item,configurable:true,optionGroups:groups};
}
/** Explicit operator preset. Keep existing prices/options for matching groups. */
export function manifoldPreset(kind:'bmw'|'2jz-ge',existing:ProductOptionGroup[]=[]):ProductOptionGroup[]{
 const groups:ProductOptionGroup[]=[
 ...(kind==='bmw'?[{id:'rpm-engine',name:'Silnik',required:true,options:['M50','M52','M54'].map(label=>({id:label.toLowerCase(),label,price:0}))},bmwChassisGroup()]:[]),
 flangeGroup(true),
 {id:'rpm-egt',name:'EGT',required:true,options:[{id:'no',label:'Bez króćców EGT',price:0},{id:'yes',label:'Z króćcami EGT',price:0}]}
 ];
 return [...groups.map(g=>{
  const old=existing.find(x=>x.id===g.id);
  return old?{...old,required:true,options:[...old.options,...g.options.filter(o=>!old.options.some(x=>x.id===o.id))]}:g;
 }),...existing.filter(g=>g.id!=='rpm-wastegate'&&!groups.some(x=>x.id===g.id))];
}
