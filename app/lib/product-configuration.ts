import type {Product,CartLine} from '../data';
export type Configuration={chosenOptions:Record<string,string>;engine:string;flange:string;wg:string;egt:boolean;qty:number};
export function describeConfiguration(selected:Product,{chosenOptions,engine,flange,wg,qty}:Configuration){
 const customGroups=(selected.optionGroups??[]).filter(g=>!(selected.optionGroups??[]).some(f=>f.id==='rpm-flange')||g.id!=='rpm-wastegate');
 const rpmFlange=chosenOptions['rpm-flange'];
 const automaticWg=rpmFlange?(rpmFlange.endsWith('-twin')?'2× WG':'1× WG'):'';
 const usesCustom=customGroups.length>0;
 const customReady=customGroups.every(g=>chosenOptions[g.id]?g.options.some(o=>o.id===chosenOptions[g.id]):!g.required);
 const customExtra=customGroups.reduce((sum,g)=>sum+(g.options.find(o=>o.id===chosenOptions[g.id])?.price??0),0);
 const selectedPrice=selected.price+customExtra;
 const unitPrice=usesCustom?selectedPrice:selected.price;
 const totalPrice=Math.round(unitPrice*qty*100)/100;
 const canAdd=usesCustom?customReady:!selected.configurable||((selected.id!==1||!!engine)&&!!flange&&!!wg);

 return {customGroups,automaticWg,usesCustom,customExtra,selectedPrice,unitPrice,totalPrice,canAdd};
}
export function configuredCartLine(selected:Product,configuration:Configuration):CartLine|null{
 const {chosenOptions,engine,flange,wg,egt,qty}=configuration;
 const {customGroups,automaticWg,usesCustom,selectedPrice,canAdd}=describeConfiguration(selected,configuration);
 if(!canAdd)return null;
 const options:Record<string,string>|undefined=usesCustom?{...Object.fromEntries(customGroups.filter(g=>chosenOptions[g.id]).map(g=>[g.name,g.options.find(o=>o.id===chosenOptions[g.id])?.label??''])),...(automaticWg?{Wastegate:automaticWg}:{})}:selected.configurable?{Silnik:selected.id===1?engine:selected.engine,Flansza:flange,Wastegate:wg,EGT:egt?'Tak':'Nie'}:undefined;const key=selected.id+'-'+JSON.stringify(options||{});const line:CartLine={key,productId:selected.id,qty,options,unitPrice:usesCustom?selectedPrice:selected.price};
 return line;
}
