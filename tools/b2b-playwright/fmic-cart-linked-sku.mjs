import {readFmicSku,normalizeFmicSku} from './fmic-sku.mjs';
import {validateFmicProductUrl} from './fmic-guard.mjs';

export const MAX_FMIC_CART_LINES=50;
export const MAX_FMIC_PRODUCT_LOOKUPS=3;

/**
 * The only purpose of a cart product hyperlink is to visit the official
 * FMIC product page and read a VISIBLE SKU marker. The URL slug is never SKU.
 * A bounded three-tab pool handles multiple lines without flooding FMIC.
 * Preserve input order and use a single GET per distinct trusted product URL.
 */
export async function verifyFmicCartLineSkus(cartPage,lines,urls){
 if(!Array.isArray(lines)||!Array.isArray(urls)||
  lines.length!==urls.length||lines.length>MAX_FMIC_CART_LINES){
  throw Error('Niepoprawna liczba pozycji do weryfikacji SKU');
 }
 const clean=urls.map(url=>{
  if(!url)return null;
  try{return validateFmicProductUrl(url)}catch{return null}
 });
 const distinct=[...new Set(clean.filter(Boolean))];
 const checked=new Map();
 let next=0;
 async function worker(){
  while(next<distinct.length){
   const url=distinct[next++];
   let sku=null;
   let page=null;
   try{
    page=await cartPage.context().newPage();
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
    if(response&&response.status()>=200&&response.status()<400&&page.url()===url){
     sku=normalizeFmicSku((await readFmicSku(page))?.value);
    }
   }catch{/* Missing SKU is not authorization to alter the cart. */}
   finally{await page?.close().catch(()=>{})}
   checked.set(url,sku);
  }
 }
 await Promise.all(Array.from(
  {length:Math.min(MAX_FMIC_PRODUCT_LOOKUPS,distinct.length)},()=>worker()
 ));
 return lines.map((item,i)=>{
  const cartSku=normalizeFmicSku(item.sku);
  const pageSku=clean[i]?checked.get(clean[i])??null:null;
  // Any conflict is deliberately unresolved. Each cart line has its own
  // result, even where product links are reused across different lines.
  const sku=cartSku&&pageSku&&cartSku.toUpperCase()!==pageSku.toUpperCase()
   ?null:(pageSku??cartSku);
  return {sku,qty:item.qty};
 });
}
