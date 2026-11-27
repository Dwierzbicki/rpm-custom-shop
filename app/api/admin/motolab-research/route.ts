import {NextResponse} from 'next/server';
import {RESEARCH_MAX_CHARS,parseResearchRows} from '../../../lib/motolab-research-center';
import {importResearchRows} from '../../../lib/motolab-knowledge-db';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});
export async function POST(r:Request){
 try{
 const origin=r.headers.get('origin'),host=r.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return reply({error:'Niedozwolone pochodzenie'},403);
 if(!r.headers.get('content-type')?.includes('application/json'))return reply({error:'Wymagany JSON'},415);
 const raw=await r.text();if(raw.length>RESEARCH_MAX_CHARS)return reply({error:'Za duże żądanie'},413);
 let inputs;try{inputs=parseResearchRows(JSON.parse(raw))}catch(e){return reply({error:e instanceof Error?e.message:'Niepoprawny JSON'},400)}
 return reply(await importResearchRows(inputs));
 }catch{return reply({error:'Błąd importu bazy wiedzy'},503)}
}
