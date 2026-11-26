import {NextResponse} from 'next/server';
import {listVariants,scanVariants,reviewVariant,approveVariantBatch,revertVariantBatch} from '../../../lib/variant-db';
import {variantScopes,type VariantScope,type VariantFilter,type VariantDecision} from '../../../lib/variant-rules';
import {parseVariantReviewItems,parseVariantCategory,variantPageSizes,maxVariantBatch} from '../../../lib/variant-batch';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers});
const validScope=(value:unknown):value is VariantScope=>typeof value==='string'&&(variantScopes as readonly string[]).includes(value);
export async function GET(request:Request){
 try{
 const p=new URL(request.url).searchParams,scope=p.get('scope')??'colors',filter=p.get('filter')??'all',page=Number(p.get('page')??1),q=(p.get('q')??'').trim().slice(0,120);
 const category=parseVariantCategory(p.get('category')),size=Number(p.get('size')??20);
 if(category===null||!(variantPageSizes as readonly number[]).includes(size)||!validScope(scope)||!['all','pending','approved','rejected','conflict'].includes(filter)||!Number.isSafeInteger(page)||page<1||page>10000)return json({error:'Nieprawidłowe filtry'},400);
 return json(await listVariants(scope,filter as VariantFilter,q,page,category,size));
 }catch(e){console.error('Variants read failed',e);return json({error:'Nie udało się odczytać rodzin.'},500)}
}
export async function POST(request:Request){
 try{
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return json({error:'Niedozwolone pochodzenie'},403);
 if(!(request.headers.get('content-type')??'').includes('application/json'))return json({error:'Wymagany JSON'},415);
 const body=await request.json();
 if(body?.action==='scan'&&validScope(body.scope))return json({groups:await scanVariants(body.scope)});
 if(body?.action==='approve-batch'||body?.action==='revert-batch'){
  const items=parseVariantReviewItems(body.items);
  if(!validScope(body.scope)||!items)return json({error:'Wybierz od 1 do '+maxVariantBatch+' różnych rodzin z jednego zakresu.'},400);
  if(body.action==='revert-batch'){const result=await revertVariantBatch(body.scope,items);return result.saved?json(result):json({error:'Nie cofnięto żadnej decyzji. Wybrane rodziny zmieniły się lub nie są zatwierdzone.'},409)}
  const result=await approveVariantBatch(body.scope,items);
  return result.saved?json(result):json({error:'Nie zapisano żadnej decyzji. Wybrane rodziny zmieniły się, zostały już sprawdzone lub nakładają się na inne grupy. Odśwież skan.',conflicts:result.conflicts},409);
 }
 if(body?.action==='review'&&typeof body.id==='string'&&/^[a-f0-9]{32}$/.test(body.id)&&typeof body.fingerprint==='string'&&/^[a-f0-9]{32}$/.test(body.fingerprint)&&['pending','approved','rejected'].includes(body.decision)){
 const saved=await reviewVariant(body.id,body.fingerprint,body.decision as VariantDecision);
 return saved?json({saved:true}):json({error:'Dane zmieniły się lub SKU zniknęło. Przeskanuj zakres ponownie.'},409);
 }
 return json({error:'Nieprawidłowa operacja'},400);
 }catch(e){console.error('Variants operation failed',e);return json({error:'Operacja nieukończona. Sprawdź stan panelu; skan jest transakcyjny.'},503)}
}
