import {NextResponse} from 'next/server';
import {isKnowledgeKind,validKnowledgeId,validKnowledgeInput} from '../../../lib/motolab-knowledge';
import {listKnowledge,saveKnowledge,reviewKnowledge,KnowledgeConflict,importResearchBatch} from '../../../lib/motolab-knowledge-db';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});
export async function GET(r:Request){
 const kind=new URL(r.url).searchParams.get('kind');
 if(!isKnowledgeKind(kind))return reply({error:'Nieznany moduł'},400);
 try{return reply(await listKnowledge(kind))}catch{return reply({error:'Błąd odczytu bazy wiedzy'},503)}
}
export async function PUT(r:Request){
 try{
 const origin=r.headers.get('origin'),host=r.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return reply({error:'Niedozwolone pochodzenie'},403);
 if(!r.headers.get('content-type')?.includes('application/json'))return reply({error:'Wymagany JSON'},415);
 const raw=await r.text();if(raw.length>16000)return reply({error:'Za duże żądanie'},413);
 const x=JSON.parse(raw);
 if(x?.action==='import-research-v1')return reply(await importResearchBatch('v1'));
 if(x?.action==='import-research-v2')return reply(await importResearchBatch('v2'));
 if(x?.action==='save'&&validKnowledgeInput(x.record))return reply({record:await saveKnowledge(x.record)});
 if(x?.action==='review'&&isKnowledgeKind(x.kind)&&validKnowledgeId(x.id)&&Number.isSafeInteger(x.revision)&&x.revision>0&&x.revision<2147483647&&['approved','rejected'].includes(x.decision)&&typeof x.note==='string'&&x.note.trim()&&x.note.length<=500)return reply({record:await reviewKnowledge(x.kind,x.id,x.revision,x.decision,x.note)});
 return reply({error:'Sprawdź wymagane pola, źródło i wartości.'},400);
 }catch(e){return reply({error:e instanceof KnowledgeConflict?e.message:'Błąd zapisu bazy wiedzy'},e instanceof KnowledgeConflict?409:400)}
}
