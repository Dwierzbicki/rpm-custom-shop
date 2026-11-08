import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createAgentReporter} from './agent-reporter.mjs';
import {validateFixtureJob} from './validate.mjs';
import {validateFmicProductUrl} from './fmic-guard.mjs';
import {inspectFmicProduct,prepareFmicCart} from './fmic-cart.mjs';

/**
 * Runs on the operator's own machine, never on Render.
 * Default is read-only and can inspect normal FMIC product pages.
 * Cart modifications require THREE simultaneous local opt-ins.
 * There is no checkout or order-submission API in this process.
 */
export async function runFmicAgent(job,config,options={}){
 validateFixtureJob(job);
 if(job.supplier!=='fmic')throw Error('Ten agent obsługuje wyłącznie FMIC');
 const mode=options.mode??'inspect';
 if(mode!=='inspect'&&mode!=='cart-only')throw Error('Niepoprawny tryb pracy FMIC');
 if(!config||typeof config!=='object'||!config.products||typeof config.products!=='object'){
  throw Error('Brak lokalnego mapowania SKU na adresy kart FMIC');
 }
 // Check all product URLs before any browser is started or any network
 // write is requested. Prices/options are checked in prepareFmicCart.
 const locations=job.lines.map(line=>{
  const entry=config.products[line.supplierSku];
  if(!entry||typeof entry.url!=='string')throw Error('Brak URL dla SKU '+line.supplierSku);
  return validateFmicProductUrl(entry.url);
 });
 if(mode==='cart-only'&&!(
  options.allowCartWrite===true&&options.confirmCartOnly===true&&
  options.cartEnvEnabled===true
 )){
  throw Error('Zakaz zmian koszyka: wymagane --cart-only, --confirm-cart-only i RPM_FMIC_CART_WRITE=YES');
 }
 const reporter=options.reporter??createAgentReporter(job,mode,options);
 const inspect=options.inspectImpl??inspectFmicProduct;
 const prepare=options.prepareImpl??prepareFmicCart;
 const browserOptions={
  headless:options.headless??true,storageState:options.storageState,
 };
 await reporter.report('started');
 try{
  if(mode==='inspect'){
   const results=[];
   for(const [i,line] of job.lines.entries()){
    await reporter.report('inspect_product',i);
    const found=await inspect(locations[i],{...browserOptions,expectedSku:line.supplierSku});
    results.push({sourceLine:line.sourceLine,sku:line.supplierSku,
     productFound:!!found?.product});
    await reporter.report('inspected',i);
   }
   await reporter.report('completed_readonly');
   return {mode:'read-only',runId:reporter.runId,results,cartChanged:false,orderPlaced:false};
  }
  const result=await prepare(job,config,{
   ...browserOptions,allowCartWrite:true,ack:'ADD_TO_CART_ONLY',runId:reporter.runId,
   onProgress:async(phase,position)=>reporter.report(phase,position),
  });
  if(result.status!=='cart-verified-needs-human-approval'||
     result.orderPlaced!==false||result.orderSubmitted!==false){
   throw Error('Brak potwierdzonego lokalnego raportu porównania koszyka');
  }
  await reporter.report('cart_verified');
  return {mode:'cart-only',runId:reporter.runId,
   cartChanged:true,cartVerified:true,orderPlaced:false,
   note:'Produkty w koszyku wymagają ręcznego sprawdzenia; zamówienie nie zostało wysłane.'};
 }catch(error){
  // If the reporting server is offline, do not continue shopping.
  try{await reporter.report('stopped')}catch{/* original failure remains primary */}
  throw error;
 }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const args=process.argv.slice(2);
  const [jobFile,configFile]=args;
  if(!jobFile||!configFile)throw Error(
   'Użycie: node agent-run.mjs job.json fmic-products.local.json [--cart-only --confirm-cart-only]'
  );
  const mode=args.includes('--cart-only')?'cart-only':'inspect';
  const job=JSON.parse(await readFile(path.resolve(jobFile),'utf8'));
  const config=JSON.parse(await readFile(path.resolve(configFile),'utf8'));
  const result=await runFmicAgent(job,config,{
   mode,allowCartWrite:mode==='cart-only',
   confirmCartOnly:args.includes('--confirm-cart-only'),
   cartEnvEnabled:process.env.RPM_FMIC_CART_WRITE==='YES',
   storageState:process.env.FMIC_LOCAL_AUTH_STATE||undefined,
  });
  console.log('RPM B2B AGENT DONE:',result);
 }catch(error){
  console.error('FMIC AGENT SAFE STOP:',error instanceof Error?error.message:String(error));
  process.exitCode=1;
 }
}
