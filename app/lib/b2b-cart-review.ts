import type {B2BFixtureJob} from './b2b-fixture-job';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export class InvalidCartReview extends Error{}
export type CartReview={
 runId:string;jobId:string;orderId:string;supplier:'fmic';
 verdict:'verified'|'needs_review';
 items:number;cartAddRequests:number;durationMs:number;
 calculatedGrossPLN:number|null;observedSubtotalGrossPLN:number|null;
 issues:string[];
};
function price(value:unknown):value is number|null{
 return value===null||(typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=10_000_000);
}
/** Treat uploaded local cart reports as an operator's claim, not proof of FMIC activity. */
export function validateCartReview(report:unknown,job:B2BFixtureJob):CartReview{
 if(!report||typeof report!=='object'||Array.isArray(report))throw new InvalidCartReview('Niepoprawny raport koszyka');
 const r=report as Record<string,unknown>;
 const allowed=['runId','jobId','orderId','supplier','status','lines','cartVerification',
  'cartAddRequests','blockedRequests','durationMs','screenshot','orderPlaced','orderSubmitted','note'];
 if(Object.keys(r).some(key=>!allowed.includes(key))||Object.keys(r).length<11||
  !uuid.test(String(r.runId))||r.jobId!==job.jobId||r.orderId!==job.orderId||
  r.supplier!=='fmic'||job.supplier!=='fmic'||r.orderPlaced!==false||
  r.orderSubmitted!==false||!Number.isSafeInteger(r.durationMs)||
  Number(r.durationMs)<0||Number(r.durationMs)>3_600_000||
  !Number.isSafeInteger(r.cartAddRequests)||Number(r.cartAddRequests)<1||
  Number(r.cartAddRequests)>job.lines.length*2||
  typeof r.blockedRequests!=='number'||!Number.isSafeInteger(r.blockedRequests)||
  r.blockedRequests<0||r.blockedRequests>100_000){
  throw new InvalidCartReview('Raport koszyka nie pasuje do zadania lub nie jest bezpieczny');
 }
 const cv=r.cartVerification;
 if(!cv||typeof cv!=='object'||Array.isArray(cv))throw new InvalidCartReview('Brak weryfikacji koszyka');
 const v=cv as Record<string,unknown>;
 if(typeof v.ok!=='boolean'||!Array.isArray(v.issues)||v.issues.length>30||
  v.issues.some(issue=>typeof issue!=='string'||issue.length>200||/[\r\n\x00-\x1f]/.test(issue))||
  !Number.isSafeInteger(v.verifiedLines)||Number(v.verifiedLines)<0||
  Number(v.verifiedLines)>100||!price(v.calculatedGrossPLN)||
  !price(v.observedSubtotalGrossPLN)||
  (v.ok&&(v.issues.length!==0||v.verifiedLines!==job.lines.length))||
  (v.ok&&r.status!=='cart-verified-needs-human-approval')||
  (!v.ok&&r.status!=='cart-not-verified')){
  throw new InvalidCartReview('Niepoprawny wynik porównania pozycji koszyka');
 }
 if(!Array.isArray(r.lines)||r.lines.length<1||r.lines.length>job.lines.length){
  throw new InvalidCartReview('Niepoprawny dziennik dodawania produktów');
 }
 for(const line of r.lines){
  if(!line||typeof line!=='object'||Array.isArray(line))throw new InvalidCartReview('Niepoprawny wpis w logu');
  const item=line as Record<string,unknown>;
  if(Object.keys(item).some(key=>!['action','sku','qty','responseStatus','result'].includes(key))||
   item.action!=='add_to_cart'||item.result!=='requested'||
   !job.lines.some(expected=>expected.supplierSku===item.sku&&expected.quantity===item.qty)||
   !Number.isInteger(item.responseStatus)||Number(item.responseStatus)<200||Number(item.responseStatus)>=400){
   throw new InvalidCartReview('Niepoprawny wpis dodania do koszyka');
  }
 }
 return {runId:String(r.runId),jobId:job.jobId,orderId:job.orderId,supplier:'fmic',
  verdict:v.ok?'verified':'needs_review',items:job.lines.length,
  cartAddRequests:Number(r.cartAddRequests),durationMs:Number(r.durationMs),
  calculatedGrossPLN:v.calculatedGrossPLN as number|null,
  observedSubtotalGrossPLN:v.observedSubtotalGrossPLN as number|null,
  issues:v.issues as string[]};
}
