import {chromium} from 'playwright';
import {access} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {DEFAULT_FMIC_SESSION_PATH,validateLocalSessionPath} from './fmic-login.mjs';
import {validateFmicProductUrl,guardFmicRequest} from './fmic-guard.mjs';
import {readFmicSku} from './fmic-sku.mjs';
import {parsePlnPrice} from './fmic-cart-verify.mjs';

export const FMIC_SEARCH_BASE='https://fmic.pl/catalogsearch/result/';
export const MAX_FMIC_SEARCH_CANDIDATES=24;
export const MAX_FMIC_SEARCH_CONCURRENCY=3;

export function validateSearchSku(value){
 if(typeof value!=='string'||! /^[A-Za-z0-9][A-Za-z0-9_.\/-]{1,59}$/.test(value)){
  throw Error('Podaj jeden dokładny SKU (2-60 znaków, bez spacji i znaków specjalnych)');
 }
 return value;
}
export function fmicSearchUrl(sku){
 const url=new URL(FMIC_SEARCH_BASE);
 url.searchParams.set('q',validateSearchSku(sku));
 return url.toString();
}
function secureProductLinks(urls){
 const distinct=new Set();
 for(const link of urls){
  try{distinct.add(validateFmicProductUrl(link))}catch{/* Not a public product link */}
 }
 return [...distinct];
}
export async function inspectFmicSearchPage(page,sku){
 const url=fmicSearchUrl(sku);
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 if(!response||response.status()<200||response.status()>=400||
  page.url()!==url)return {status:'unknown',reason:'search_redirect_or_error',links:[]};
 const links=await page.locator('main a[href], .products-grid a[href], .product-items a[href]')
  .evaluateAll(nodes=>nodes.map(node=>node.href));
 const productLinks=secureProductLinks(links);
 if(productLinks.length>MAX_FMIC_SEARCH_CANDIDATES)return {
  status:'unknown',reason:'too_many_search_candidates',links:[]};
 if(productLinks.length===0)return {
  status:'not-found',reason:'no_product_links',links:[]};
 return {status:'candidates',reason:null,links:productLinks};
}

/**
 * Read-only SKU search. Search result appearance is not proof of identity.
 * Open the public product card and match its VISIBLE .sku exactly.
 * Never add to cart, change any supplier data or submit an order.
 */
export async function searchFmicSkuOnPage(page,sku){
 const desired=validateSearchSku(sku);
 const candidates=await inspectFmicSearchPage(page,desired);
 if(candidates.status!=='candidates'){
  return {status:candidates.status,sku:desired,checked:0,
   reason:candidates.reason,product:null};
 }
 const unique=candidates.links;
 const results=new Array(unique.length).fill(null);
 let cursor=0;
 async function runWorker(){
  while(cursor<unique.length){
   const index=cursor++;
   const url=unique[index];
   let productPage=null;
   try{
    productPage=await page.context().newPage();
    const response=await productPage.goto(url,{
     waitUntil:'domcontentloaded',timeout:15000,
    });
    if(!response||response.status()<200||response.status()>=400||
     productPage.url()!==url)continue;
    const skuValue=(await readFmicSku(productPage))?.value;
    if(skuValue?.toUpperCase()!==desired.toUpperCase())continue;
    let price=null;
    for(const sel of [
     '.product-info-price [data-price-type="finalPrice"] .price',
     '.product-info-main [data-price-type="finalPrice"] .price',
     '.product-info-main .price-box .price',
    ]){
     const locator=productPage.locator(sel).first();
     if(!await locator.count()||!await locator.isVisible())continue;
     const value=(await locator.innerText()).trim();
     price=parsePlnPrice(value);
     if(price!==null)break;
    }
    let stock=null;
    for(const sel of ['.stock.available','.product-info-stock-sku .stock']){
     const locator=productPage.locator(sel).first();
     if(!await locator.count()||!await locator.isVisible())continue;
     stock=(await locator.innerText()).trim().slice(0,90);
     if(stock)break;
    }
    results[index]={url,sku:skuValue,priceGrossPLN:price,stock};
   }catch{/* A page that cannot be verified cannot be a SKU match. */}
   finally{await productPage?.close().catch(()=>{})}
  }
 }
 await Promise.all(Array.from({
  length:Math.min(MAX_FMIC_SEARCH_CONCURRENCY,unique.length)},()=>runWorker()));
 const matches=results.filter(Boolean);
 return {status:matches.length===1?'found':matches.length>1?'ambiguous':'not-found',
  sku:desired,checked:unique.length,
  reason:matches.length>1?'multiple_verified_matches':null,
  product:matches.length===1?matches[0]:null};
}
export async function searchFmicSkuLocally(sku,options={}){
 const session=validateLocalSessionPath(options.storageState??DEFAULT_FMIC_SESSION_PATH);
 await access(session).catch(()=>{throw Error('Brak lokalnej sesji FMIC. Najpierw npm run fmic:login')});
 const browser=await chromium.launch({headless:options.headless??true});
 try{
  const context=await browser.newContext({
   storageState:session,acceptDownloads:false,serviceWorkers:'block',
  });
  try{
   await context.route('**/*',route=>{
    const req=route.request();
    return guardFmicRequest(req.method(),req.url(),false)==='continue'
     ?route.continue():route.abort();
   });
   const page=await context.newPage();
   try{return await searchFmicSkuOnPage(page,sku)}
   finally{await page.close()}
  }finally{await context.close()}
 }finally{await browser.close()}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const sku=process.argv[2];
  const result=await searchFmicSkuLocally(sku);
  console.log('FMIC SAFE SKU SEARCH:',JSON.stringify(result,null,2));
  console.log('Wyszukiwanie tylko do odczytu. Nie zmieniono koszyka.');
  if(result.status!=='found')process.exitCode=2;
 }catch(error){
  console.error('FMIC SKU SAFE STOP:',error instanceof Error?error.message:String(error));
  process.exitCode=1;
 }
}
