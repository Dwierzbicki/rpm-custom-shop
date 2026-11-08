import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {validateFixtureJob} from './validate.mjs';
import {validateFmicProductUrl,guardFmicRequest,exampleFmicProductUrl} from './fmic-guard.mjs';
import {parsePlnPrice,verifyFmicCart} from './fmic-cart-verify.mjs';
import {inspectFmicCart} from './fmic-cart-snapshot.mjs';
import {readFmicSku} from './fmic-sku.mjs';
import {checkFmicCartPreflight} from './fmic-cart-preflight.mjs';
import {DEFAULT_FMIC_SESSION_PATH} from './fmic-login.mjs';

const folder=path.dirname(fileURLToPath(import.meta.url));
const selectors={
 price:['.product-info-price [data-price-type="finalPrice"] .price',
  '.product-info-main [data-price-type="finalPrice"] .price',
  '.product-info-main .price-box .price'],
 qty:['#qty','input[name="qty"]'],
 add:['#product-addtocart-button','button[title="Dodaj do koszyka"]',
  'button[title="Add to Cart"]'],
};
const log=(name,details='')=>console.log('[FMIC SAFE]',name,details);

async function firstText(page,candidates){
 for(const selector of candidates){
  const el=page.locator(selector).first();
  try{if(await el.count()&&await el.isVisible({timeout:1000})){
   const value=(await el.textContent({timeout:1500}))?.trim();
   if(value)return {selector,value};
  }}catch{/* Different storefront layout; try the next selector. */}
 }
 return null;
}
async function firstInput(page,candidates){
 for(const selector of candidates){
  const element=page.locator(selector).first();
  try{if(await element.count()&&await element.isVisible({timeout:800}))return element}catch{}
 }
 return null;
}
async function inspection(page,url,sku){
 const checked=validateFmicProductUrl(url);
 await page.goto(checked,{waitUntil:'domcontentloaded',timeout:45000});
 const detected=await readFmicSku(page);
 const displayPrice=await firstText(page,selectors.price);
 const stock=await firstText(page,['.stock.available','.product-info-stock-sku .stock']);
 const qty=await firstInput(page,selectors.qty);
 const add=await firstInput(page,selectors.add);
 const title=(await page.title()).slice(0,180);
 const outcome={url:checked,title,sku:detected?.value??null,skuSelector:detected?.selector??null,
  priceText:displayPrice?.value??null,currentGrossPrice:displayPrice?parsePlnPrice(displayPrice.value):null,
  priceSelector:displayPrice?.selector??null,stock:stock?.value??null,
  quantityControlFound:!!qty,addButtonFound:!!add};
 if(sku&&outcome.sku?.trim().toUpperCase()!==sku.trim().toUpperCase()){
  throw Error('SKU na karcie NIE odpowiada SKU zamówienia: '+sku);
 }
 log('INSPECT',JSON.stringify(outcome));
 return outcome;
}
async function browserContext(options){
 const browser=await chromium.launch({headless:options.headless??true});
 let context;
 try{
  context=await browser.newContext({
   serviceWorkers:'block',acceptDownloads:false,
   ...(options.storageState?{storageState:options.storageState}:{}),
  });
  const events={blocked:0,cartAddRequests:0};
  await context.route('**/*',route=>{
   const request=route.request();
   const decision=guardFmicRequest(request.method(),request.url(),options.allowCartWrite===true&&
    (typeof options.canWrite!=='function'||options.canWrite()));
   if(decision==='continue'){
    if(request.method()==='POST')events.cartAddRequests++;
    return route.continue();
   }
   events.blocked++;
   return route.abort();
  });
  return {browser,context,events};
 }catch(error){await context?.close().catch(()=>{});await browser.close();throw error}
}
export async function inspectFmicProduct(url=exampleFmicProductUrl,opts={}){
 const safe=validateFmicProductUrl(url);
 const runId=randomUUID();
 const {browser,context,events}=await browserContext({headless:opts.headless,storageState:opts.storageState});
 try{
  const page=await context.newPage();
  const found=await inspection(page,safe,opts.expectedSku);
  const outDir=opts.outDir??path.join(folder,'artifacts');
  await mkdir(outDir,{recursive:true});
  const screenshot=path.join(outDir,'fmic-inspection-'+runId+'.png');
  await page.screenshot({path:screenshot,fullPage:true});
  const result={mode:'read-only-site-inspection',runId,product:found,
   blockedRequests:events.blocked,cartAddRequests:0,orderPlaced:false,sentToSupplier:false,
   screenshot};
  const report=path.join(outDir,'fmic-inspection-'+runId+'.json');
  await writeFile(report,JSON.stringify(result,null,2)+'\n','utf8');
  log('STOP','Inspekcja publicznego produktu zakończona; niczego nie dodano do koszyka.');
  return result;
 }finally{await context.close();await browser.close()}
}

