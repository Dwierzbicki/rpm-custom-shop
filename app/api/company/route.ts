import {lookupGus} from '../../lib/gus-regon';
import {validNip,normalizeNip} from '../../company-utils.mjs';
import {NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Company={name:string;address:string;statusVat:string;source:string;regon?:string};
const cache=new Map<string,{expires:number;company:Company}>();
const hits=new Map<string,{count:number;until:number}>();
export async function GET(request:Request){
 const url=new URL(request.url);const nip=normalizeNip(url.searchParams.get('nip')??'');
 if(!validNip(nip))return NextResponse.json({error:'Podaj poprawny 10-cyfrowy NIP.'},{status:400});
 const saved=cache.get(nip);if(saved&&saved.expires>Date.now())return NextResponse.json(saved.company);
 const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'unknown';
 const now=Date.now();const hit=hits.get(ip);
 if(hit&&hit.until>now&&hit.count>=10)return NextResponse.json({error:'Zbyt wiele zapytań. Spróbuj później.'},{status:429});
 hits.set(ip,hit&&hit.until>now?{...hit,count:hit.count+1}:{count:1,until:now+3600000});
 if(cache.size>500)cache.clear();if(hits.size>2000)hits.clear();
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7000);
 let vat:Company|null=null;
 try{
  const response=await fetch('https://wl-api.mf.gov.pl/api/search/nip/'+nip+'?date='+date,{signal:controller.signal,headers:{Accept:'application/json'},cache:'no-store'});
  if(response.ok){
   const data=await response.json();const subject=data?.result?.subject;
   if(subject&&typeof subject.name==='string'&&subject.name.trim())vat={name:subject.name.trim().slice(0,160),address:String(subject.residenceAddress||subject.workingAddress||'').slice(0,240),statusVat:String(subject.statusVat||''),source:'VAT'};
  }
 }catch{}finally{clearTimeout(timeout)}
 let gus=null;
 try{gus=await lookupGus(nip)}catch(error){console.error('GUS lookup failed',error instanceof Error?error.message:'unknown')}
 const company:Company|null=gus?{name:gus.name,address:gus.address||vat?.address||'',statusVat:vat?.statusVat||'',source:vat?'GUS + VAT':'GUS',regon:gus.regon}:vat;
 if(!company)return NextResponse.json({error:'Nie znaleziono danych firmy w dostępnych rejestrach. Wpisz dane ręcznie.'},{status:404});
 cache.set(nip,{company,expires:Date.now()+3600000});
 return NextResponse.json(company);
}
