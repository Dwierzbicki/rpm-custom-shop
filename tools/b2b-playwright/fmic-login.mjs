import {chromium} from 'playwright';
import {mkdir,chmod} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import {checkFmicCartPreflight} from './fmic-cart-preflight.mjs';
import {guardFmicRequest} from './fmic-guard.mjs';

const folder=path.dirname(fileURLToPath(import.meta.url));
export const FMIC_LOGIN_URL='https://fmic.pl/customer/account/login/';
export const DEFAULT_FMIC_SESSION_PATH=path.join(folder,'.auth','fmic.storage-state.json');
export function validateLocalSessionPath(filePath){
 if(typeof filePath!=='string'||!path.isAbsolute(filePath)||
  !filePath.endsWith('.storage-state.json')){
  throw Error('Sesja FMIC musi być lokalnym plikiem z rozszerzeniem .storage-state.json');
 }
 return filePath;
}
export async function saveLocalFmicSession(context,filePath=DEFAULT_FMIC_SESSION_PATH){
 const target=validateLocalSessionPath(filePath);
 await mkdir(path.dirname(target),{recursive:true,mode:0o700});
 // This file may contain login cookies and is intentionally ignored by Git.
 // Owner-only permissions (on POSIX); never print its contents.
 await context.storageState({path:target});
 await chmod(target,0o600);
 return target;
}
/**
 * Interactive login: the operator logs in manually in a local Chromium
 * window. No automation types or stores login credentials.
 * DO NOT intercept login POST or redirect through the RPM server.
 */
export async function loginFmicInteractively(options={}){
 const browser=await chromium.launch({headless:false});
 try{
  const context=await browser.newContext({acceptDownloads:false,serviceWorkers:'block'});
  try{
   const page=await context.newPage();
   await page.goto(FMIC_LOGIN_URL,{waitUntil:'domcontentloaded',timeout:45000});
   output.write('\nFMIC: zaloguj się ręcznie w otwartym oknie Chromium.\n');
   output.write('Nie wpisuj hasła do Terminala ani do repozytorium.\n');
   output.write('Kiedy upewnisz się, że jesteś zalogowany, wróć do Terminala.\n');
   if(options.confirm !== undefined){
    if(options.confirm!==true)throw Error('Operator anulował zapis sesji');
   }else{
    const prompt=createInterface({input,output});
    try{
     const answer=await prompt.question('Napisz ZAPISZ, aby lokalnie zachować sesję (inaczej anuluj): ');
     if(answer.trim()!=='ZAPISZ')throw Error('Zapis sesji anulowany przez operatora');
    }finally{prompt.close()}
   }
   const pageUrl=new URL(page.url());
   if(!['fmic.pl','www.fmic.pl'].includes(pageUrl.hostname)||pageUrl.protocol!=='https:'){
    throw Error('Przeglądarka nie jest na zweryfikowanej domenie FMIC');
   }
   const target=await saveLocalFmicSession(context,
    options.sessionPath??DEFAULT_FMIC_SESSION_PATH);
   // Check the cart immediately after login, before any further automation.
   await context.route('**/*',route=>{
    const request=route.request();
    return guardFmicRequest(request.method(),request.url(),false)==='continue'
     ?route.continue():route.abort();
   });
   let cart;
   try{
    cart=await checkFmicCartPreflight(page);
   }catch{
    cart={status:'unknown',itemCount:0,items:[],reason:'unrecognized_cart_layout'};
   }
   return {saved:true,sessionPath:target,cart};
  }finally{await context.close()}
 }finally{await browser.close()}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const result=await loginFmicInteractively();
  output.write('Sesja zapisana lokalnie: '+result.sessionPath+'\n');
  output.write('Stan koszyka po logowaniu: '+JSON.stringify(result.cart)+'\n');
  if(result.cart.status!=='empty'){
   output.write('ZATRZYMANO: sprawdź koszyk FMIC. Automat niczego nie usunął.\n');
   process.exitCode=2;
  }else{
   output.write('Wykryto pusty koszyk. Nie zmieniono jego zawartości.\n');
  }
 }catch(error){
  console.error('FMIC LOGIN SAFE STOP:',error instanceof Error?error.message:String(error));
  process.exitCode=1;
 }
}