/**
 * Human explicitly enables this mode. It can call Magento ADD-TO-CART only
 * and stops before any checkout steps. It never sends orders, accepts payment,
 * confirms delivery or writes customer details. Unknown selectors => STOP.
 */
export async function prepareFmicCart(job,config,opts={}){
 validateFixtureJob(job);
 if(job.supplier!=='fmic'||job.mode!=='fixture-only')throw Error('Oczekiwano wyłącznie zadania FMIC');
 if(opts.allowCartWrite!==true||opts.ack!=='ADD_TO_CART_ONLY'){
  throw Error('Dodanie do koszyka wymaga osobnego jawnego potwierdzenia');
 }
 if(!config||typeof config!=='object'||!config.products||typeof config.products!=='object'){
  throw Error('Brak mapowania SKU FMIC na adresy produktów');
 }
 const setup=job.lines.map(line=>{
  const row=config.products[line.supplierSku];
  if(!row||typeof row!=='object'||typeof row.url!=='string'||
   !Number.isFinite(row.maxUnitGrossPLN)||row.maxUnitGrossPLN<=0||
   row.maxUnitGrossPLN>10_000_000){
   throw Error('Dla '+line.supplierSku+' wymagany URL i maksymalna aktualna cena brutto w PLN');
  }
  if(line.requiresVariantReview||Object.keys(line.options).length){
   throw Error('Wariant '+line.supplierSku+' musi być ręcznie zweryfikowany — brak automatycznego wyboru opcji');
  }
  return {sku:line.supplierSku,url:validateFmicProductUrl(row.url),
   qty:line.quantity,cap:row.maxUnitGrossPLN};
 });
 if(setup.length!==new Set(setup.map(x=>x.sku)).size){
  throw Error('Powtórzone SKU: bezpiecznie zatrzymano przed dodaniem do koszyka');
 }
 const runId=opts.runId??randomUUID(),trace=[],start=Date.now();
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(runId)){
  throw Error('Niepoprawny identyfikator przebiegu lokalnego agenta');
 }
 const outDir=opts.outDir??path.join(folder,'artifacts');
 await mkdir(outDir,{recursive:true});
 // No cart mutation permitted during the initial logged-in cart check.
 // The lock is created ONLY after an explicitly verified empty cart.
 let writeEnabled=false;
 const lockPath=path.join(outDir,'fmic-cart-lock-'+job.jobId+'.json');
 const {browser,context,events}=await browserContext({
  headless:opts.headless,
  storageState:opts.storageState??DEFAULT_FMIC_SESSION_PATH,
  allowCartWrite:true,canWrite:()=>writeEnabled,
 });
 let cartChanged=false;
 let page;
 try{
  page=await context.newPage();
  const preflight=await checkFmicCartPreflight(page);
  await opts.onPreflight?.(preflight);
  if(preflight.status!=='empty'){
   throw Error(preflight.status==='nonempty'
    ?'Koszyk FMIC zawiera '+preflight.itemCount+' pozycji. ZATRZYMANO. Nie usuwam produktów bez Twojej zgody.'
    :'Nie potwierdzono pustego koszyka FMIC. ZATRZYMANO bez zmian.');
  }
  // Atomic one-attempt lock prevents adding the same job twice.
  try{
   await writeFile(lockPath,JSON.stringify({jobId:job.jobId,startedAt:new Date().toISOString(),
    warning:'Check the real FMIC cart before ever retrying this job.'}),{flag:'wx'});
  }catch{
   throw Error('To zadanie miało już próbę dodania do koszyka. Sprawdź koszyk FMIC przed ponowieniem.');
  }
  writeEnabled=true;
  for(const [index,item] of setup.entries()){
   await opts.onProgress?.('inspect_product',index);
   const details=await inspection(page,item.url,item.sku);
   await opts.onProgress?.('inspected',index);
   if(details.stock&&!/w magazynie|in stock/i.test(details.stock))
    throw Error('Produkt '+item.sku+' nie został potwierdzony jako dostępny');
   if(details.currentGrossPrice===null||details.currentGrossPrice>item.cap)
    throw Error('Cena na FMIC nie została rozpoznana lub przekroczyła limit: '+item.sku);
   if(!details.quantityControlFound||!details.addButtonFound)
    throw Error('Układ strony FMIC się różni — sprawdź selektory (brak ilości lub Dodaj do koszyka)');
   const qty=await firstInput(page,selectors.qty),add=await firstInput(page,selectors.add);
   if(!qty||!add)throw Error('Kontrolki produktu zniknęły');
   await qty.fill(String(item.qty));
   const form=add.locator('xpath=ancestor::form');
   if(await form.count()&&await form.getAttribute('action')){
    const action=new URL((await form.getAttribute('action')),page.url());
    if(guardFmicRequest('POST',action.href,true)!=='continue'){
     throw Error('Nieznany endpoint formularza — nie klikam Dodaj do koszyka');
    }
   }else{
    throw Error('Brak zweryfikowanego formularza Dodaj do koszyka — wymagane mapowanie adaptera');
   }
   await opts.onProgress?.('cart_add',index);
   const before=events.cartAddRequests;
   // Capture Magento's actual add-to-cart response. Merely clicking the
   // button is not proof that FMIC accepted the cart modification.
   const responsePromise=page.waitForResponse(response=>
    response.request().method()==='POST'&&
    /^\/checkout\/cart\/add(?:\/|$)/i.test(new URL(response.url()).pathname),
    {timeout:16000});
   await add.click({timeout:10000});
   const response=await responsePromise;
   cartChanged=events.cartAddRequests>before;
   if(!cartChanged||response.status()<200||response.status()>=400){
    throw Error('FMIC nie potwierdził dodania do koszyka; status: '+response.status());
   }
   await opts.onProgress?.('cart_add_ack',index);
   trace.push({action:'add_to_cart',sku:item.sku,qty:item.qty,
    responseStatus:response.status(),result:'requested'});
  }
  // Only a read-only GET cart view is allowed after cart additions.
  // Unknown SKU, quantity, unit price or product subtotal -> fail closed.
  await opts.onProgress?.('inspect_cart',null);
  const cart=await inspectFmicCart(page);
  const checked=verifyFmicCart(setup,cart.items,cart.subtotalGrossPLN);
  const screenshot=path.join(outDir,'fmic-cart-'+runId+'.png');
  await page.screenshot({path:screenshot,fullPage:true});
  const report={runId,jobId:job.jobId,orderId:job.orderId,supplier:'fmic',
   status:checked.ok?'cart-verified-needs-human-approval':'cart-not-verified',
   lines:trace,cartVerification:checked,cartAddRequests:events.cartAddRequests,
   blockedRequests:events.blocked,durationMs:Date.now()-start,
   screenshot,orderPlaced:false,orderSubmitted:false,
   note:'Koszyk porównano z planem. Nawet zgodny koszyk wymaga ręcznej kontroli i ręcznej finalizacji w osobnej sesji.'};
  await writeFile(path.join(outDir,'fmic-cart-'+runId+'.json'),JSON.stringify(report,null,2)+'\n');
  if(!checked.ok)throw Error('Koszyk FMIC nie przeszedł weryfikacji: '+checked.issues.join(' | '));
  log('STOP','Koszyk zweryfikowano przez GET; nie uruchomiono checkout ani finalizacji.');
  return report;
 }catch(error){
  const message=error instanceof Error?error.message:String(error);
  log('SAFETY STOP',message);
  if(cartChanged||events.cartAddRequests>0)log('NOTICE','Koszyk mógł już zostać zmieniony. NIE uruchamiaj drugi raz bez sprawdzenia.');
  // Record a safe local failure even if the DOM changed after a partial add.
  // Never upload screenshots, credentials or customer data.
  await writeFile(path.join(outDir,'fmic-cart-failure-'+runId+'.json'),
   JSON.stringify({runId,jobId:job.jobId,orderId:job.orderId,supplier:'fmic',
    status:'manual-review-required',cartMayHaveChanged:cartChanged||events.cartAddRequests>0,
    cartAddRequests:events.cartAddRequests,durationMs:Date.now()-start,
    error:message.slice(0,500),orderPlaced:false,orderSubmitted:false},null,2)+'\n'
  ).catch(()=>{});
  throw error;
 }finally{await context.close();await browser.close()}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const command=process.argv[2]??'inspect';
  if(command==='inspect'){
   await inspectFmicProduct(process.argv[3]??exampleFmicProductUrl);
  }else if(command==='prepare'){
   const [jobFile,configFile]=process.argv.slice(3,5);
   if(!jobFile||!configFile)throw Error('Składnia: prepare job.json products.json --confirm-cart-only');
   const job=JSON.parse(await readFile(path.resolve(jobFile),'utf8'));
   const config=JSON.parse(await readFile(path.resolve(configFile),'utf8'));
   const allowed=process.argv.includes('--confirm-cart-only')&&process.env.RPM_FMIC_CART_WRITE==='YES';
   await prepareFmicCart(job,config,{allowCartWrite:allowed,
    ack:allowed?'ADD_TO_CART_ONLY':undefined,
    storageState:process.env.FMIC_LOCAL_AUTH_STATE||undefined,
   });
  }else throw Error('Użyj trybu inspect albo prepare');
 }catch(error){
  console.error('FMIC SAFE STOP:',error instanceof Error?error.message:String(error));
  process.exitCode=1;
 }
}
