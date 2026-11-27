import {powerRangesFor} from './storefront-config';
export type KnowledgeKind='engine'|'technical';
export type ReviewState='draft'|'approved'|'rejected';
export type EngineEntry={kind:'engine';version:string;variant:string;configuration:string;block:string;crank:string;rods:string;pistons:string;head:string;boreMm:number|null;strokeMm:number|null;rodLengthMm:number|null;compressionRatio:number|null;targetPowerPs:number|null;targetTorqueNm:number|null;fuel:string;notes:string};
export type TechnicalEntry={kind:'technical';catalogSource:'fmic'|'manual';sku:string;parameter:string;value:string;unit:string;conditions:string;notes:string};
export type KnowledgeInput={id:string;revision:number;sourceKind:'manufacturer'|'supplier'|'workshop'|'other';sourceUrl:string;sourceLocator:string;excerpt:string;entry:EngineEntry|TechnicalEntry};
export type ProductIdentity={sku:string;name:string;brand:string;mpn:string;ean:string;category:string};
export type KnowledgeRecord=KnowledgeInput&{status:ReviewState;updatedAt:string;reviewedAt:string|null;reviewNote:string;identity:ProductIdentity|null};
const str=(v:unknown,max:number,required=false):v is string=>typeof v==='string'&&v.length<=max&&(!required||!!v.trim());
const num=(v:unknown,min:number,max:number)=>v===null||typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function isKnowledgeKind(v:unknown):v is KnowledgeKind{return v==='engine'||v==='technical'}
export function validKnowledgeId(v:unknown):v is string{return typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v)}
export function validSourceUrl(v:unknown):v is string{
 if(!str(v,2048))return false;
 if(!v)return true;
 try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!!u.hostname}catch{return false}
}
export function validKnowledgeInput(raw:unknown):raw is KnowledgeInput{
 if(!raw||typeof raw!=='object')return false;
 const x=raw as KnowledgeInput,e=x.entry;
 if(!validKnowledgeId(x.id)||!Number.isSafeInteger(x.revision)||x.revision<0||x.revision>=2147483647||!['manufacturer','supplier','workshop','other'].includes(x.sourceKind)||!validSourceUrl(x.sourceUrl)||!str(x.sourceLocator,500,true)||!str(x.excerpt,500,true)||!e||!isKnowledgeKind(e.kind)||!str(e.notes,2000))return false;
 if(x.sourceKind!=='workshop'&&!x.sourceUrl)return false;
 if(e.kind==='technical')return ['fmic','manual'].includes(e.catalogSource)&&str(e.sku,120,true)&&str(e.parameter,80,true)&&/^[a-z][a-z0-9_]{0,79}$/.test(e.parameter)&&str(e.value,500,true)&&str(e.unit,40)&&str(e.conditions,500);
 return str(e.version,30,true)&&!!powerRangesFor(e.version).length&&str(e.variant,100,true)&&str(e.configuration,120,true)&&[e.block,e.crank,e.rods,e.pistons,e.head,e.fuel].every(v=>str(v,200))&&num(e.boreMm,1,150)&&num(e.strokeMm,1,150)&&num(e.rodLengthMm,50,300)&&num(e.compressionRatio,4,20)&&num(e.targetPowerPs,1,3000)&&num(e.targetTorqueNm,1,5000);
}
export function cleanKnowledgeInput(x:KnowledgeInput):KnowledgeInput{
 const e=x.entry;
 const entry:EngineEntry|TechnicalEntry=e.kind==='engine'?{kind:e.kind,version:e.version,variant:e.variant.trim(),configuration:e.configuration.trim(),block:e.block,crank:e.crank,rods:e.rods,pistons:e.pistons,head:e.head,boreMm:e.boreMm,strokeMm:e.strokeMm,rodLengthMm:e.rodLengthMm,compressionRatio:e.compressionRatio,targetPowerPs:e.targetPowerPs,targetTorqueNm:e.targetTorqueNm,fuel:e.fuel,notes:e.notes}:{kind:e.kind,catalogSource:e.catalogSource,sku:e.sku.trim(),parameter:e.parameter,value:e.value.trim(),unit:e.unit,conditions:e.conditions,notes:e.notes};
 return {id:x.id,revision:x.revision,sourceKind:x.sourceKind,sourceUrl:x.sourceUrl,sourceLocator:x.sourceLocator.trim(),excerpt:x.excerpt.trim(),entry};
}
export function sameIdentity(a:ProductIdentity|null,b:ProductIdentity|null){
 return !!a&&!!b&&(['sku','name','brand','mpn','ean','category'] as const).every(k=>a[k]===b[k]);
}
export function validKnowledgeRecord(raw:unknown):raw is KnowledgeRecord{
 if(!validKnowledgeInput(raw))return false;
 const x=raw as KnowledgeRecord;
 return ['draft','approved','rejected'].includes(x.status)&&str(x.updatedAt,40,true)&&(x.reviewedAt===null||str(x.reviewedAt,40,true))&&str(x.reviewNote,500)&&(x.status==='draft'||!!x.reviewedAt&&!!x.reviewNote.trim())&&(x.entry.kind==='engine'?x.identity===null:!!x.identity&&(['sku','name','brand','mpn','ean','category'] as const).every(k=>str(x.identity![k],4000)));
}
export function emptyKnowledge(kind:KnowledgeKind,id:string):KnowledgeInput{
 const entry:EngineEntry|TechnicalEntry=kind==='engine'?{kind,version:'m54b30',variant:'',configuration:'',block:'',crank:'',rods:'',pistons:'',head:'',boreMm:null,strokeMm:null,rodLengthMm:null,compressionRatio:null,targetPowerPs:null,targetTorqueNm:null,fuel:'',notes:''}:{kind,catalogSource:'fmic',sku:'',parameter:'',value:'',unit:'',conditions:'',notes:''};
 return {id,revision:0,sourceKind:'workshop',sourceUrl:'',sourceLocator:'',excerpt:'',entry};
}
