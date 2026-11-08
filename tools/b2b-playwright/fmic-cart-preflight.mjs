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
 // Current FMIC storefront (observed on the operator's Mac, 2026-11-08)
 // does not use Magento's cart.table-wrapper rows. Its visible cart line
 // quantity inputs have id="cart-<numericItemId>-qty" and
 // name="cart[<numericItemId>][qty]". Do NOT treat the clear-cart button
 // itself as a cart item, and NEVER click it.
 // Two independent page indicators avoid mistaking a random quantity input
 // for an actual cart line.
 const correctLayout=await page.locator('body.checkout-cart-index').count()===1;
 const hasSummary=(await page.locator('.cart-summary, #cart-totals').count())>0;
 const clearControl=page.locator('#empty_cart_button');
 const hasClearControl=await clearControl.count()===1&&await clearControl.isVisible();
 if(correctLayout&&hasSummary&&hasClearControl){
  const qtyInputs=page.locator('input[id^="cart-"][id$="-qty"][name$="[qty]"]');
  const matching=[];
  const qtyCount=await qtyInputs.count();
  if(qtyCount>50){
   return {status:'unknown',itemCount:0,items:[],reason:'too_many_rows'};
  }
  for(let i=0;i<qtyCount;i++){
   const input=qtyInputs.nth(i);
   if(!await input.isVisible())continue;
   const id=(await input.getAttribute('id'))??'';
   const found=/^cart-[0-9]{1,20}-qty$/.test(id);
   // The diagnostic proved the cart-NNN-qty id and [qty] name suffix,
   // not the full name prefix. This check can only BLOCK mutations.
   if(!found)continue;
   matching.push(input);
  }
  if(matching.length>0){
   const items=[];
   for(const input of matching){
    let qty=null;
    try{
     const raw=(await input.inputValue({timeout:1500})).trim();
     if(/^[0-9]+$/.test(raw)){
      const parsed=Number(raw);
      if(Number.isSafeInteger(parsed)&&parsed>=1&&parsed<=100)qty=parsed;
     }
    }catch{/* Unknown quantity remains null; never assume zero. */}
    // SKU cannot be proven from quantity input alone. Do not infer it
    // from a product title, row id or a guessed link.
    items.push({sku:null,qty});
   }
   return {status:'nonempty',itemCount:items.length,items,reason:'items_detected'};
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
