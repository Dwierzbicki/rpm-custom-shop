import {assemblies,engineIds} from './audit';
import {hasLicensedImage,type Diagram,type Part,type Localized,type Usage} from './catalog';
export type Profile={id:string;engine:string;vehicle:string;market:string;production:string;fitmentEvidence:string;coverage:{assemblyId:string;status:'complete'|'not-applicable';evidence:string}[]};
export type ReleasePart=Part&{key:string;manufacturer:'BMW'|'Toyota';technicalEvidence:string;sku?:string;unavailableReason?:Localized;unit:'piece'|'set'};
export type ReleaseUsage=Usage&{partKey:string;quantityUnit:'piece'|'set';mountingEvidence:string;torque?:string;torqueSource?:string;replacement:'always'|'inspect'|'not-applicable';hotspots:{x:number;y:number}[]};
export type ReleaseDiagram=Diagram&{sourceId:string;profileId:string;assemblyIds:string[];image:{path:string;rightsEvidence:string;sha256:string};usages:ReleaseUsage[]};
export type HardwareRelease={schema:1;revision:string;reviewedBy:string;reviewDate:string;scopeEvidence:string;rightsEvidence:string;profiles:Profile[];parts:ReleasePart[];diagrams:ReleaseDiagram[]};
export type ReleaseCheck={ok:true;release:HardwareRelease}|{ok:false;errors:string[]};
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const str=(v:unknown,max=2000):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\u0000-\u0008]/.test(v);
const id=(v:unknown):v is string=>str(v,120)&&/^[A-Za-z0-9._:-]+$/.test(v);
const loc=(v:unknown)=>obj(v)&&str(v.pl)&&str(v.en);
const https=(v:unknown)=>{if(!str(v,1500))return false;try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}};
const knownAssembly=new Set(assemblies.map(a=>a[0]));
export function validateRelease(value:unknown):ReleaseCheck{
 const errors:string[]=[];
 const fail=(s:string)=>{if(errors.length<100)errors.push(s)};
 if(!obj(value))return {ok:false,errors:['Brak zatwierdzonego wydania katalogu.']};
 if(value.schema!==1||!id(value.revision)||!str(value.reviewedBy,200)||!str(value.reviewDate,10)||!/^\d{4}-\d{2}-\d{2}$/.test(String(value.reviewDate))||!str(value.scopeEvidence)||!str(value.rightsEvidence))fail('Brak metadanych wydania, przeglądu, zakresu lub uprawnień.');
 if(!Array.isArray(value.profiles)||!Array.isArray(value.parts)||!Array.isArray(value.diagrams)||!value.profiles.length||!value.parts.length||!value.diagrams.length)return {ok:false,errors:[...errors,'Wydanie musi zawierać profile, części i schematy.']};
 const profiles=new Map<string,Record<string,unknown>>(),parts=new Map<string,Record<string,unknown>>(),skus=new Set<string>(),diagramIds=new Set<string>(),covered=new Set<string>(),used=new Set<string>(),engines=new Set<string>();
 for(const p of value.profiles){
  if(!obj(p)||!id(p.id)||!str(p.engine,80)||!engineIds.some(e=>e===p.engine)||!str(p.vehicle,250)||!str(p.market,100)||!str(p.production,150)||!str(p.fitmentEvidence)||!Array.isArray(p.coverage)){fail('Niepoprawny profil pojazdu.');continue}
  if(profiles.has(p.id)){fail('Duplikat profilu '+p.id);continue}
  profiles.set(p.id,p);engines.add(p.engine);
  const seen=new Set<string>();
  for(const a of p.coverage){
   if(!obj(a)||!str(a.assemblyId,120)||!knownAssembly.has(a.assemblyId)||!['complete','not-applicable'].includes(String(a.status))||!str(a.evidence)){fail('Brak potwierdzenia zespołu w '+p.id);continue}
   if(seen.has(a.assemblyId))fail('Powtórzony zespół w '+p.id+': '+a.assemblyId);
   seen.add(a.assemblyId);
  }
  if(!p.coverage.some(a=>obj(a)&&a.status==='complete'))fail('Profil bez żadnego zweryfikowanego zespołu '+p.id);
  for(const assembly of knownAssembly)if(!seen.has(assembly))fail('Brak zespołu '+p.id+' / '+assembly);
 }
 for(const engine of engineIds)if(!engines.has(engine))fail('Brak profilu silnika '+engine);
 for(const p of value.parts){
  if(!obj(p)||!id(p.key)||!id(p.oem)||!['BMW','Toyota'].includes(String(p.manufacturer))||p.key!==p.manufacturer+':'+p.oem||!loc(p.name)||!str(p.dimension)||p.dimensionStatus!==undefined||!str(p.technicalEvidence)||!['piece','set'].includes(String(p.unit))){fail('Niepoprawna część lub brak specyfikacji technicznej.');continue}
  if(parts.has(p.key)){fail('Duplikat OEM '+p.key);continue}
  const sell=id(p.sku), unavailable=loc(p.unavailableReason);
  if(sell===unavailable)fail('Wybierz dokładnie jeden stan handlowy: SKU albo powód braku sprzedaży '+p.key);
  if(sell){if(skus.has(p.sku as string))fail('SKU przypisano do kilku OEM bez jawnej weryfikacji '+p.sku);skus.add(p.sku as string)}
  parts.set(p.key,p);
 }
 for(const d of value.diagrams){
  if(!obj(d)||!id(d.id)||!id(d.sourceId)||!id(d.profileId)||!profiles.has(d.profileId)||!loc(d.title)||!https(d.source)||!Array.isArray(d.assemblyIds)||!d.assemblyIds.length||!Array.isArray(d.usages)||!d.usages.length||!obj(d.image)||!str(d.image.path)||!str(d.image.rightsEvidence)||!str(d.image.sha256,64)||! /^[a-f0-9]{64}$/.test(d.image.sha256)||!hasLicensedImage(d as unknown as Diagram)){fail('Niekompletny schemat, źródło lub prawa do ilustracji.');continue}
  if(diagramIds.has(d.id)){fail('Duplikat schematu '+d.id);continue}
  diagramIds.add(d.id);
  const profile=profiles.get(d.profileId)!;
  if(d.engine!==profile.engine||d.vehicle!==profile.vehicle)fail('Niezgodny profil schematu '+d.id);
  const coverage=profile.coverage as unknown[];
  const seenAssemblies=new Set<string>();
  for(const a of d.assemblyIds){
   if(typeof a!=='string'||!knownAssembly.has(a)||!coverage.some(c=>obj(c)&&c.assemblyId===a&&c.status==='complete')||seenAssemblies.has(a)){fail('Nieprawidłowy zespół schematu '+d.id);continue}
   seenAssemblies.add(a);covered.add(d.profileId+'|'+a);
  }
  const positions=new Set<string>();
  for(const u of d.usages){
   if(!obj(u)||!id(u.position)||!id(u.partKey)||!id(u.oem)||!Number.isSafeInteger(u.quantity)||Number(u.quantity)<1||Number(u.quantity)>1000||!['piece','set'].includes(String(u.quantityUnit))||!loc(u.location)||!str(u.mountingEvidence)||(u.torque!==undefined&&!str(u.torque))||(u.torqueSource!==undefined&&!str(u.torqueSource))||Boolean(u.torque)!==Boolean(u.torqueSource)||!['always','inspect','not-applicable'].includes(String(u.replacement))||!Array.isArray(u.hotspots)||!u.hotspots.length||u.hotspots.length>100||!u.hotspots.every(h=>obj(h)&&typeof h.x==='number'&&Number.isFinite(h.x)&&h.x>=0&&h.x<=1&&typeof h.y==='number'&&Number.isFinite(h.y)&&h.y>=0&&h.y<=1)){fail('Niekompletne zastosowanie w '+d.id);continue}
   if(positions.has(u.position))fail('Powtórzona pozycja '+d.id+' / '+u.position+'; rozdziel warianty pojazdu.');
   positions.add(u.position);
   const p=parts.get(u.partKey);
   if(!p||p.oem!==u.oem||p.unit!==u.quantityUnit||p.manufacturer!==(String(profile.engine).startsWith('2JZ')?'Toyota':'BMW'))fail('Niezgodne OEM, marka lub jednostka '+d.id+' / '+u.position);
   else used.add(u.partKey);
  }
 }
 for(const [key,p] of profiles)for(const a of p.coverage as unknown[])if(obj(a)&&a.status==='complete'&&!covered.has(key+'|'+a.assemblyId))fail('Brak schematu dla kompletnego zespołu '+key+' / '+a.assemblyId);
 for(const p of parts.keys())if(!used.has(p))fail('Część bez zastosowania '+p);
 return errors.length?{ok:false,errors}:{ok:true,release:value as unknown as HardwareRelease};
}
