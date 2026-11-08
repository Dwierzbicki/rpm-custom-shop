import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {inspectCartStructure} from './fmic-cart-diagnose.mjs';

test('cart structure diagnostics reveal only safe classes and count, no customer text',async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.setContent(`<!doctype html><html><body>
   <main><div class="shopping-cart customer-email-private@example.org">
    <div class="cart-item flex justify-end"><span>John Smith, john@example.org</span>
    <button>Usuń</button></div></div></main></body></html>`);
  const result=await inspectCartStructure(page);
  assert.equal(result.selectors['[class*="cart"]'],2);
  assert.equal(result.pageLocation,'offsite');
  assert.equal(result.structures.some(x=>x.classes.includes('cart-item')),true);
  const printed=JSON.stringify(result);
  assert.ok(!printed.includes('John'));
  assert.ok(!printed.includes('john@'));
  assert.ok(!printed.includes('private@example.org'));
  await page.close();
 }finally{await browser.close()}
});
test('empty-message detection returns boolean hints only, never original page text',async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.setContent('<main><div class="cart-empty">Twój koszyk jest pusty</div></main>');
  const result=await inspectCartStructure(page);
  assert.equal(result.words.koszyk,true);
  assert.equal(result.words.pusty,true);
  assert.ok(!JSON.stringify(result).includes('Twój'));
  await page.close();
 }finally{await browser.close()}
});

test('diagnostics reveal only selector structure around cart qty inputs, not SKU or item IDs',async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.setContent(`<main><div class="cart-item">
    <span class="sku">CONFIDENTIAL-123</span>
    <section class="quantity"><input id="cart-1455360-qty" name="cart[1455360][qty]" value="2"></section>
    <p>Private email: jane@example.org</p>
   </div></main>`);
  const result=await inspectCartStructure(page);
  assert.equal(result.skuNeighborhood.length,1);
  assert.ok(result.skuNeighborhood[0].ancestors.some(x=>x.skuMarkers===1&&x.quantityFields===1));
  const printed=JSON.stringify(result.skuNeighborhood);
  for(const secret of ['CONFIDENTIAL-123','1455360','jane@example.org']){
   assert.ok(!printed.includes(secret),'diagnostic leaked: '+secret);
  }
  await page.close();
 }finally{await browser.close()}
});
