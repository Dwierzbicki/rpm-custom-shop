import {powerRangesFor} from './storefront-config';
export type DynoPart={sku:string;name:string;qty:number;note:string};
export type EngineGeometry={block:string;crank:string;head:string;rods:string;pistons:string;boreMm:number|null;strokeMm:number|null};
export const emptyGeometry:EngineGeometry={block:'',crank:'',head:'',rods:'',pistons:'',boreMm:null,strokeMm:null};
export function displacementCc(g:EngineGeometry){return typeof g.boreMm==='number'&&typeof g.strokeMm==='number'&&g.boreMm>0&&g.strokeMm>0?Math.round(Math.PI/4*g.boreMm**2*g.strokeMm*6/1000):null}
export type DynoBuild={id:string;title:string;version:string;powerPs:number;torqueNm:number;basis:'crank'|'wheel';fuel:string;usage:'street'|'drift'|'track';chartUrl:string;notes:string;parts:DynoPart[];published:boolean;attested:boolean;geometry?:EngineGeometry;measurement?:DynoMeasurement;conditions?:DynoConditions};
export function validDynoBuild(x:unknown):x is DynoBuild{
 if(!x||typeof x!=='object')return false;
 const b=x as DynoBuild;
 const str=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max;
 const num=(v:unknown,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=max;
 if(!str(b.id,36)||!/^[0-9a-f-]{36}$/.test(b.id)||!str(b.title,120)||!b.title.trim()||!str(b.version,20)||!powerRangesFor(b.version).length||!num(b.powerPs,3000)||!num(b.torqueNm,5000)||!['crank','wheel'].includes(b.basis)||!str(b.fuel,100)||!b.fuel.trim()||!['street','drift','track'].includes(b.usage)||!str(b.notes,4000)||!str(b.chartUrl,500)||typeof b.published!=='boolean'||typeof b.attested!=='boolean'||!Array.isArray(b.parts)||b.parts.length>50)return false;
 if(b.chartUrl){try{const u=new URL(b.chartUrl);if(u.origin!=='https://res.cloudinary.com'||u.username||u.password||!u.pathname.includes('/image/upload/'))return false}catch{return false}}
 if(b.measurement!==undefined&&!validDynoMeasurement(b.measurement))return false;
 if(b.conditions!==undefined&&!validDynoConditions(b.conditions))return false;
 if(b.geometry!==undefined){
  const g=b.geometry;if(!g||typeof g!=='object'||![g.block,g.crank,g.head,g.rods,g.pistons].every(v=>str(v,200)))return false;
  if(![g.boreMm,g.strokeMm].every(v=>v===null||num(v,150)))return false;
 }
 if(b.published&&b.version==='m50b30-stroker'&&(!b.geometry||![b.geometry.block,b.geometry.crank,b.geometry.head,b.geometry.rods,b.geometry.pistons].every(v=>v.trim())||!displacementCc(b.geometry)))return false;
 if(b.published&&(!b.attested||!b.chartUrl||!b.parts.length))return false;
 return b.parts.every(p=>p&&str(p.sku,120)&&str(p.name,250)&&!!p.name.trim()&&Number.isInteger(p.qty)&&p.qty>=1&&p.qty<=50&&str(p.note,500));
}

export type DynoPoint={rpm:number;powerPs:number;torqueNm:number};
export type DynoMeasurement={source:'csv'|'manual-transcription';points:DynoPoint[]};
export type DynoConditions={turbo:string;camshafts:string;ecu:string;dyno:string;correction:string;boostBar:number|null;compressionRatio:number|null};
export const emptyDynoConditions:DynoConditions={turbo:'',camshafts:'',ecu:'',dyno:'',correction:'',boostBar:null,compressionRatio:null};
export function validDynoConditions(raw:unknown):raw is DynoConditions{
 if(!raw||typeof raw!=='object')return false;
 const c=raw as DynoConditions;
 return [c.turbo,c.camshafts,c.ecu,c.dyno,c.correction].every(v=>typeof v==='string'&&v.length<=200)
 &&(c.boostBar===null||typeof c.boostBar==='number'&&Number.isFinite(c.boostBar)&&c.boostBar>=0&&c.boostBar<=10)
 &&(c.compressionRatio===null||typeof c.compressionRatio==='number'&&Number.isFinite(c.compressionRatio)&&c.compressionRatio>=4&&c.compressionRatio<=20);
}
export function validDynoMeasurement(raw:unknown):raw is DynoMeasurement{
 if(!raw||typeof raw!=='object')return false;
 const m=raw as DynoMeasurement;
 if(!['csv','manual-transcription'].includes(m.source)||!Array.isArray(m.points)||m.points.length<2||m.points.length>400)return false;
 return m.points.every((p,i)=>p&&typeof p==='object'&&Object.keys(p).length===3&&
 Number.isInteger(p.rpm)&&p.rpm>=500&&p.rpm<=15000&&(!i||p.rpm>m.points[i-1].rpm)&&
 typeof p.powerPs==='number'&&Number.isFinite(p.powerPs)&&p.powerPs>=0&&p.powerPs<=3000&&
 typeof p.torqueNm==='number'&&Number.isFinite(p.torqueNm)&&p.torqueNm>=0&&p.torqueNm<=5000);
}
/** Explicit units only; no automatic guesses or resampling. One ascending dyno run. */
export function parseDynoCsv(raw:string,source:DynoMeasurement['source']='csv'):DynoMeasurement{
 if(raw.length>50000)throw Error('Plik jest za duży.');
 const lines=raw.replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(l=>l.trim());
 const sep=lines[0]?.includes(';')?';':',';
 if(lines[0]?.split(sep).map(v=>v.trim().toLowerCase()).join(',')!=='rpm,power_ps,torque_nm')throw Error('Wymagany nagłówek: rpm,power_ps,torque_nm');
 if(lines.length<3||lines.length>401)throw Error('Wymagane 2–400 punktów pomiaru.');
 const points=lines.slice(1).map((line,i)=>{
  const cells=line.split(sep).map(v=>v.trim());
  if(cells.length!==3||!cells.every(v=>sep===';'?/^\d+(?:[.,]\d+)?$/.test(v):/^\d+(?:\.\d+)?$/.test(v)))throw Error('Niepoprawne wartości w wierszu '+(i+2));
  const [rpm,powerPs,torqueNm]=cells.map(v=>Number(v.replace(',','.')));
  return {rpm,powerPs,torqueNm};
 });
 const measurement={source,points};
 if(!validDynoMeasurement(measurement))throw Error('Sprawdź zakresy i rosnące RPM bez duplikatów.');
 return measurement;
}
export function analyseDyno(m:DynoMeasurement){
 if(!validDynoMeasurement(m))return null;
 const points=m.points;
 const powerPeak=points.reduce((best,p)=>p.powerPs>best.powerPs?p:best);
 const torquePeak=points.reduce((best,p)=>p.torqueNm>best.torqueNm?p:best);
 const at=(rpm:number)=>{
  const exact=points.find(p=>p.rpm===rpm);if(exact)return {torqueNm:exact.torqueNm,interpolated:false};
  const i=points.findIndex(p=>p.rpm>rpm);
  if(i<1)return null;
  const a=points[i-1],b=points[i];if(b.rpm-a.rpm>500)return null;
  return {torqueNm:Math.round((a.torqueNm+(b.torqueNm-a.torqueNm)*(rpm-a.rpm)/(b.rpm-a.rpm))*10)/10,interpolated:true};
 };
 // P[PS] = torque[Nm] * RPM / 7023.5. Flag rather than silently correct source data.
 const inconsistentPoints=points.filter(p=>Math.abs(p.powerPs-p.torqueNm*p.rpm/7023.5)>Math.max(10,p.powerPs*.05)).length;
 return {powerPeak,torquePeak,torqueAt3000:at(3000),torqueAt4000:at(4000),rpmMin:points[0].rpm,rpmMax:points[points.length-1].rpm,inconsistentPoints};
}
