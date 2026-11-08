/**
 * Reuse an idempotency key for the same checkout payload across retries and
 * page reloads. A changed cart / customer payload gets a fresh key.
 */
const STORAGE_KEY='rpm-checkout-request-v1';
type PendingCheckout={payload:string;key:string};
let pending:PendingCheckout|null=null;

export function checkoutRequestKey(payload:string):string{
 if(!pending){
  try{
   const stored=sessionStorage.getItem(STORAGE_KEY);
   const parsed=stored?JSON.parse(stored) as PendingCheckout:null;
   if(parsed&&typeof parsed.payload==='string'&&typeof parsed.key==='string')pending=parsed;
  }catch{}
 }
 if(pending?.payload===payload)return pending.key;
 const key=crypto.randomUUID();
 pending={payload,key};
 try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(pending))}catch{}
 return key;
}

export function clearCheckoutRequestKey():void{
 pending=null;
 try{sessionStorage.removeItem(STORAGE_KEY)}catch{}
}
