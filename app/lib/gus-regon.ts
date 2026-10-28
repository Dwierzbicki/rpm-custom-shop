/** GUS BIR1.1 production lookup. Requires GUS_BIR_API_KEY on the server. */
const endpoint='https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc';
const ns='http://CIS/BIR/PUBL/2014/07';
const xmlEscape=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const decode=(s:string)=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
function tag(xml:string,name:string){const m=xml.match(new RegExp('<(?:[\\w.-]+:)?'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?'+name+'>','i'));return m?decode(m[1].trim()):''}
async function soap(action:string,body:string,sid:string,signal:AbortSignal){
 const envelope=`<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing"><s:Header><a:Action s:mustUnderstand="1">${ns}/IUslugaBIRzewnPubl/${action}</a:Action><a:To s:mustUnderstand="1">${endpoint}</a:To></s:Header><s:Body><${action} xmlns="${ns}">${body}</${action}></s:Body></s:Envelope>`;
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':`application/soap+xml; charset=utf-8; action="${ns}/IUslugaBIRzewnPubl/${action}"`,'Accept':'application/soap+xml, multipart/related','sid':sid},body:envelope,signal,cache:'no-store'});
 if(!response.ok)throw new Error('GUS HTTP '+response.status);
 return response.text();
}
export type GusCompany={name:string;address:string;regon:string};
export async function lookupGus(nip:string):Promise<GusCompany|null>{
 const key=process.env.GUS_BIR_API_KEY?.trim();
 if(!key)return null;
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),6500);
 let sid='';
 try{
  const login=await soap('Zaloguj','<pKluczUzytkownika>'+xmlEscape(key)+'</pKluczUzytkownika>','',controller.signal);
  sid=tag(login,'ZalogujResult');
  if(!sid)throw new Error('GUS login failed');
  const result=await soap('DaneSzukajPodmioty','<pParametryWyszukiwania><Nip>'+xmlEscape(nip)+'</Nip></pParametryWyszukiwania>',sid,controller.signal);
  const data=tag(result,'DaneSzukajPodmiotyResult');
  const name=tag(data,'Nazwa');
  if(!name)return null;
  const street=[tag(data,'Ulica'),tag(data,'NrNieruchomosci')].filter(Boolean).join(' ');
  const apartment=tag(data,'NrLokalu');
  const postal=tag(data,'KodPocztowy');
  const city=tag(data,'Miejscowosc');
  return {name:name.slice(0,160),address:[street+(apartment?'/'+apartment:''),[postal,city].filter(Boolean).join(' ')].filter(Boolean).join(', ').slice(0,240),regon:tag(data,'Regon')};
 }finally{
  clearTimeout(timeout);
  if(sid){const c=new AbortController();const t=setTimeout(()=>c.abort(),1800);try{await soap('Wyloguj','<pIdentyfikatorSesji>'+xmlEscape(sid)+'</pIdentyfikatorSesji>',sid,c.signal)}catch{}finally{clearTimeout(t)}}
 }
}
