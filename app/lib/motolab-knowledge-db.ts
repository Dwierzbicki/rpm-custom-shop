import {getDbPool} from './db';
import {cleanKnowledgeInput,validKnowledgeRecord,sameIdentity,type KnowledgeKind,type KnowledgeInput,type KnowledgeRecord,type TechnicalEntry,type ProductIdentity} from './motolab-knowledge';
const prefix=(kind:KnowledgeKind)=>'motolab_knowledge_v1:'+kind+':';
export class KnowledgeConflict extends Error{}
export async function listKnowledge(kind:KnowledgeKind){
 const r=await getDbPool().query<{data:unknown}>('SELECT data FROM rpm_shop_settings WHERE key LIKE $1 ORDER BY updated_at DESC LIMIT 201',[prefix(kind)+'%']);
 const records=r.rows.slice(0,200).map(r=>r.data).filter(validKnowledgeRecord);
 return {records,truncated:r.rows.length>200};
}
type Queryable=Pick<ReturnType<typeof getDbPool>,'query'>;
async function identity(db:Queryable,e:TechnicalEntry):Promise<ProductIdentity>{
 const sql=e.catalogSource==='fmic'?`SELECT sku,name,coalesce(data->>'brand','') brand,coalesce(data->>'mpn','') mpn,coalesce(data->>'ean','') ean,coalesce(to_jsonb(target_category)::text,'') category FROM rpm_fmic_catalog WHERE sku=$1`:`SELECT data->>'sku' sku,data->>'name' name,coalesce(data->>'brand','') brand,coalesce(data->>'mpn','') mpn,coalesce(data->>'ean','') ean,coalesce((data->'category')::text,'') category FROM rpm_catalog WHERE data->>'sku'=$1 AND id NOT IN (SELECT id FROM rpm_catalog_deleted) LIMIT 2`;
 const r=await db.query<ProductIdentity>(sql,[e.sku]);
 if(r.rows.length!==1||!r.rows[0].name)throw new KnowledgeConflict('SKU nie istnieje lub nie jest jednoznaczne w wybranym katalogu.');
 return r.rows[0];
}
export async function saveKnowledge(input:KnowledgeInput){
 const x=cleanKnowledgeInput(input),key=prefix(x.entry.kind)+x.id,db=getDbPool();
 const snapshot=x.entry.kind==='technical'?await identity(db,x.entry):null;
 const value:KnowledgeRecord={...x,revision:x.revision+1,status:'draft',updatedAt:new Date().toISOString(),reviewedAt:null,reviewNote:'',identity:snapshot};
 if(!validKnowledgeRecord(value))throw new KnowledgeConflict('Niepoprawny rekord.');
 const r=x.revision===0?await db.query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES($1,$2::jsonb,NOW()) ON CONFLICT DO NOTHING RETURNING key",[key,JSON.stringify(value)]):await db.query("UPDATE rpm_shop_settings SET data=$2::jsonb,updated_at=NOW() WHERE key=$1 AND data->>'revision'=$3 RETURNING key",[key,JSON.stringify(value),String(x.revision)]);
 if(r.rowCount!==1)throw new KnowledgeConflict('Rekord zmienił się. Odśwież panel przed zapisem.');
 return value;
}
export async function reviewKnowledge(kind:KnowledgeKind,id:string,revision:number,decision:'approved'|'rejected',note:string){
 const key=prefix(kind)+id,db=getDbPool();
 const r=await db.query<{data:unknown}>('SELECT data FROM rpm_shop_settings WHERE key=$1',[key]);
 const old=r.rows[0]?.data;
 if(!validKnowledgeRecord(old)||old.revision!==revision||old.status!=='draft')throw new KnowledgeConflict('Zatwierdzić można tylko aktualny szkic.');
 if(decision==='approved'&&old.entry.kind==='technical'&&!sameIdentity(old.identity,await identity(db,old.entry)))throw new KnowledgeConflict('Tożsamość SKU zmieniła się. Zweryfikuj źródło i zapisz nowy szkic.');
 const now=new Date().toISOString(),value:KnowledgeRecord={...old,revision:revision+1,status:decision,reviewedAt:now,reviewNote:note.trim(),updatedAt:now};
 const saved=await db.query("UPDATE rpm_shop_settings SET data=$2::jsonb,updated_at=NOW() WHERE key=$1 AND data->>'revision'=$3 AND data->>'status'='draft' RETURNING key",[key,JSON.stringify(value),String(revision)]);
 if(saved.rowCount!==1)throw new KnowledgeConflict('Rekord zmienił się. Odśwież panel.');
 return value;
}

/** Explicit operator import; stable IDs preserve all later edits and reviews. */
export async function importResearchBatch(){
 const {researchBatchV1}=await import('./motolab-research-batch-v1');
 const {validKnowledgeInput}=await import('./motolab-knowledge');
 const now=new Date().toISOString();
 const entries=researchBatchV1.map(input=>{if(!validKnowledgeInput(input)||input.entry.kind!=='engine'||input.revision!==0)throw Error('Invalid research batch');const record:KnowledgeRecord={...cleanKnowledgeInput(input),revision:1,status:'draft',updatedAt:now,reviewedAt:null,reviewNote:'',identity:null};if(!validKnowledgeRecord(record))throw Error('Invalid research record');return {key:prefix('engine')+record.id,data:record}});
 const r=await getDbPool().query("INSERT INTO rpm_shop_settings(key,data,updated_at) SELECT x->>'key',x->'data',NOW() FROM jsonb_array_elements($1::jsonb) x ON CONFLICT(key) DO NOTHING RETURNING key",[JSON.stringify(entries)]);
 return {added:r.rowCount??0,total:entries.length};
}
