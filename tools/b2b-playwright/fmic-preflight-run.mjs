import {chromium} from 'playwright';
import {access} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {DEFAULT_FMIC_SESSION_PATH,validateLocalSessionPath} from './fmic-login.mjs';
import {checkFmicCartPreflight} from './fmic-cart-preflight.mjs';
import {guardFmicRequest} from './fmic-guard.mjs';

/** Read-only browser with login state kept exclusively on the user's Mac. */
export async function scanFmicCartSession(options={}){
 const session=validateLocalSessionPath(options.storageState??DEFAULT_FMIC_SESSION_PATH);
 await access(session).catch(()=>{
  throw Error('Brak lokalnej sesji FMIC. Uruchom najpierw npm run fmic:login');
 });
 const browser=await chromium.launch({headless:options.headless??true});
 try{
  const context=await browser.newContext({
   storageState:session,acceptDownloads:false,serviceWorkers:'block',
  });
  try{
   await context.route('**/*',route=>{
    const request=route.request();
    const decision=guardFmicRequest(request.method(),request.url(),false);
    return decision==='continue'?route.continue():route.abort();
   });
   const page=await context.newPage();
   try{
    return await checkFmicCartPreflight(page);
   }finally{await page.close()}
  }finally{await context.close()}
 }finally{await browser.close()}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const result=await scanFmicCartSession();
  console.log('FMIC CART PREFLIGHT:',JSON.stringify(result,null,2));
  console.log('Nie zmieniono koszyka ani nie wysłano zamówienia.');
  if(result.status!=='empty')process.exitCode=2;
 }catch(error){
  console.error('FMIC CART SAFE STOP:',error instanceof Error?error.message:String(error));
  process.exitCode=1;
 }
}
