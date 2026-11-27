import type {KnowledgeRecord,EngineEntry} from './motolab-knowledge';
/** Public research references only; approved technical SKU records never turn
 * into automatic parts matches here. No notes, excerpts or review metadata. */
const publicResearchHosts=new Set(['turbobmw.pl','zgrywusgarage.pl','bmwklubpolska.pl','bimmerforums.com']);
function publicSource(url:string){
 try{const u=new URL(url);return u.protocol==='https:'&&publicResearchHosts.has(u.hostname.toLowerCase().replace(/^www\./,''))&&!u.username&&!u.password}catch{return false}
}
export type BuildEvidence={id:string;configuration:string;variant:string;block:string;crank:string;rods:string;pistons:string;head:string;boreMm:number|null;strokeMm:number|null;rodLengthMm:number|null;compressionRatio:number|null;sourceUrl:string;alternative:boolean};
export function evidenceVersions(version:string):string[]{return version==='m50b30-stroker'?[version,'m50b25']:[version]}
export function buildEvidenceFor(records:readonly KnowledgeRecord[],version:string):BuildEvidence[]{
 const versions=evidenceVersions(version);
 return records.flatMap(r=>{
  if(r.status!=='approved'||r.entry.kind!=='engine'||!versions.includes(r.entry.version)||!publicSource(r.sourceUrl))return [];
  const e:EngineEntry=r.entry;
  return [{id:r.id,configuration:e.configuration,variant:e.variant,block:e.block,crank:e.crank,rods:e.rods,pistons:e.pistons,head:e.head,boreMm:e.boreMm,strokeMm:e.strokeMm,rodLengthMm:e.rodLengthMm,compressionRatio:e.compressionRatio,sourceUrl:r.sourceUrl,alternative:e.version!==version}];
 });
}
