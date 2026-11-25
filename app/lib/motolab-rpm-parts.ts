import {powerRangesFor,POWER_ENGINES} from './storefront-config';
import type {Product} from '../data';
export const RPM_PART_SLOTS=[['rods','Korbowody'],['pistons','Tłoki'],['bearings','Panewki'],['rings','Pierścienie'],['gasket','Uszczelka głowicy'],['fasteners','Mocowania głowicy'],['crank','Wał korbowy']] as const;
export type RpmMotoLabFitment={slot:string;versions:string[];maxPowerPs:number;note:string;noteEn:string;enabled:boolean};
export function validRpmFitment(x:unknown):x is RpmMotoLabFitment{
 if(!x||typeof x!=='object')return false;
 const f=x as RpmMotoLabFitment;
 return RPM_PART_SLOTS.some(([id])=>id===f.slot)&&Array.isArray(f.versions)&&(!f.enabled||f.versions.length>0)&&f.versions.length<=30&&new Set(f.versions).size===f.versions.length&&f.versions.every(v=>typeof v==='string'&&POWER_ENGINES.some(e=>e.versions.some(i=>i.id===v)))&&Number.isFinite(f.maxPowerPs)&&f.maxPowerPs>=1&&f.maxPowerPs<=2000&&typeof f.note==='string'&&f.note.length<=1000&&typeof f.noteEn==='string'&&f.noteEn.length<=1000&&typeof f.enabled==='boolean';
}
export type RpmOption=Product&{stockStatus?:string;visible?:boolean;leadTime?:string};
export function eligibleRpmParts(products:RpmOption[],version:string,range:number){
 const band=powerRangesFor(version)[range];
 if(!band)return [];
 return products.filter(p=>p.id>30&&p.visible===true&&!p.configurable&&!(p.optionGroups?.length)&&['available','order'].includes(p.stockStatus??'')&&typeof p.sku==='string'&&p.sku.startsWith('RPM-')&&Number.isFinite(p.price)&&p.price>0&&validRpmFitment(p.motolab)&&p.motolab.enabled&&p.motolab.versions.includes(version)&&p.motolab.maxPowerPs>=band.max);
}
