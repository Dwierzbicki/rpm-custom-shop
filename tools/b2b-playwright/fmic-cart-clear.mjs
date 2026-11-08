import {chromium} from 'playwright';
import {access} from 'node:fs/promises';
import {createHash,randomInt} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {DEFAULT_FMIC_SESSION_PATH,validateLocalSessionPath} from './fmic-login.mjs';
import {checkFmicCartPreflight} from './fmic-cart-preflight.mjs';
import {guardFmicRequest} from './fmic-guard.mjs';

const CLEAR_ENDPOINT='https://fmic.pl/checkout/cart/updatePost/';
const MAX_ITEMS=50;

/** Reject incomplete or unclear cart snapshots before proposing deletion. */
export function cartClearFingerprint(snapshot){
 if(!snapshot||snapshot.status!=='nonempty'||
  !Number.isSafeInteger(snapshot.itemCount)||snapshot.itemCount<1||
  snapshot.itemCount>MAX_ITEMS||!Array.isArray(snapshot.items)||
  snapshot.items.length!==snapshot.itemCount)throw Error('Nie rozpoznano całej zawartości koszyka');
 const entries=snapshot.items.map(line=>{
  if(!line||typeof line.sku!=='string'||
   !/^[A-Za-z0-9][A-Za-z0-9_.\/-]{1,119}$/.test(line.sku)||
   !Number.isSafeInteger(line.qty)||line.qty<1||line.qty>100){
   throw Error('Niepełne SKU lub ilość: czyszczenie zablokowane');
  }
  return {sku:line.sku.toUpperCase(),qty:line.qty};
 });
 // These fingerprints never contain cookies, CSRF tokens or customer details.
 return createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

/** The ONLY one-off write permitted by this module after exact consent. */
export function isApprovedFmicClearPost(method,url,body){
 if(method!=='POST'||typeof body!=='string'||body.length>16000)return false;
 let target;
 try{target=new URL(url)}catch{return false}
 if(target.origin!=='https://fmic.pl'||
  target.pathname!=='/checkout/cart/updatePost/'||
  target.search||target.hash)return false;
 const params=new URLSearchParams(body);
 const values=[...params.entries()];
 if(values.length<2||values.length>54||
  params.getAll('update_cart_action').length!==1||
  params.get('update_cart_action')!=='empty_cart'||
  params.getAll('form_key').length!==1||
  !/^[A-Za-z0-9_-]{8,200}$/.test(params.get('form_key')??''))return false;
 // No unrelated write operations or supplier credentials can piggyback.
 for(const [key,value] of values){
  if(key==='form_key'||key==='update_cart_action')continue;
  if(!/^cart\[[0-9]{1,20}\]\[qty\]$/.test(key)||
   !/^[0-9]{1,3}$/.test(value)||+value>100)return false;
 }
 return true;
}

/**
 * Executing clear requires ALL of:
 *   explicit --execute CLI arg, independent env var, typed challenge
 *   matching current cart count, unchanged cart on second preflight,
 *   known exact POST form and one verified clear request.
 * Read-only by default and NEVER goes to checkout.
 */
export async function clearFmicCartWithConsent(options={}){
 const session=validateLocalSessionPath(options.storageState??DEFAULT_FMIC_SESSION_PATH);
 await access(session).catch(()=>{throw Error('Brak sesji FMIC. Zaloguj się: npm run fmic:login')});
 const browser=await chromium.launch({headless:options.headless??true});
 try{
  const context=await browser.newContext({
   storageState:session,acceptDownloads:false,serviceWorkers:'block',
  });
  let enabled=false,postCount=0,blocked=0;
  try{
   await context.route('**/*',route=>{
    const req=route.request(),method=req.method(),url=req.url();
    if(enabled&&postCount===0&&
     isApprovedFmicClearPost(method,url,req.postData())){
     postCount++;
     return route.continue();
    }
    if(guardFmicRequest(method,url,false)==='continue')return route.continue();
    blocked++;
    return route.abort();
   });
   const page=await context.newPage();
   try{
    const before=await checkFmicCartPreflight(page);
    const fingerprint=cartClearFingerprint(before);
    output.write('\nFMIC: koszyk zawiera '+before.itemCount+' pozycji:\n');
    for(const [i,line] of before.items.entries()){
     output.write('  '+(i+1)+'. '+line.sku+' — '+line.qty+' szt.\n');
    }
    if(options.execute!==true){
     return {status:'preview-only',itemCount:before.itemCount,
      blockedRequests:blocked,cartChanged:false,orderPlaced:false};
    }
    if(options.clearEnvEnabled!==true){
     throw Error('Do opróżnienia wymagane --execute oraz RPM_FMIC_ALLOW_CLEAR=YES');
    }
    const challenge=String(randomInt(100000,999999));
    const answer=`WYCZYSC ${before.itemCount} POZYCJE ${challenge}`;
    output.write('\nUWAGA: ta operacja nieodwracalnie usunie WSZYSTKIE produkty z koszyka FMIC.\n');
    output.write('Aby zatwierdzić, wpisz DOKŁADNIE: '+answer+'\n');
    let consent=false;
    if(typeof options.askConfirmation==='function'){
     consent=(await options.askConfirmation(answer))===answer;
    }else{
     const rl=createInterface({input,output});
     try{consent=(await rl.question('Potwierdzenie: ')).trim()===answer}
     finally{rl.close()}
    }
    if(!consent)return {status:'cancelled',itemCount:before.itemCount,
     cartChanged:false,orderPlaced:false};
    const second=await checkFmicCartPreflight(page);
    if(cartClearFingerprint(second)!==fingerprint){
     throw Error('Zawartość koszyka zmieniła się podczas potwierdzania. ZATRZYMANO.');
    }
    const button=page.locator('#empty_cart_button');
    if(await button.count()!==1||!await button.isVisible()){
     throw Error('Przycisk czyszczenia koszyka nie jest jednoznaczny');
    }
    const form=await button.evaluate(element=>{
     const source=element.form??element.closest('form');
     return source?{method:source.method.toUpperCase(),action:source.action}:null;
    });
    // The production form action must be verified. Unknown storefront
    // layouts fail closed and still require only a human/manual clear.
    if(!form||form.method!=='POST'||form.action!==CLEAR_ENDPOINT){
     throw Error('Niezweryfikowany formularz czyszczenia FMIC. Nie wykonano operacji.');
    }
    enabled=true;
    // Only the one specific empty_cart POST may leave the browser. Wait
    // for its actual response before reloading the cart for verification.
    // A timed-out/uncertain result must NEVER automatically retry.
    let postResponse=null;
    try{
     const responsePromise=page.waitForResponse(
      response=>response.request().method()==='POST'&&
       response.url()===CLEAR_ENDPOINT,{timeout:15000});
     await button.click({timeout:10000,noWaitAfter:true});
     postResponse=await responsePromise;
    }catch{
     throw Error('Nie potwierdzono odpowiedzi FMIC po czyszczeniu. Sprawdź koszyk ręcznie; NIE powtarzaj automatycznie.');
    }finally{enabled=false}
    if(postCount!==1||!postResponse){
     throw Error('FMIC nie użył zatwierdzonego formularza. Żadnego ponawiania; sprawdź koszyk ręcznie.');
    }
    const after=await checkFmicCartPreflight(page);
    if(after.status!=='empty'){
     return {status:'unverified-after-request',itemCount:before.itemCount,
      afterStatus:after.status,clearPostRequests:postCount,
      cartChanged:'unknown',orderPlaced:false,
      notice:'Żądanie czyszczenia wysłano raz; wynik niepewny. Sprawdź koszyk ręcznie, nie powtarzaj automatycznie.'};
    }
    return {status:'verified-empty',itemCount:before.itemCount,
     clearPostRequests:postCount,cartChanged:true,orderPlaced:false};
   }finally{await page.close()}
  }finally{await context.close()}
 }finally{await browser.close()}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const result=await clearFmicCartWithConsent({
   execute:process.argv.slice(2).includes('--execute'),
   clearEnvEnabled:process.env.RPM_FMIC_ALLOW_CLEAR==='YES',
  });
  console.log('FMIC CART CLEAR:',JSON.stringify(result,null,2));
  if(result.status!=='preview-only'&&result.status!=='verified-empty')process.exitCode=2;
 }catch(error){
  console.error('FMIC CART SAFE STOP:',error instanceof Error?error.message:String(error));
  process.exitCode=1;
 }
}
