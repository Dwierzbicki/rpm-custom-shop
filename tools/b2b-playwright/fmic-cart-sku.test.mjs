import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFmicCartItemSku} from './fmic-cart-sku.mjs';

async function inFixture(markup,fn){
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.setContent(markup);
  await fn(page);
 }finally{await browser.close()}
}
test('reads explicit .sku inside this cart line, not the title or row ID',async()=>{
 await inFixture(`<main><div class="cart-row flex border-b">
  <span class="sku text-right">SKU: F00VE35007-BOS</span>
  <section><input id="cart-1455360-qty" name="cart[1455360][qty]" value="1"></section>
 </div></main>`,async page=>{
  const input=page.locator('[id$="-qty"]');
  assert.equal(await readFmicCartItemSku(input),'F00VE35007-BOS');
 });
});
test('keeps SKU isolated in each cart row when two products exist',async()=>{
 await inFixture(`<main>
 <div class="cart-item"><span class="sku">RPM-001</span><input id="cart-11-qty" name="cart[11][qty]" value="1"></div>
 <div class="cart-item"><span class="sku">RPM-002</span><input id="cart-12-qty" name="cart[12][qty]" value="2"></div>
 </main>`,async page=>{
  const inputs=page.locator('input[id$="-qty"]');
  assert.equal(await readFmicCartItemSku(inputs.nth(0)),'RPM-001');
  assert.equal(await readFmicCartItemSku(inputs.nth(1)),'RPM-002');
 });
});
test('never reads unrelated SKU from cart sidebar or product recommendations',async()=>{
 await inFixture(`<main>
 <section class="cart-item"><input id="cart-11-qty" name="cart[11][qty]"></section>
 <aside class="product-recommendations"><span class="sku">WRONG-123</span></aside>
 </main>`,async page=>{
  assert.equal(await readFmicCartItemSku(page.locator('input')),null);
 });
});
test('unknown, hidden or conflicting SKU is not trusted',async()=>{
 await inFixture(`<main><div class="cart-item">
 <span class="sku" style="display:none">HIDDEN-123</span>
 <span class="sku">RPM-001</span><span class="sku">RPM-002</span>
 <input id="cart-22-qty" name="cart[22][qty]">
 </div></main>`,async page=>{
  assert.equal(await readFmicCartItemSku(page.locator('input')),null);
 });
});
test('product name and unsafe freeform text never become a SKU',async()=>{
 await inFixture(`<main><div class="cart-item">
 <p class="product-name">Wtryskiwacz Bosch 12345</p>
 <span class="sku">contact@example.com</span>
 <input id="cart-22-qty" name="cart[22][qty]"></div></main>`,
 async page=>{
  assert.equal(await readFmicCartItemSku(page.locator('input')),null);
 });
});
