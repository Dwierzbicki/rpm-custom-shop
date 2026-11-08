import {NextResponse} from 'next/server';
import {agentAuthConfigured,verifyB2BAgentBearer} from '../../../lib/b2b-agent-protocol';
import {recordB2BCartPreflight,QueueConflict} from '../../../lib/b2b-queue-db';
import {InvalidCartPreflight} from '../../../lib/b2b-cart-preflight';
import {ProcurementNotFound,ProcurementConflict} from '../../../lib/procurement-db';

export const runtime='nodejs';
export const dynamic='force-dynamic';

/** Separate agent-only channel for read-only cart observations.
 * Does NOT have actions to remove items, checkout or place orders. */
export async function POST(request:Request){
 const secret=process.env.RPM_B2B_AGENT_TOKEN;
 if(!agentAuthConfigured(secret)){
  return NextResponse.json({error:'Monitor agenta nie jest skonfigurowany'},{status:503});
 }
 if(!verifyB2BAgentBearer(request.headers.get('authorization'),secret)){
  return NextResponse.json({error:'Nieautoryzowany agent'},{status:401,
   headers:{'Cache-Control':'no-store','WWW-Authenticate':'Bearer'}});
 }
 if(!(request.headers.get('content-type')??'').startsWith('application/json'))
  return NextResponse.json({error:'Wymagany JSON'},{status:415});
 const length=Number(request.headers.get('content-length'));
 if(Number.isFinite(length)&&length>15000)
  return NextResponse.json({error:'Zbyt duży raport koszyka'},{status:413});
 let body:unknown;
 try{
  const raw=await request.text();
  if(raw.length>15000)return NextResponse.json({error:'Zbyt duży raport koszyka'},{status:413});
  body=JSON.parse(raw);
 }catch{return NextResponse.json({error:'Niepoprawny JSON'},{status:400})}
 try{
  return NextResponse.json(await recordB2BCartPreflight(body),{
   headers:{'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'},
  });
 }catch(error){
  if(error instanceof InvalidCartPreflight)
   return NextResponse.json({error:error.message},{status:422});
  if(error instanceof QueueConflict||error instanceof ProcurementConflict)
   return NextResponse.json({error:error.message},{status:409});
  if(error instanceof ProcurementNotFound)
   return NextResponse.json({error:error.message},{status:404});
  console.error('[fmic-preflight] rejected',{type:error instanceof Error?error.name:'Unknown'});
  return NextResponse.json({error:'Nie można zapisać odczytu koszyka'},{status:503});
 }
}
