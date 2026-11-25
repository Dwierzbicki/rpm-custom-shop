import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const origins=new Set(['https://rpmcustom.pl','https://www.rpmcustom.pl','https://rpm-custom-shop.onrender.com']);
export const cases=[
 {label:'Hamulce i koła / page 1',params:{category:'/sklep/hamulce-i-kola'},kind:'listing'},
 {label:'Hamulce i koła / page 2',params:{category:'/sklep/hamulce-i-kola',page:'2'},kind:'listing'},
 {label:'Hamulce i koła / page 100',params:{category:'/sklep/hamulce-i-kola',page:'100'},kind:'listing'},
 {label:'Hamulce i koła / ascending',params:{category:'/sklep/hamulce-i-kola',sort:'priceAsc'},kind:'listing'},
 {label:'Hamulce i koła / descending',params:{category:'/sklep/hamulce-i-kola',sort:'priceDesc'},kind:'listing'},
 {label:'Search E46',params:{q:'E46'},kind:'listing'},
 {label:'Search BMW',params:{q:'BMW'},kind:'listing'},
 {label:'Suggestions E46',params:{q:'E46'},kind:'suggest'},
 {label:'Turbo facets',params:{category:'/sklep/silnik-i-turbo/turbosprezarki/turbosprezarki-tuningowe'},kind:'listing'},
 {label:'Turbo producer Pulsar',params:{category:'/sklep/silnik-i-turbo/turbosprezarki/turbosprezarki-tuningowe',producer:'Pulsar'},kind:'listing'},
 {label:'Product KBM23595-2E',params:{sku:'KBM23595-2E'},kind:'product'}
];
export function scenarioUrl(origin,s){
 return new URL('/api/catalog/fmic'+(s.kind==='listing'?'':'/'+s.kind)+'?'+new URLSearchParams(s.params),origin);
}
export function validateResponse(s,data){
 if(s.kind==='product'){
  assert.equal(data.product?.sku,s.params.sku,'Wrong product');
  assert.ok(Array.isArray(data.related));
  return {sku:data.product.sku,related:data.related.length};
 }
 assert.ok(Array.isArray(data.items),'Missing items');
 assert.ok(Number.isInteger(data.total)&&data.total>=0,'Invalid total');
 assert.ok(data.items.length>0,'Unexpected empty result');
 assert.ok(data.items.length<=(s.kind==='suggest'?6:24));
 assert.equal(new Set(data.items.map(x=>x.sku)).size,data.items.length,'Duplicate SKU');
 if(s.kind==='listing'){
  assert.equal(data.page,Number(s.params.page??1));
  assert.ok(Array.isArray(data.facets));
  if(s.params.sort){
   const prices=data.items.map(x=>x.proposed_gross===null?null:Number(x.proposed_gross));
   for(let i=1;i<prices.length;i++){
    const a=prices[i-1],b=prices[i];
    if(a===null||b===null)continue;
    assert.ok(s.params.sort==='priceAsc'?a<=b:a>=b,'Incorrect price ordering');
   }
  }
 }
 return {total:data.total,items:data.items.length,facets:data.facets?.length};
}
async function run(){
 const origin=process.env.FMIC_BENCH_ORIGIN??'https://rpmcustom.pl';
 if(!origins.has(origin))throw Error('Benchmark origin must be an approved RPM Custom HTTPS host');
 const username=process.env.SITE_LOCK_USERNAME??process.env.ADMIN_USERNAME;
 const password=process.env.SITE_LOCK_PASSWORD??process.env.ADMIN_PASSWORD;
 if(!username||!password)throw Error('Site gate credentials are required in environment variables');
 const login=await fetch(new URL('/site-access',origin),{method:'POST',headers:{Origin:origin},body:new URLSearchParams({username,password,next:'/sklep'}),redirect:'manual',signal:AbortSignal.timeout(15000)});
 const cookie=login.headers.getSetCookie().find(v=>v.startsWith('rpm_site_session='))?.split(';')[0];
 if(login.status!==303||!cookie)throw Error('Site gate login failed: HTTP '+login.status);
 await login.body?.cancel();
 const report=[];
 // Two serial sweeps are not a load test; second sweep may hit cache depending on elapsed time.
 // Immediate repeat deliberately measures warm response, while first response may already be cached.
 for(const s of cases){
  const result={scenario:s.label};
  for(const phase of ['first','repeat']){
   const begin=performance.now();
   const res=await fetch(scenarioUrl(origin,s),{headers:{Cookie:cookie,Accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(20000)});
   if(!res.ok)throw Error(s.label+': HTTP '+res.status);
   const body=await res.text();
   result[phase+'Ms']=Math.round((performance.now()-begin)*10)/10;
   result.bytes=Buffer.byteLength(body);
   result.result=validateResponse(s,JSON.parse(body));
   await new Promise(r=>setTimeout(r,250));
  }
  report.push(result);console.log(JSON.stringify(result));
  await new Promise(r=>setTimeout(r,500));
 }
 console.log(JSON.stringify({type:'summary',scenarios:report.length,requests:report.length*2,firstMaxMs:Math.max(...report.map(x=>x.firstMs)),repeatMaxMs:Math.max(...report.map(x=>x.repeatMs))}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)run().catch(e=>{console.error('Benchmark failed:',e.message);process.exitCode=1});
