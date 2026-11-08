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
