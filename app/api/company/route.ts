import {NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Company={name:string;address:string;statusVat:string};
const cache=new Map<string,{expires:number;company:Company}>();
const hits=new Map<string,{count:number;until:number}>();
function validNip(nip:string){if(!/^\d{10}$/.test(nip))return false;const weights=[6,5,7,2,3,4,5,6,7];const sum=weights.reduce((a,w,i)=>a+w*Number(nip[i]),0)%11;return sum!==10&&sum===Number(nip[9]);}
export async function GET(request:Request){
 const url=new URL(request.url);const nip=(url.searchParams.get('nip')??'').replace(/[\s-]/g,'');
 if(!validNip(nip))return NextResponse.json({error:'Podaj poprawny 10-cyfrowy NIP.'},{status:400});
 const saved=cache.get(nip);if(saved&&saved.expires>Date.now())return NextResponse.json(saved.company);
 const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'unknown';
 const now=Date.now();const hit=hits.get(ip);
 if(hit&&hit.until>now&&hit.count>=10)return NextResponse.json({error:'Zbyt wiele zapytań. Spróbuj później.'},{status:429});
 hits.set(ip,hit&&hit.until>now?{...hit,count:hit.count+1}:{count:1,until:now+3600000});
 if(cache.size>500)cache.clear();if(hits.size>2000)hits.clear();
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7000);
 try{
  const response=await fetch('https://wl-api.mf.gov.pl/api/search/nip/'+nip+'?date='+date,{signal:controller.signal,headers:{Accept:'application/json'},cache:'no-store'});
  if(!response.ok)return NextResponse.json({error:response.status===404?'Nie znaleziono firmy w wykazie VAT.':'Rejestr VAT jest chwilowo niedostępny. Wpisz dane ręcznie.'},{status:response.status===404?404:503});
  const data=await response.json();const subject=data?.result?.subject;
  if(!subject||typeof subject.name!=='string'||!subject.name.trim())return NextResponse.json({error:'Nie znaleziono firmy. Wpisz dane ręcznie.'},{status:404});
  const company:Company={name:subject.name.trim().slice(0,160),address:String(subject.residenceAddress||subject.workingAddress||'').slice(0,240),statusVat:String(subject.statusVat||'')};
  cache.set(nip,{company,expires:Date.now()+3600000});
  return NextResponse.json(company);
 }catch{return NextResponse.json({error:'Nie udało się połączyć z rejestrem VAT. Wpisz dane ręcznie.'},{status:503})}finally{clearTimeout(timeout)}
}
