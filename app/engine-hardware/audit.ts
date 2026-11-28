import {families,diagrams,parts,partByOem,canSell,hasLicensedImage} from './catalog';
export const assemblies:readonly (readonly [string,string,string?])[]=[
 ['block','Blok i mocowania','11_9905'],['block-attachments','Osprzęt bloku'],['rods','Korbowody','11_9913'],['crank','Wał korbowy i podpory'],['pistons','Tłoki i sworznie'],['head','Głowica i mocowania','11_9908'],['head-body','Głowica i podpory wałków'],['cover','Pokrywa zaworów','11_9911'],['vanos','VANOS / VVT-i'],['timing-cover','Obudowa rozrządu','11_9907'],['timing','Napęd rozrządu i napinacze'],['oil-pan','Miska i czujnik oleju','11_9918'],['oil-pump','Pompa oleju i smok','11_9953'],['oil-filter','Filtr oleju','11_9921'],['oil-jets','Dysze olejowe'],['breather','Odma'],['intake','Dolot i przepustnica'],['exhaust','Kolektor wydechowy'],['cooling','Pompa wody, termostat i chłodzenie'],['belt','Napęd paskowy i koło pasowe'],['alternator','Alternator'],['starter','Rozrusznik'],['ac','Klimatyzacja'],['fuel','Listwa i układ paliwowy'],['ignition','Zapłon'],['sensors','Czujniki i wiązki'],['flywheel','Koło zamachowe / flexplate'],['mounts','Łapy i wsporniki silnika'],['vacuum','Podciśnienie i emisje']
] as const;
export function auditEngine(engine:string){
 const ds=diagrams.filter(d=>d.engine===engine),rows=ds.flatMap(d=>d.usages);
 return {engine,diagramCount:ds.length,usageCount:rows.length,uniqueOem:new Set(rows.map(r=>r.oem)).size,exact:rows.filter(r=>r.mountingEvidence?.trim()).length,torque:rows.filter(r=>r.torque&&r.torqueSource).length,licensed:ds.filter(hasLicensedImage).length,saleReady:rows.filter(r=>{const p=partByOem(r.oem);return p&&canSell(p,r)}).length,assemblies:assemblies.map(([id,label,diagramId])=>({id,label,diagramId,status:diagramId&&ds.some(d=>d.id===diagramId)?'partial':'pending'}))};
}
export const engineIds=families.flatMap(f=>[...f.versions]);
export const totalPilotParts=parts.length;
// Staged imports are isolated from storefront. Explicit licensing evidence is
// required even for a draft; it is not itself proof of permission.
export type ImportRow={oem:string;position:string;diagramId:string;vehicle:string;quantity:number|null;quantityUnit:'piece'|'set'|'unknown';namePl:string;nameEn:string;dimension:string;locationPl:string;locationEn:string;source:string;fitment:string;technicalEvidence:string;mountingEvidence:string;torque:string;torqueSource:string;replacement:'always'|'inspect'|'unknown';sku:string;notes:string};
export type ImportBatch={engine:string;rightsEvidence:string;rows:ImportRow[]};
const plain=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008]/.test(v);
const required=(v:unknown,max:number)=>plain(v,max)&&v.trim().length>0;
const record=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const https=(x:unknown)=>{if(!required(x,1000))return false;try{return new URL(x as string).protocol==='https:'}catch{return false}};
export function validateBatch(input:unknown):{ok:true;batch:ImportBatch}|{ok:false;errors:string[]}{
 if(!record(input))return {ok:false,errors:['Wymagany obiekt JSON.']};
 const errors:string[]=[];
 if(typeof input.engine!=='string'||!engineIds.some(e=>e===input.engine))errors.push('Nieobsługiwany silnik.');
 if(!required(input.rightsEvidence,2000))errors.push('Podaj podstawę uprawnienia do wykorzystania dokumentacji.');
 if(!Array.isArray(input.rows)||input.rows.length<1||input.rows.length>500)return {ok:false,errors:[...errors,'Wymagane 1–500 pozycji.']};
 const seen=new Set<string>(),rows:ImportRow[]=[];
 input.rows.forEach((v,i)=>{
  const prefix='Wiersz '+(i+1)+': ';
  if(!record(v)){errors.push(prefix+'niepoprawny obiekt');return}
  if(!required(v.oem,40)||! /^[A-Z0-9-]+$/i.test(v.oem as string))errors.push(prefix+'OEM');
  if(!required(v.position,30)||!required(v.diagramId,80)||!required(v.vehicle,200)||!required(v.fitment,500))errors.push(prefix+'schemat, pozycja lub wariant pojazdu');
  if(v.quantity===null?v.quantityUnit!=='unknown':!Number.isSafeInteger(v.quantity)||Number(v.quantity)<1||Number(v.quantity)>1000||!['piece','set'].includes(String(v.quantityUnit)))errors.push(prefix+'ilość / jednostka');
  if(!required(v.namePl,250)||!required(v.nameEn,250)||!required(v.locationPl,1000)||!required(v.locationEn,1000))errors.push(prefix+'nazwy i lokalizacje PL/EN');
  if(!https(v.source))errors.push(prefix+'źródło HTTPS');
  for(const field of ['dimension','technicalEvidence','mountingEvidence','torque','torqueSource','sku','notes'])if(!plain(v[field],2000))errors.push(prefix+field);
  if(!['always','inspect','unknown'].includes(String(v.replacement)))errors.push(prefix+'zasada wymiany');
  if(Boolean(v.torque)!==Boolean(v.torqueSource))errors.push(prefix+'moment wymaga źródła');
  const key=JSON.stringify([v.vehicle,v.fitment,v.diagramId,v.position,v.oem]);
  if(seen.has(key))errors.push(prefix+'duplikat zastosowania');seen.add(key);
  rows.push({oem:v.oem,position:v.position,diagramId:v.diagramId,vehicle:v.vehicle,quantity:v.quantity,quantityUnit:v.quantityUnit,namePl:v.namePl,nameEn:v.nameEn,dimension:v.dimension,locationPl:v.locationPl,locationEn:v.locationEn,source:v.source,fitment:v.fitment,technicalEvidence:v.technicalEvidence,mountingEvidence:v.mountingEvidence,torque:v.torque,torqueSource:v.torqueSource,replacement:v.replacement,sku:v.sku,notes:v.notes} as ImportRow);
 });
 return errors.length?{ok:false,errors:errors.slice(0,100)}:{ok:true,batch:{engine:input.engine as string,rightsEvidence:input.rightsEvidence as string,rows}};
}
export const importTemplate:ImportBatch={engine:'M54B30',rightsEvidence:'',rows:[{oem:'',position:'',diagramId:'',vehicle:'',quantity:null,quantityUnit:'unknown',namePl:'',nameEn:'',dimension:'',locationPl:'',locationEn:'',source:'',fitment:'',technicalEvidence:'',mountingEvidence:'',torque:'',torqueSource:'',replacement:'unknown',sku:'',notes:''}]};
