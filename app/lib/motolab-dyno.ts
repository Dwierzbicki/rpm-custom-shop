import {powerRangesFor} from './storefront-config';
export type DynoPart={sku:string;name:string;qty:number;note:string};
export type DynoBuild={id:string;title:string;version:string;powerPs:number;torqueNm:number;basis:'crank'|'wheel';fuel:string;usage:'street'|'drift'|'track';chartUrl:string;notes:string;parts:DynoPart[];published:boolean;attested:boolean};
export function validDynoBuild(x:unknown):x is DynoBuild{
 if(!x||typeof x!=='object')return false;
 const b=x as DynoBuild;
 const str=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max;
 const num=(v:unknown,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=max;
 if(!str(b.id,36)||!/^[0-9a-f-]{36}$/.test(b.id)||!str(b.title,120)||!b.title.trim()||!str(b.version,20)||!powerRangesFor(b.version).length||!num(b.powerPs,3000)||!num(b.torqueNm,5000)||!['crank','wheel'].includes(b.basis)||!str(b.fuel,100)||!b.fuel.trim()||!['street','drift','track'].includes(b.usage)||!str(b.notes,4000)||!str(b.chartUrl,500)||typeof b.published!=='boolean'||typeof b.attested!=='boolean'||!Array.isArray(b.parts)||b.parts.length>50)return false;
 if(b.chartUrl){try{const u=new URL(b.chartUrl);if(u.origin!=='https://res.cloudinary.com'||u.username||u.password||!u.pathname.includes('/image/upload/'))return false}catch{return false}}
 if(b.published&&(!b.attested||!b.chartUrl||!b.parts.length))return false;
 return b.parts.every(p=>p&&str(p.sku,120)&&str(p.name,250)&&!!p.name.trim()&&Number.isInteger(p.qty)&&p.qty>=1&&p.qty<=50&&str(p.note,500));
}
