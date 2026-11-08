import {NextResponse} from 'next/server';
import {getB2BQueueOverview} from '../../../lib/b2b-queue-db';

export const runtime='nodejs';
export const dynamic='force-dynamic';

/** Read-only operator dashboard, protected by the existing admin middleware. */
export async function GET(){
 try{
  const data=await getB2BQueueOverview();
  return NextResponse.json({...data,mode:'local-agent-telemetry',liveVendorWorker:false,
   localAgentTelemetryEnabled:(process.env.RPM_B2B_AGENT_TOKEN?.length??0)>=32},{
   headers:{'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'},
  });
 }catch(error){
  console.error('[b2b-monitor] unable to load',{type:error instanceof Error?error.name:'Unknown'});
  return NextResponse.json({error:'Nie można pobrać danych monitoringu z PostgreSQL'},{status:503});
 }
}
