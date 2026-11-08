import {NextResponse} from 'next/server';
import {getB2BQueue,enqueueB2BTask,cancelB2BTask,recordB2BOfflineReport,
 QueueConflict,QueueInvalid} from '../../../lib/b2b-queue-db';
import {InvalidOfflineReport} from '../../../lib/b2b-queue-report';
import {ProcurementConflict,ProcurementInvalid,ProcurementNotFound} from '../../../lib/procurement-db';

export const runtime='nodejs';
export const dynamic='force-dynamic';
type Supplier='fmic'|'mtuning';
const idOK=(value:unknown):value is string=>typeof value==='string'&&/^[1-9][0-9]{0,17}$/.test(value);
const shaOK=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const supplierOK=(value:unknown):value is Supplier=>value==='fmic'||value==='mtuning';
function reject(error:unknown){
 if(error instanceof ProcurementNotFound)return NextResponse.json({error:error.message},{status:404});
 if(error instanceof QueueConflict||error instanceof ProcurementConflict)
  return NextResponse.json({error:error.message},{status:409});
 if(error instanceof QueueInvalid||error instanceof ProcurementInvalid||
  error instanceof InvalidOfflineReport)return NextResponse.json({error:error.message},{status:422});
 console.error('[b2b-queue] operation failed',{type:error instanceof Error?error.name:'Unknown'});
 return NextResponse.json({error:'Kolejka B2B chwilowo niedostępna'},{status:503});
}
function allowedOrigin(request:Request){
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 try{return !!origin&&!!host&&new URL(origin).host===host}catch{return false}
}
async function input(request:Request){
 if(!allowedOrigin(request))return {error:'Niedozwolone pochodzenie',status:403} as const;
 if(!(request.headers.get('content-type')??'').includes('application/json'))
  return {error:'Wymagany JSON',status:415} as const;
 if(Number(request.headers.get('content-length'))>24000)
  return {error:'Raport przekracza limit 24 KB',status:413} as const;
 let value:unknown;
 try{value=await request.json()}catch{return {error:'Niepoprawny JSON',status:400} as const}
 if(!value||typeof value!=='object'||Array.isArray(value))
  return {error:'Brak danych zadania',status:400} as const;
 const body=value as Record<string,unknown>;
 if(!idOK(body.orderId)||!supplierOK(body.supplier))
  return {error:'Nieprawidłowe zamówienie lub dostawca',status:400} as const;
 return {body,orderId:body.orderId,supplier:body.supplier};
}
export async function GET(request:Request){
 const url=new URL(request.url);
 const orderId=url.searchParams.get('orderId');
 if(!idOK(orderId))return NextResponse.json({error:'Nieprawidłowy numer zamówienia'},{status:400});
 try{return NextResponse.json(await getB2BQueue(orderId),{headers:{'Cache-Control':'no-store, private'}})}
 catch(error){return reject(error)}
}
export async function POST(request:Request){
 const data=await input(request);
 if('error' in data)return NextResponse.json({error:data.error},{status:data.status});
 const {body,orderId,supplier}=data;
 if(!shaOK(body.fingerprint))return NextResponse.json({error:'Nieprawidłowy fingerprint'},{status:400});
 try{
  if(body.action==='queue'){
   if(body.confirm!=='QUEUE_OFFLINE_DEMO')return NextResponse.json({error:'Potwierdź dodanie zadania testowego'},{status:400});
   return NextResponse.json(await enqueueB2BTask(orderId,supplier,body.fingerprint),
    {headers:{'Cache-Control':'no-store, private'}});
  }
  if(body.action==='report'){
   if(body.confirm!=='RECORD_OFFLINE_REPORT')return NextResponse.json({error:'Potwierdź zapis raportu'},{status:400});
   return NextResponse.json(await recordB2BOfflineReport(orderId,supplier,body.fingerprint,body.report),
    {headers:{'Cache-Control':'no-store, private'}});
  }
  return NextResponse.json({error:'Nieznana akcja'},{status:400});
 }catch(error){return reject(error)}
}
export async function PATCH(request:Request){
 const data=await input(request);
 if('error' in data)return NextResponse.json({error:data.error},{status:data.status});
 const {body,orderId,supplier}=data;
 if(body.action!=='cancel'||body.confirm!=='CANCEL_OFFLINE_DEMO'||!shaOK(body.jobId))
  return NextResponse.json({error:'Niepoprawne potwierdzenie anulowania'},{status:400});
 try{return NextResponse.json(await cancelB2BTask(orderId,supplier,body.jobId),
  {headers:{'Cache-Control':'no-store, private'}})}
 catch(error){return reject(error)}
}
