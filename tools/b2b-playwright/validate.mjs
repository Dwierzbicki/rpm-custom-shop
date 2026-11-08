import {createHash} from 'node:crypto';

const SHA=/^[a-f0-9]{64}$/;
const ORDER=/^[1-9][0-9]{0,17}$/;
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
function plain(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype}
function keysExact(obj,expected){
 return Object.keys(obj).length===expected.length&&expected.every(key=>own(obj,key));
}
const topFields=['schemaVersion','mode','orderId','supplier','procurementFingerprint','jobId','currency','lines',
 'estimatedNetTotalPLN','manualApprovalRequired','caveat'];
const itemFields=['sourceLine','supplierSku','name','quantity','expectedPurchaseNetPLN',
 'expectedShippingNetPLN','options','requiresVariantReview'];
export function expectedJobId(job){
 return createHash('sha256').update('rpm-b2b-fixture-v1:'+job.orderId+':'+job.supplier+
  ':'+job.procurementFingerprint).digest('hex');
}
const money=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=10_000_000;

export function validateFixtureJob(job){
 if(!plain(job)||!keysExact(job,topFields))throw Error('Invalid or unexpected job fields');
 if(job.schemaVersion!==1||job.mode!=='fixture-only'||!ORDER.test(job.orderId)||
  !['fmic','mtuning'].includes(job.supplier)||job.currency!=='PLN'||
  job.manualApprovalRequired!==true||typeof job.caveat!=='string'||
  !job.caveat.includes('SYMULACJA')||
  !SHA.test(job.procurementFingerprint)||!SHA.test(job.jobId)||
  expectedJobId(job)!==job.jobId){
  throw Error('Job format or fingerprint is invalid');
 }
 if(!Array.isArray(job.lines)||job.lines.length<1||job.lines.length>30||
  !money(job.estimatedNetTotalPLN))throw Error('Invalid job lines or total');
 let sum=0;
 const indices=new Set();
 for(const item of job.lines){
  if(!plain(item)||!keysExact(item,itemFields)||
   !Number.isSafeInteger(item.sourceLine)||item.sourceLine<1||
   indices.has(item.sourceLine)||
   typeof item.supplierSku!=='string'||!item.supplierSku.trim()||
   item.supplierSku.length>120||
   typeof item.name!=='string'||item.name.length>200||
   !Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>50||
   !money(item.expectedPurchaseNetPLN)||!money(item.expectedShippingNetPLN)||
   typeof item.requiresVariantReview!=='boolean'||!plain(item.options)){
    throw Error('Invalid line in job');
  }
  indices.add(item.sourceLine);
  const options=Object.entries(item.options);
  if(options.length>20||options.some(([key,value])=>
   key.length>100||typeof value!=='string'||value.length>200)){
   throw Error('Invalid product options');
  }
  sum+=Math.round((item.expectedPurchaseNetPLN+item.expectedShippingNetPLN)*
   item.quantity*100)/100;
 }
 if(Math.abs(Math.round(sum*100)/100-job.estimatedNetTotalPLN)>0.015)
  throw Error('Estimated supplier total does not match lines');
 return job;
}
