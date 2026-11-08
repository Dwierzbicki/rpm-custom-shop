import {NextResponse} from 'next/server';
import {readProcurement,saveProcurementDraft,changeProcurement,
 ProcurementConflict,ProcurementInvalid,ProcurementNotFound} from '../../../lib/procurement-db';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const validOrderId=(value:unknown):value is string=>
 typeof value==='string'&&/^[1-9][0-9]{0,17}$/.test(value);

function sameOrigin(request:Request){
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 try{return !!origin&&!!host&&new URL(origin).host===host}catch{return false}
}
function reject(error:unknown){
 if(error instanceof ProcurementNotFound)return NextResponse.json({error:error.message},{status:404});
 if(error instanceof ProcurementConflict)return NextResponse.json({error:error.message},{status:409});
 if(error instanceof ProcurementInvalid)return NextResponse.json({error:error.message},{status:422});
 console.error('[procurement] request failed',{type:error instanceof Error?error.name:'Unknown'});
 return NextResponse.json({error:'Nie udało się przetworzyć zakupu. Sprawdź bazę danych.'},{status:503});
}
async function parseBody(request:Request){
 if(!sameOrigin(request))return {error:'Niedozwolone pochodzenie',status:403} as const;
 if(!(request.headers.get('content-type')??'').includes('application/json'))
  return {error:'Wymagany JSON',status:415} as const;
 if(Number(request.headers.get('content-length'))>10_000)
  return {error:'Żądanie jest za duże',status:413} as const;
 let input:unknown;
 try{input=await request.json()}catch{return {error:'Niepoprawny JSON',status:400} as const}
 if(!input||typeof input!=='object'||Array.isArray(input))
  return {error:'Niepoprawne dane',status:400} as const;
 const body=input as Record<string,unknown>;
 if(!validOrderId(body.orderId)||typeof body.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(body.fingerprint))
  return {error:'Nieprawidłowe zamówienie lub podgląd',status:400} as const;
 return {body};
}
export async function GET(request:Request){
 const orderId=new URL(request.url).searchParams.get('orderId');
 if(!validOrderId(orderId))return NextResponse.json({error:'Nieprawidłowy numer zamówienia'},{status:400});
 try{
  const result=await readProcurement(orderId);
  return NextResponse.json({...result,notice:'Podgląd wewnętrzny. Nie kontaktuje się z dostawcami.'},
   {headers:{'Cache-Control':'no-store'}});
 }catch(error){return reject(error)}
}
export async function POST(request:Request){
 const input=await parseBody(request);
 if('error' in input)return NextResponse.json({error:input.error},{status:input.status});
 const body=input.body;
 if(body.confirm!=='SAVE_DRAFT')return NextResponse.json({error:'Potwierdź utworzenie szkicu'},{status:400});
 try{
  const procurement=await saveProcurementDraft(body.orderId as string,body.fingerprint as string);
  return NextResponse.json({procurement,note:'Szkic zapisany, nie wysłano zamówienia do dostawcy.'},
   {headers:{'Cache-Control':'no-store'}});
 }catch(error){return reject(error)}
}
export async function PATCH(request:Request){
 const input=await parseBody(request);
 if('error' in input)return NextResponse.json({error:input.error},{status:input.status});
 const body=input.body,op=body.operation;
 if(op!=='approve'&&op!=='mark_placed'&&op!=='recheck')
  return NextResponse.json({error:'Niepoprawna operacja'},{status:400});
 const bools=['stock','price','variants','manualOnly','manualPlaced'] as const;
 const confirmation=body.confirmations;
 if(confirmation!==undefined&&(!confirmation||typeof confirmation!=='object'||Array.isArray(confirmation)))
  return NextResponse.json({error:'Niepoprawne potwierdzenia'},{status:400});
 const checks=confirmation as Record<string,unknown>|undefined;
 const verified=Object.fromEntries(bools.map(key=>[key,checks?.[key]===true]));
 try{
  const procurement=await changeProcurement(
   body.orderId as string,op,body.fingerprint as string,
   verified,typeof body.reference==='string'?body.reference:undefined
  );
  return NextResponse.json({procurement,
   note:op==='approve'?'Szkic zatwierdzony wewnętrznie. Nie wykonano zamówienia.':
    op==='recheck'?'Szkic ponownie otwarty. Zweryfikuj wszystkie ceny i dostępność.':
    'Zapisano oświadczenie o ręcznym złożeniu zamówienia u dostawcy.'},
   {headers:{'Cache-Control':'no-store'}});
 }catch(error){return reject(error)}
}
