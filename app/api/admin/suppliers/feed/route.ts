import {NextResponse} from 'next/server';
import {previewSupplierCsv} from '../../../../../src/lib/supplier-csv-preview';
import {planSupplierFeed,validSupplierFeedOptions} from '../../../../lib/supplier-feed';
import {getOffersForSupplierSkus,commitSupplierFeed,FeedImportConflict,FeedImportInvalid} from '../../../../lib/supplier-db';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function originAllowed(request:Request):boolean{
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 try{return !!origin&&!!host&&new URL(origin).host===host}catch{return false}
}
async function readInput(request:Request){
 if(!originAllowed(request))return {error:'Niedozwolone pochodzenie',status:403} as const;
 if(!(request.headers.get('content-type')??'').includes('application/json'))return {error:'Wymagany JSON',status:415} as const;
 const length=Number(request.headers.get('content-length'));
 if(Number.isFinite(length)&&length>5_500_000)return {error:'Plik lub żądanie jest za duże',status:413} as const;
 let body:unknown;
 try{body=await request.json()}catch{return {error:'Niepoprawny JSON',status:400} as const}
 if(!body||typeof body!=='object'||Array.isArray(body))return {error:'Brak danych',status:400} as const;
 const input=body as Record<string,unknown>;
 if(!validSupplierFeedOptions(input.options))return {error:'Niepoprawne ustawienia dostawcy',status:400} as const;
 if(typeof input.csv!=='string'||input.csv.length>5_000_000)return {error:'Plik CSV musi mieć maksymalnie 5 MB',status:413} as const;
 if(!input.csv.trim())return {error:'Wybierz plik CSV',status:400} as const;
 return {csv:input.csv,options:input.options,confirm:input.confirm,fingerprint:input.fingerprint};
}
function previewResponse(plan:ReturnType<typeof planSupplierFeed>){
 return {canImport:plan.canImport,counts:plan.counts,totalIssues:plan.totalIssues,
  issues:plan.issues,sample:plan.sample,fingerprint:plan.fingerprint,
  note:'Import aktualizuje tylko oferty dostawcy. Nie publikuje cen, nie tworzy produktów i nie składa zamówień.'};
}
export async function POST(request:Request){
 const input=await readInput(request);
 if('error' in input)return NextResponse.json({error:input.error},{status:input.status});
 try{
  const parsed=previewSupplierCsv(input.csv);
  const offers=await getOffersForSupplierSkus(input.options.supplier,parsed.rows.map(r=>r.sku.trim()).filter(Boolean));
  const plan=planSupplierFeed(parsed,offers,input.options);
  return NextResponse.json(previewResponse(plan),{headers:{'Cache-Control':'no-store'}});
 }catch(error){
  return NextResponse.json({error:error instanceof Error?error.message:'Nie udało się przeanalizować CSV'},{status:400});
 }
}
export async function PUT(request:Request){
 const input=await readInput(request);
 if('error' in input)return NextResponse.json({error:input.error},{status:input.status});
 if(input.confirm!=='IMPORT_SUPPLIER_OFFERS'||typeof input.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(input.fingerprint)
   ||!input.options.pricesNetPLNConfirmed){
  return NextResponse.json({error:'Import wymaga potwierdzenia cen netto PLN oraz aktualnego podglądu'},{status:400});
 }
 try{
  const parsed=previewSupplierCsv(input.csv);
  const summary=await commitSupplierFeed(parsed,input.options,input.fingerprint);
  return NextResponse.json({ok:true,...summary,notice:'Oferty zapisane. Ceny katalogowe nie zostały zmienione.'},{headers:{'Cache-Control':'no-store'}});
 }catch(error){
  if(error instanceof FeedImportConflict)return NextResponse.json({error:error.message},{status:409});
  if(error instanceof FeedImportInvalid)return NextResponse.json({error:error.message},{status:422});
  if(error instanceof Error&&/CSV|identyfikator|kolumn|separator|wiersz/i.test(error.message))return NextResponse.json({error:error.message},{status:400});
  console.error('[supplier-feed] import failed',{type:error instanceof Error?error.name:'Unknown'});
  return NextResponse.json({error:'Nie udało się zapisać ofert. Spróbuj ponownie.'},{status:503});
 }
}
