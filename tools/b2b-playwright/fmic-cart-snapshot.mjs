import {parsePlnPrice} from './fmic-cart-verify.mjs';

const cartUrl='https://fmic.pl/checkout/cart/';
const rowSelectors=[
 '.cart.table-wrapper tbody.cart.item',
 '.cart.table-wrapper tr.item',
];
const fields={
 sku:['.product-item-sku','[data-th="SKU"]','[itemprop="sku"]','[data-sku]'],
 qty:['input.qty','input[name$="[qty]"]'],
 unit:['.col.price .cart-price .price','.col.price .price','[data-th="Cena"] .price'],
 subtotal:['.cart-totals .sub .price',
  '#shopping-cart-totals-table .sub .price',
  '.cart-summary .subtotal .price'],
};
async function locatorText(root,candidates){
 for(const selector of candidates){
  const loc=root.locator(selector);
  if(await loc.count()!==1)continue;
  const text=await loc.textContent({timeout:2000});
  if(text?.trim())return text.trim();
 }
 return null;
}
async function inputQty(root){
 for(const selector of fields.qty){
  const loc=root.locator(selector);
  if(await loc.count()!==1)continue;
  const value=(await loc.inputValue({timeout:2000})).trim();
  if(/^\d+$/.test(value))return Number(value);
 }
 return null;
}
/**
 * The only navigation here is GET /checkout/cart/ (view cart). Unknown
 * Magento layouts fail closed, with no checkout interaction or form writes.
 * SKU must be visible in the cart; names alone are never sufficient.
 */
export async function inspectFmicCart(page){
 await page.goto(cartUrl,{waitUntil:'domcontentloaded',timeout:45000});
 let rows=null;
 for(const selector of rowSelectors){
  const test=page.locator(selector);
  if(await test.count()>0){rows=test;break}
 }
 if(!rows)throw Error('Nie rozpoznano struktury koszyka FMIC; konieczna weryfikacja ręczna');
 const items=[];
 for(let index=0;index<await rows.count();index++){
  const row=rows.nth(index);
  const sku=(await locatorText(row,fields.sku))?.replace(/^(?:SKU|Symbol|Kod produktu)\s*[:#]?\s*/i,'').trim()??null;
  const qty=await inputQty(row);
  const text=await locatorText(row,fields.unit);
  const unitGrossPLN=text?parsePlnPrice(text):null;
  items.push({sku,qty,unitGrossPLN});
 }
 const summary=await locatorText(page,fields.subtotal);
 const subtotalGrossPLN=summary?parsePlnPrice(summary):null;
 return {items,subtotalGrossPLN,skuVerified:items.every(item=>!!item.sku),
  subtotalText:summary??null,cartUrl:page.url()};
}
