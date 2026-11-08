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

test('FMIC Tailwind cart with one existing line stops with nonempty status (real observed selectors)',async()=>{
 const markup=`<!doctype html><html><body class="checkout-cart-index page-layout-1column">
 <main>
  <div class="cart actions flex flex-col">
   <button id="empty_cart_button">Wyczyść koszyk</button>
  </div>
  <div class="cart-summary"><div id="cart-totals">Suma</div></div>
  <input id="cart-1455360-qty" name="cart[1455360][qty]" value="3"
   class="form-input px-2 py-2 w-14 text-center"/>
 </main></body></html>`;
 await withCart(markup,async page=>{
  const result=await checkFmicCartPreflight(page);
  assert.equal(result.status,'nonempty');
  assert.equal(result.reason,'items_detected');
  assert.equal(result.itemCount,1);
  assert.deepEqual(result.items,[{sku:null,qty:3}]);
  assert.ok(!JSON.stringify(result).includes('1455360'),
   'cart row IDs must not leak into monitoring');
 });
});

test('FMIC Tailwind cart with two distinct qty inputs reads each item without clicking clear',async()=>{
 const markup=`<!doctype html><html><body class="checkout-cart-index"><main>
  <button id="empty_cart_button">Wyczyść</button>
  <section class="cart-summary">Podsumowanie</section>
  <input id="cart-22-qty" name="cart[22][qty]" value="1"/>
  <input id="cart-23-qty" name="cart[23][qty]" value="5"/>
 </main></body></html>`;
 await withCart(markup,async page=>{
  // Installed before page.goto within the preflight; observes a click on
  // the clear-cart button without ever clicking that button itself.
  await page.addInitScript(()=>{
   window.__fmicClearButtonClicked=false;
   document.addEventListener('click',event=>{
    if(event.target?.id==='empty_cart_button'){
     window.__fmicClearButtonClicked=true;
    }
   });
  });
  const result=await checkFmicCartPreflight(page);
  assert.equal(result.itemCount,2);
  assert.deepEqual(result.items,[{sku:null,qty:1},{sku:null,qty:5}]);
  assert.equal(await page.evaluate(()=>window.__fmicClearButtonClicked),false);
 });
});

test('FMIC cart does not infer empty from absence of item quantity inputs',async()=>{
 const markup=`<!doctype html><html><body class="checkout-cart-index"><main>
 <button id="empty_cart_button">Wyczyść</button>
 <section class="cart-summary">Podsumowanie</section>
 </main></body></html>`;
 await withCart(markup,async page=>{
  const result=await checkFmicCartPreflight(page);
  assert.equal(result.status,'unknown');
  assert.equal(result.itemCount,0);
 });
});

test('FMIC cart recognizes item id + qty suffix without assuming full name prefix',async()=>{
 const markup=`<!doctype html><html><body class="checkout-cart-index"><main>
 <button id="empty_cart_button">Wyczyść</button>
 <section class="cart-summary">Podsumowanie</section>
 <input id="cart-12-qty" name="cart[13][qty]" value="4"/>
 <input id="cart-14-qty" name="cart[14][qty]" value="0"/>
 </main></body></html>`;
 await withCart(markup,async page=>{
  const result=await checkFmicCartPreflight(page);
  assert.equal(result.status,'nonempty');
  assert.equal(result.itemCount,2);
  assert.deepEqual(result.items,[{sku:null,qty:4},{sku:null,qty:null}]);
 });
});

test('FMIC cart without independent confirmation of a cart layout stays unknown',async()=>{
 const markup=`<!doctype html><html><body class="checkout-cart-index"><main>
 <input id="cart-1455360-qty" name="cart[1455360][qty]" value="2"/>
 </main></body></html>`;
 await withCart(markup,async page=>{
  assert.equal((await checkFmicCartPreflight(page)).status,'unknown');
 });
});
