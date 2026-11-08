import {inspectFmicCart} from './fmic-cart-snapshot.mjs';

export const FMIC_CART_URL='https://fmic.pl/checkout/cart/';
const itemSelectors=['.cart.table-wrapper tbody.cart.item','.cart.table-wrapper tr.item'];
const emptySelectors=['.cart-empty','.cart-empty-wrapper','.message.info.empty','[data-testid="cart-empty"]'];
const emptyMessage=/(?:koszyk(?:\s+jest)?\s+pusty|brak\s+produkt[oó]w\s+w\s+koszyku|shopping\s+cart\s+is\s+empty|your\s+cart\s+is\s+empty)/i;

/**
 * Read-only cart preflight. Only an explicit empty-cart message in the
 * cart content area proves empty. Unrecognized UI or login redirect =>
 * unknown, never assumed empty. Never navigates to checkout payment.
 */
export async function checkFmicCartPreflight(page){
 await page.goto(FMIC_CART_URL,{waitUntil:'domcontentloaded',timeout:45000});
 const url=new URL(page.url());
 if(!['fmic.pl','www.fmic.pl'].includes(url.hostname)||
    !/^\/checkout\/cart\/(?:index\/?)?$/i.test(url.pathname)){
  return {status:'unknown',itemCount:0,items:[],reason:'cart_navigation_redirect'};
 }
 const login=page.locator('form[action*="login"], input[name="login[username]"]');
 if(await login.count()>0){
  return {status:'unknown',itemCount:0,items:[],reason:'login_required'};
 }
 let count=0;
 for(const selector of itemSelectors){
  count=await page.locator(selector).count();
  if(count>0)break;
 }
 if(count>0){
  if(count>50)return {status:'unknown',itemCount:0,items:[],reason:'too_many_rows'};
  try{
   const cart=await inspectFmicCart(page);
   if(cart.items.length!==count)throw Error('Incomplete items');
   const items=cart.items.map(item=>({
    sku:typeof item.sku==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.\/-]{1,119}$/.test(item.sku)
     ?item.sku:null,
    qty:Number.isSafeInteger(item.qty)&&item.qty>0&&item.qty<=100?item.qty:null,
   }));
   return {status:'nonempty',itemCount:count,items,reason:'items_detected'};
  }catch{
   // Detected rows mean the cart is not empty, even if SKU selectors fail.
   return {status:'nonempty',itemCount:count,items:[],reason:'unreadable_items'};
  }
 }
 for(const selector of emptySelectors){
  const nodes=page.locator(selector);
  if(await nodes.count()!==1)continue;
  try{
   if(!await nodes.isVisible())continue;
   const text=await nodes.innerText({timeout:1500});
   if(emptyMessage.test(text)){
    return {status:'empty',itemCount:0,items:[],reason:'explicit_empty_message'};
   }
  }catch{/* Do not assume anything from inaccessible text. */}
 }
 return {status:'unknown',itemCount:0,items:[],reason:'unrecognized_cart_layout'};
}
