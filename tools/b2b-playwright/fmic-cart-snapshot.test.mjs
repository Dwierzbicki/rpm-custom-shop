import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {inspectFmicCart} from './fmic-cart-snapshot.mjs';
import {verifyFmicCart} from './fmic-cart-verify.mjs';
const html=`<!doctype html><html><body><div class="cart table-wrapper"><table>
<tbody class="cart item"><tr><td><span class="product-item-sku">SKU: F00VE35007-BOS</span></td>
<td class="col price"><span class="cart-price"><span class="price">3,99 zł</span></span></td>
<td><input class="qty" value="2"></td></tr></tbody>
<tbody class="cart item"><tr><td><span class="product-item-sku">SKU: FMIC-ABC</span></td>
<td class="col price"><span class="cart-price"><span class="price">350,00 zł</span></span></td>
<td><input class="qty" value="1"></td></tr></tbody></table></div>
<div class="cart-totals"><div class="sub"><span class="price">357,98 zł</span></div></div>
</body></html>`;

test('offline fixture parses cart SKU, quantity, unit gross and subtotal without checkout',async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.route('**/*',route=>{
   if(route.request().url()==='https://fmic.pl/checkout/cart/')
    return route.fulfill({status:200,contentType:'text/html',body:html});
   return route.abort();
  });
  const observed=await inspectFmicCart(page);
  assert.deepEqual(observed.items,[
   {sku:'F00VE35007-BOS',qty:2,unitGrossPLN:3.99},
   {sku:'FMIC-ABC',qty:1,unitGrossPLN:350},
  ]);
  const result=verifyFmicCart([
   {sku:'F00VE35007-BOS',qty:2,cap:5},
   {sku:'FMIC-ABC',qty:1,cap:355},
  ],observed.items,observed.subtotalGrossPLN);
  assert.equal(result.ok,true);
  assert.equal(observed.subtotalGrossPLN,357.98);
  assert.equal(page.url(),'https://fmic.pl/checkout/cart/');
  await page.close();
 }finally{await browser.close()}
});

test('unknown cart layout fails closed rather than reporting a verified cart',async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.route('**/*',route=>route.fulfill({status:200,body:'<html>unknown cart layout</html>'}));
  await assert.rejects(inspectFmicCart(page),/Nie rozpoznano struktury koszyka/);
  await page.close();
 }finally{await browser.close()}
});
