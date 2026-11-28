import type {Product} from '../data';
import {configuredCartLine,describeConfiguration} from './product-configuration';
import type {tuManifoldSpec} from './motolab-build-plan';
type Spec=NonNullable<ReturnType<typeof tuManifoldSpec>>;
export function manifoldConfiguration(product:Product,spec:Spec,choices:Record<string,string>){
 if(product.sku!==spec.sku||!product.configurable||!product.optionGroups?.length)return null;
 // Turbo dependencies cannot be overridden by the inline configurator.
 const fixed=new Set(['rpm-engine','rpm-flange','rpm-wg-diameter']);
 const chosenOptions={...spec.options};
 for(const group of product.optionGroups){
  const value=choices[group.id];
  if(!fixed.has(group.id)&&value){if(!group.options.some(o=>o.id===value))return null;chosenOptions[group.id]=value;}
 }
 if(Object.entries(spec.options).some(([id,value])=>!product.optionGroups?.some(g=>g.id===id&&g.options.some(o=>o.id===value))))return null;
 const configuration={chosenOptions,engine:'',flange:'',wg:'',egt:false,qty:1};
 // Every displayed manifold option requires an explicit choice, including free
 // alternatives such as no EGT or no thermal insulation. Do not rely on catalogue flags.
 const requiredProduct={...product,optionGroups:product.optionGroups.map(group=>({...group,required:true}))};
 const described=describeConfiguration(requiredProduct,configuration);
 const line=configuredCartLine(requiredProduct,configuration);
 return {...described,chosenOptions,line};
}
