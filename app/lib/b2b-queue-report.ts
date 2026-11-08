import type {B2BFixtureJob} from './b2b-fixture-job';

/**
 * Client-uploaded report is an operator assertion, NOT a trusted attestation
 * that Playwright ran. Only a narrow allowlist of non-sensitive fields is
 * accepted, and the screenshot/local path is deliberately never persisted.
 */
export type OfflineStep={
 action:'validate_job'|'render_fixture'|'populate_cart'|'verify_cart'|'screenshot';
 result:'ok';elapsedMs:number;
};
export type OfflineReport={
 runId:string;jobId:string;orderId:string;supplier:'fmic'|'mtuning';
 items:number;blockedRequests:0;sentToSupplier:false;orderPlaced:false;
 status:'offline-simulation-only';
 trace:OfflineStep[];durationMs:number;
};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export class InvalidOfflineReport extends Error {}
export function validateOfflineReport(value:unknown,job:B2BFixtureJob):OfflineReport{
 if(!value||typeof value!=='object'||Array.isArray(value))
  throw new InvalidOfflineReport('Niepoprawny raport symulacji');
 const input=value as Record<string,unknown>;
 const keys=Object.keys(input);
 const permitted=['runId','jobId','orderId','supplier','items','blockedRequests',
  'sentToSupplier','orderPlaced','status','image','trace','durationMs'];
 if(keys.some(k=>!permitted.includes(k))||keys.length<11||keys.length>12)
  throw new InvalidOfflineReport('Raport zawiera niedozwolone pola');
 if(typeof input.runId!=='string'||!uuid.test(input.runId)||
  input.jobId!==job.jobId||input.orderId!==job.orderId||input.supplier!==job.supplier||
  input.items!==job.lines.length||input.blockedRequests!==0||
  input.sentToSupplier!==false||input.orderPlaced!==false||
  input.status!=='offline-simulation-only'||
  !Number.isSafeInteger(input.durationMs)||Number(input.durationMs)<0||Number(input.durationMs)>600_000||
  !Array.isArray(input.trace)||input.trace.length<2||input.trace.length>20||
  (input.image!==undefined&&(typeof input.image!=='string'||input.image.length>1000))){
  throw new InvalidOfflineReport('Raport nie pasuje do zadania lub symulacja nie zakończyła się bezpiecznie');
 }
 const validActions=['validate_job','render_fixture','populate_cart','verify_cart','screenshot'];
 const trace:OfflineStep[]=[];
 for(const step of input.trace){
  if(!step||typeof step!=='object'||Array.isArray(step)||
   Object.keys(step).length!==3||
   !('action' in step)||!('result' in step)||!('elapsedMs' in step)||
   !validActions.includes(String(step.action))||step.result!=='ok'||
   !Number.isSafeInteger(step.elapsedMs)||step.elapsedMs<0||step.elapsedMs>600_000){
   throw new InvalidOfflineReport('Niepoprawny log lokalnej symulacji');
  }
  trace.push({action:step.action as OfflineStep['action'],result:'ok',elapsedMs:step.elapsedMs as number});
 }
 if(trace[0]?.action!=='validate_job'||trace.at(-1)?.action!=='screenshot'){
  throw new InvalidOfflineReport('Brak wymaganych kroków lokalnego testu');
 }
 return {
  runId:input.runId,jobId:job.jobId,orderId:job.orderId,
  supplier:job.supplier,items:job.lines.length,
  blockedRequests:0,sentToSupplier:false,orderPlaced:false,
  status:'offline-simulation-only',trace,durationMs:input.durationMs as number,
 };
}
