import {NextResponse} from 'next/server';
import {readProcurement,ProcurementNotFound} from '../../../../lib/procurement-db';
import {createB2BFixtureJob} from '../../../../lib/b2b-fixture-job';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
 const url=new URL(request.url);
 const orderId=url.searchParams.get('orderId');
 const supplier=url.searchParams.get('supplier');
 const fingerprint=url.searchParams.get('fingerprint');
 if(!orderId||!/^[1-9][0-9]{0,17}$/.test(orderId)||
  (supplier!=='fmic'&&supplier!=='mtuning')||
  !fingerprint||!/^[a-f0-9]{64}$/.test(fingerprint)){
  return NextResponse.json({error:'Niepoprawne zamówienie, dostawca lub wersja szkicu'},{status:400});
 }
 try{
  const {plan,procurement}=await readProcurement(orderId);
  // Do not queue work for drafts or orders already placed manually.
  if(!procurement||procurement.status!=='approved'){
   return NextResponse.json({error:'Wymagany zatwierdzony i niezrealizowany szkic'},{status:409});
  }
  if(procurement.fingerprint!==fingerprint||plan.fingerprint!==fingerprint){
   return NextResponse.json({error:'Szkic lub dane dostawców zmieniły się. Odśwież i zatwierdź ponownie.'},{status:409});
  }
  const job=createB2BFixtureJob(procurement.plan,supplier);
  return NextResponse.json(job,{
   headers:{
    'Cache-Control':'no-store, private',
    'Content-Disposition':'attachment; filename="rpm-b2b-demo-'+orderId+'-'+supplier+'.json"',
    'X-Content-Type-Options':'nosniff',
   },
  });
 }catch(error){
  if(error instanceof ProcurementNotFound)return NextResponse.json({error:'Nie znaleziono zamówienia'},{status:404});
  if(error instanceof Error&&/Niepełne|Nieznany|Brak pozycji|Nie można eksportować|Nieprawidłow/.test(error.message)){
   return NextResponse.json({error:error.message},{status:422});
  }
  console.error('[b2b-fixture-job] generation failed',{type:error instanceof Error?error.name:'Unknown'});
  return NextResponse.json({error:'Nie udało się przygotować zadania testowego'},{status:503});
 }
}
