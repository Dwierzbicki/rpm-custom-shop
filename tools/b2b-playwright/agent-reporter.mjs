import {randomUUID} from 'node:crypto';
import {validateFixtureJob} from './validate.mjs';

const allowedHosts=new Set(['rpm-custom-shop.onrender.com']);
export function validateReportingServer(value){
 let url;
 try{url=new URL(value)}catch{throw Error('Nieprawidłowy adres RPM Custom')}
 const localhost=(url.hostname==='127.0.0.1'||url.hostname==='localhost')&&
  url.protocol==='http:';
 const prod=url.protocol==='https:'&&allowedHosts.has(url.hostname);
 if(!localhost&&!prod||url.username||url.password||url.search||url.hash||
    url.pathname!=='/'||!['','3000','443'].includes(url.port)){
  throw Error('Raportowanie dozwolone tylko do RPM Custom na Render lub lokalnego serwera testowego');
 }
 return url.origin;
}
/**
 * Local-only telemetry transport. The token never goes to fmic.pl and is never
 * embedded in task JSON, screenshots, or persisted logs.
 * No external worker can create a real order through this endpoint.
 */
export function createAgentReporter(job,mode,options={}){
 validateFixtureJob(job);
 if(job.supplier!=='fmic')throw Error('Raportowanie sklepu FMIC wymaga zadania FMIC');
 if(mode!=='inspect'&&mode!=='cart-only')throw Error('Niepoprawny tryb agenta');
 const token=options.token??process.env.RPM_B2B_AGENT_TOKEN;
 if(typeof token!=='string'||token.length<32)throw Error('Ustaw RPM_B2B_AGENT_TOKEN (minimum 32 znaki)');
 const server=validateReportingServer(options.server??process.env.RPM_SHOP_URL??'https://rpm-custom-shop.onrender.com');
 const request=options.fetchImpl??fetch;
 const runId=options.runId??randomUUID();
 let seq=0;
 const sent=[];
 return {
  runId,mode,
  get sequence(){return seq},
  get sent(){return [...sent]},
  async report(phase,stepIndex=null){
   const payload={orderId:job.orderId,supplier:'fmic',
    jobId:job.jobId,fingerprint:job.procurementFingerprint,
    runId,seq:seq+1,mode,phase,stepIndex};
   const response=await request(server+'/api/b2b-agent',{
    method:'POST',redirect:'error',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify(payload),
   });
   if(!response.ok){
    throw Error('RPM Custom odrzucił raport agenta (HTTP '+response.status+
     '). Zatrzymuję działania. Sprawdź kolejkę i zatwierdzenie planu.');
   }
   const result=await response.json();
   if(result.accepted!==true)throw Error('Serwer nie potwierdził przyjęcia raportu; zatrzymuję automat');
   seq++;
   sent.push({phase,stepIndex,sequence:seq});
   return result;
  },
 };
}
