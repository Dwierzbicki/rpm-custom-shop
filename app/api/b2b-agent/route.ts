import {NextResponse} from 'next/server';
import {verifyB2BAgentBearer,agentAuthConfigured,InvalidAgentEvent} from '../../lib/b2b-agent-protocol';
import {recordB2BAgentEvent,QueueConflict,QueueInvalid} from '../../lib/b2b-queue-db';
import {ProcurementConflict,ProcurementInvalid,ProcurementNotFound} from '../../lib/procurement-db';

export const runtime='nodejs';
export const dynamic='force-dynamic';

// Only a separately provisioned local worker token can post; never reuse the
// admin session cookie or accept tokens from URL/query parameters.
export async function POST(request:Request){
 const secret=process.env.RPM_B2B_AGENT_TOKEN;
 if(!agentAuthConfigured(secret)){
  return NextResponse.json({error:'Agent monitorujący nie jest skonfigurowany'},{status:503});
 }
 if(!verifyB2BAgentBearer(request.headers.get('authorization'),secret)){
  return NextResponse.json({error:'Nieprawidłowy token agenta'},{status:401,
   headers:{'WWW-Authenticate':'Bearer','Cache-Control':'no-store'}});
 }
 if(!(request.headers.get('content-type')??'').toLowerCase().startsWith('application/json')){
  return NextResponse.json({error:'Wymagany JSON'},{status:415});
 }
 const length=Number(request.headers.get('content-length'));
 if(Number.isFinite(length)&&length>3000){
  return NextResponse.json({error:'Zbyt duży raport etapu'},{status:413});
 }
 let body:unknown;
 try{
  const raw=await request.text();
  if(raw.length>3000)return NextResponse.json({error:'Zbyt duży raport etapu'},{status:413});
  body=JSON.parse(raw);
 }catch{return NextResponse.json({error:'Niepoprawny JSON'},{status:400})}
 try{
  const result=await recordB2BAgentEvent(body);
  return NextResponse.json(result,{
   headers:{'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'},
  });
 }catch(error){
  if(error instanceof InvalidAgentEvent||error instanceof QueueInvalid||
     error instanceof ProcurementInvalid){
   return NextResponse.json({error:error.message},{status:422});
  }
  if(error instanceof QueueConflict||error instanceof ProcurementConflict){
   return NextResponse.json({error:error.message},{status:409});
  }
  if(error instanceof ProcurementNotFound){
   return NextResponse.json({error:error.message},{status:404});
  }
  console.error('[b2b-agent] event rejected',{type:error instanceof Error?error.name:'Unknown'});
  return NextResponse.json({error:'Nie można zapisać zdarzenia agenta'},{status:503});
 }
}
