export type PreflightStatus='empty'|'nonempty'|'unknown';
export type PreflightReason=
 'explicit_empty_message'|'items_detected'|'unreadable_items'|
 'cart_navigation_redirect'|'login_required'|'too_many_rows'|'unrecognized_cart_layout';
export type PreflightItem={sku:string|null;qty:number|null};
export type B2BPreflightPayload={
 orderId:string;supplier:'fmic';jobId:string;fingerprint:string;runId:string;
 status:PreflightStatus;itemCount:number;items:PreflightItem[];reason:PreflightReason;
};
export class InvalidCartPreflight extends Error{}
const sha=/^[a-f0-9]{64}$/;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const reasons:Record<PreflightStatus,readonly PreflightReason[]>={
 empty:['explicit_empty_message'],
 nonempty:['items_detected','unreadable_items'],
 unknown:['cart_navigation_redirect','login_required','too_many_rows','unrecognized_cart_layout'],
};
export function validateB2BPreflight(value:unknown):B2BPreflightPayload{
 if(!value||typeof value!=='object'||Array.isArray(value))
  throw new InvalidCartPreflight('Niepoprawny preflight FMIC');
 const data=value as Record<string,unknown>;
 const allowed=['orderId','supplier','jobId','fingerprint','runId','status','itemCount','items','reason'];
 if(Object.keys(data).length!==allowed.length||Object.keys(data).some(k=>!allowed.includes(k))||
  typeof data.orderId!=='string'||!/^[1-9][0-9]{0,17}$/.test(data.orderId)||
  data.supplier!=='fmic'||typeof data.jobId!=='string'||!sha.test(data.jobId)||
  typeof data.fingerprint!=='string'||!sha.test(data.fingerprint)||
  typeof data.runId!=='string'||!uuid.test(data.runId)||
  (data.status!=='empty'&&data.status!=='nonempty'&&data.status!=='unknown')||
  !reasons[data.status as PreflightStatus].includes(data.reason as PreflightReason)||
  !Number.isSafeInteger(data.itemCount)||Number(data.itemCount)<0||Number(data.itemCount)>50||
  !Array.isArray(data.items)||data.items.length>50){
  throw new InvalidCartPreflight('Zabroniony lub niepoprawny raport koszyka');
 }
 const status=data.status as PreflightStatus;
 const count=data.itemCount as number;
 if(status==='nonempty'){
  if(count===0||(data.items.length!==0&&data.items.length!==count)||
     (data.reason==='items_detected'&&data.items.length!==count)||
     (data.reason==='unreadable_items'&&data.items.length!==0)){
   throw new InvalidCartPreflight('Niezgodna liczba produktów w koszyku');
  }
 }else if(count!==0||data.items.length!==0){
  throw new InvalidCartPreflight('Nie można zgłaszać produktów w pustym lub nieznanym koszyku');
 }
 const items:PreflightItem[]=[];
 for(const raw of data.items){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||
   Object.keys(raw).length!==2||!('sku' in raw)||!('qty' in raw)){
   throw new InvalidCartPreflight('Niepoprawna pozycja koszyka');
  }
  const row=raw as PreflightItem;
  if(row.sku!==null&&(typeof row.sku!=='string'||
    !/^[A-Za-z0-9][A-Za-z0-9_.\/-]{1,119}$/.test(row.sku))||
   (row.qty!==null&&(!Number.isSafeInteger(row.qty)||row.qty<1||row.qty>100))){
   throw new InvalidCartPreflight('Niepoprawne SKU lub ilość w koszyku');
  }
  items.push({sku:row.sku,qty:row.qty});
 }
 return {
  orderId:data.orderId,supplier:'fmic',jobId:data.jobId as string,
  fingerprint:data.fingerprint as string,runId:data.runId as string,
  status,itemCount:count,items,reason:data.reason as PreflightReason,
 };
}
