import {NextResponse} from 'next/server';
import {readProcurement,ProcurementNotFound} from '../../../../lib/procurement-db';
import {makeSupplierCsv} from '../../../../lib/procurement-export';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
 const url=new URL(request.url);
 const orderId=url.searchParams.get('orderId');
 const supplier=url.searchParams.get('supplier');
 const fingerprint=url.searchParams.get('fingerprint');
 if(!orderId||!/^[1-9][0-9]{0,17}$/.test(orderId)
  ||(supplier!=='fmic'&&supplier!=='mtuning')
  ||!fingerprint||!/^[a-f0-9]{64}$/.test(fingerprint)){
  return NextResponse.json({error:'Nieprawidłowe zamówienie, dostawca lub wersja szkicu'},{status:400});
 }
 try{
  const {plan,procurement}=await readProcurement(orderId);
  if(!procurement||procurement.status==='draft'){
   return NextResponse.json({error:'Wymagany zatwierdzony szkic zakupowy'},{status:409});
  }
  if(fingerprint!==procurement.fingerprint){
   return NextResponse.json({error:'Szkic zmienił się. Odśwież widok przed eksportem'},{status:409});
  }
  if(procurement.status==='approved'&&plan.fingerprint!==procurement.fingerprint){
   return NextResponse.json({error:'Ceny, oferty lub zamówienie zmieniły się. Ponownie zatwierdź szkic'},{status:409});
  }
  if(procurement.status!=='approved'&&procurement.status!=='placed_manually'){
   return NextResponse.json({error:'Niepoprawny status szkicu zakupowego'},{status:409});
  }
  // Always export the reviewed snapshot, not an unapproved live recomputation.
  const {csv,filename}=makeSupplierCsv(procurement.plan,supplier);
  return new NextResponse(csv,{
   status:200,
   headers:{
    'Content-Type':'text/csv; charset=utf-8',
    'Content-Disposition':'attachment; filename="'+filename+'"',
    'Cache-Control':'no-store, private',
    'X-Content-Type-Options':'nosniff',
   },
  });
 }catch(error){
  if(error instanceof ProcurementNotFound)return NextResponse.json({error:'Nie znaleziono zamówienia'},{status:404});
  if(error instanceof Error&&/Brak pozycji|Nie można eksportować|niekompletnej oferty|Nieprawidłowy numer/.test(error.message)){
   return NextResponse.json({error:error.message},{status:422});
  }
  console.error('[procurement-export] unavailable',{type:error instanceof Error?error.name:'Unknown'});
  return NextResponse.json({error:'Eksport niedostępny. Spróbuj ponownie'},{status:503});
 }
}
