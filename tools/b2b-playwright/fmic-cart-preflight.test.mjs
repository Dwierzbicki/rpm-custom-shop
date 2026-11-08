import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {checkFmicCartPreflight} from './fmic-cart-preflight.mjs';

async function withCart(html,fn){
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.route('**/*',route=>{
   if(route.request().url()==='https://fmic.pl/checkout/cart/')
    return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
   return route.abort();
  });
  return await fn(page);
 }finally{await browser.close()}
}
test('identifies explicitly empty cart without mutating any item',async()=>{
 await withCart('<html><body><div class="cart-empty">Twój koszyk jest pusty</div></body></html>',
 async page=>{
  const result=await checkFmicCartPreflight(page);
  assert.deepEqual(result,{status:'empty',itemCount:0,items:[],reason:'explicit_empty_message'});
 });
});
test('recognizes existing item and records only SKU + quantity',async()=>{
 const markup=`<!doctype html><html><head><meta charset="utf-8"></head><body>
 <div class="cart table-wrapper"><table><tbody class="cart item">
 <tr><td><span class="product-item-sku">SKU: F00VE35007-BOS</span></td>
 <td class="col price"><span class="cart-price"><span class="price">3,99 zł</span></span></td>
 <td><input class="qty" value="2"></td></tr>
 </tbody></table></div><div class="cart-totals"><span class="sub"><span class="price">7,98 zł</span></span></div></body></html>`;
 await withCart(markup,async page=>{
  const result=await checkFmicCartPreflight(page);
  assert.equal(result.status,'nonempty');
  assert.equal(result.itemCount,1);
  assert.deepEqual(result.items,[{sku:'F00VE35007-BOS',qty:2}]);
  assert.ok(!JSON.stringify(result).includes('3,99'));
 });
});
test('nonempty rows with unreadable SKU are still nonempty (never empty)',async()=>{
 await withCart('<div class="cart table-wrapper"><table><tbody class="cart item"><tr><td>Unknown product</td></tr></tbody></table></div>',
 async page=>{
  const result=await checkFmicCartPreflight(page);
  assert.equal(result.status,'nonempty');
  assert.equal(result.itemCount,1);
 });
});
test('unrecognized DOM never returns empty or grants cart modification',async()=>{
 await withCart('<html><body><div id="cart">Lorem ipsum</div></body></html>',
 async page=>{
  const result=await checkFmicCartPreflight(page);
  assert.equal(result.status,'unknown');
  assert.equal(result.reason,'unrecognized_cart_layout');
 });
});
test('cart redirect to login is unknown',async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.route('**/*',route=>{
   if(route.request().url()==='https://fmic.pl/checkout/cart/')
    return route.fulfill({status:302,headers:{location:'https://fmic.pl/customer/account/login/'},body:''});
   return route.fulfill({status:200,contentType:'text/html',body:'<input name="login[username]">'});
  });
  const result=await checkFmicCartPreflight(page);
  assert.equal(result.status,'unknown');
  assert.equal(result.reason,'cart_navigation_redirect');
 }finally{await browser.close()}
});
