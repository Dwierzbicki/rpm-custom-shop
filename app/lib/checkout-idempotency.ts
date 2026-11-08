/**
 * Reuse an idempotency key for the same checkout payload across retries and
 * reloads. Only a SHA-256 fingerprint is persisted, never customer PII.
 */
const STORAGE_KEY='rpm-checkout-request-v2';
type PendingCheckout={fingerprint:string;key:string};
let pending:PendingCheckout|null=null;

async function payloadFingerprint(payload:string):Promise<string>{
 const bytes=new TextEncoder().encode(payload);
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');
}

export async function checkoutRequestKey(payload:string):Promise<string>{
 const fingerprint=await payloadFingerprint(payload);
 if(!pending){
  try{
   const stored=sessionStorage.getItem(STORAGE_KEY);
   const parsed=stored?JSON.parse(stored) as PendingCheckout:null;
   if(parsed&&typeof parsed.fingerprint==='string'&&typeof parsed.key==='string')pending=parsed;
  }catch{}
 }
 if(pending?.fingerprint===fingerprint)return pending.key;
 const key=crypto.randomUUID();
 pending={fingerprint,key};
 try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(pending))}catch{}
 return key;
}

export function clearCheckoutRequestKey():void{
 pending=null;
 try{sessionStorage.removeItem(STORAGE_KEY)}catch{}
}
