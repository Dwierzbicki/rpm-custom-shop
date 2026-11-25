import {powerRangesFor} from './storefront-config';
export type DynoPart={sku:string;name:string;qty:number;note:string};
export type EngineGeometry={block:string;crank:string;head:string;rods:string;pistons:string;boreMm:number|null;strokeMm:number|null};
export const emptyGeometry:EngineGeometry={block:'',crank:'',head:'',rods:'',pistons:'',boreMm:null,strokeMm:null};
export function displacementCc(g:EngineGeometry){return typeof g.boreMm==='number'&&typeof g.strokeMm==='number'&&g.boreMm>0&&g.strokeMm>0?Math.round(Math.PI/4*g.boreMm**2*g.strokeMm*6/1000):null}
export type DynoBuild={id:string;title:string;version:string;powerPs:number;torqueNm:number;basis:'crank'|'wheel';fuel:string;usage:'street'|'drift'|'track';chartUrl:string;notes:string;parts:DynoPart[];published:boolean;attested:boolean;geometry?:EngineGeometry};
export function validDynoBuild(x:unknown):x is DynoBuild{
 if(!x||typeof x!=='object')return false;
 const b=x as DynoBuild;
 const str=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max;
 const num=(v:unknown,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=max;
 if(!str(b.id,36)||!/^[0-9a-f-]{36}$/.test(b.id)||!str(b.title,120)||!b.title.trim()||!str(b.version,20)||!powerRangesFor(b.version).length||!num(b.powerPs,3000)||!num(b.torqueNm,5000)||!['crank','wheel'].includes(b.basis)||!str(b.fuel,100)||!b.fuel.trim()||!['street','drift','track'].includes(b.usage)||!str(b.notes,4000)||!str(b.chartUrl,500)||typeof b.published!=='boolean'||typeof b.attested!=='boolean'||!Array.isArray(b.parts)||b.parts.length>50)return false;
 if(b.chartUrl){try{const u=new URL(b.chartUrl);if(u.origin!=='https://res.cloudinary.com'||u.username||u.password||!u.pathname.includes('/image/upload/'))return false}catch{return false}}
 if(b.geometry!==undefined){
  const g=b.geometry;if(!g||typeof g!=='object'||![g.block,g.crank,g.head,g.rods,g.pistons].every(v=>str(v,200)))return false;
  if(![g.boreMm,g.strokeMm].every(v=>v===null||num(v,150)))return false;
 }
 if(b.published&&b.version==='m50b30-stroker'&&(!b.geometry||![b.geometry.block,b.geometry.crank,b.geometry.head,b.geometry.rods,b.geometry.pistons].every(v=>v.trim())||!displacementCc(b.geometry)))return false;
 if(b.published&&(!b.attested||!b.chartUrl||!b.parts.length))return false;
 return b.parts.every(p=>p&&str(p.sku,120)&&str(p.name,250)&&!!p.name.trim()&&Number.isInteger(p.qty)&&p.qty>=1&&p.qty<=50&&str(p.note,500));
}
