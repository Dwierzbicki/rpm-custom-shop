import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {normalizeFmicSku,readFmicSku} from './fmic-sku.mjs';

test('detects the actual FMIC Tailwind .sku class, not styling utilities',async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.setContent(`<!doctype html><html><body>
    <div class="product-info-main"><div
      class="flex justify-end w-1/2 ml-2 text-right text-gray-900 sku">F00VE35007-BOS</div></div>
   </body></html>`);
  const result=await readFmicSku(page);
  assert.equal(result?.value,'F00VE35007-BOS');
  assert.ok(['.product-info-main .sku','.sku'].includes(result?.selector));
  await page.close();
 }finally{await browser.close()}
});
test('handles labels and whitespace, but never guesses SKU from the title',async()=>{
 assert.equal(normalizeFmicSku('SKU: F00VE35007-BOS'),'F00VE35007-BOS');
 assert.equal(normalizeFmicSku('  Kod produktu: F00VE35007-BOS  '),'F00VE35007-BOS');
 assert.equal(normalizeFmicSku('  590 123 456  '),null);
 assert.equal(normalizeFmicSku(''),null);
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.setContent('<html><head><title>F00VE35007-BOS</title></head><body><div>Some product</div></body></html>');
  assert.equal(await readFmicSku(page),null);
  await page.close();
 }finally{await browser.close()}
});
test('multiple visible different .sku values are ambiguous and blocked',async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.setContent('<div class="sku">F00VE35007-BOS</div><div class="sku">ANOTHER-SKU</div>');
  assert.equal(await readFmicSku(page),null);
  await page.close();
 }finally{await browser.close()}
});
