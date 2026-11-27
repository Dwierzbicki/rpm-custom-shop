import {NextResponse} from 'next/server';
import {validAiRequest} from '../../../../lib/motolab-ai-research';
import {aiQuota,runAi,AiUnavailable,AiQuotaExceeded} from '../../../../lib/motolab-ai-research-server';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=90;
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){try{return reply(await aiQuota())}catch{return reply({error:'Nie można odczytać limitów.'},503)}}
export async function POST(r:Request){
 try{const origin=r.headers.get('origin'),host=r.headers.get('host');if(!origin||!host||new URL(origin).host!==host)return reply({error:'Niedozwolone pochodzenie'},403);
 if(!r.headers.get('content-type')?.includes('application/json'))return reply({error:'Wymagany JSON'},415);
 const raw=await r.text();if(raw.length>4000)return reply({error:'Za duże żądanie'},413);
 let input:unknown;try{input=JSON.parse(raw)}catch{return reply({error:'Niepoprawny JSON'},400)}
 if(!validAiRequest(input))return reply({error:'Sprawdź parametry i potwierdź płatne zapytanie.'},400);
 return reply(await runAi(input));
 }catch(e){if(e instanceof AiQuotaExceeded)return reply({error:e.message},429);if(e instanceof AiUnavailable)return reply({error:e.message},503);return reply({error:'Nie udało się zakończyć researchu. Nic nie zapisano. Wysłana próba zużywa limit.'},502)}
}
