// Read-only regression; run against local server or authorized storage state.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.RPM_BASE_URL??'http://localhost:3000';
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext(process.env.RPM_STORAGE_STATE?{storageState:process.env.RPM_STORAGE_STATE}:{});
 const page=await context.newPage();
 const slug='silikonowe-kolanko-redukcyjne-45-48-70mm-zielony';
 const sku='004548/70-G';
 const expected='/produkt/'+slug+'?'+new URLSearchParams({sku});
 for(const path of [expected,'/produkt/'+slug+'/004548%2F70-G','/produkt/'+slug+'/004548/70-G','/produkt/produkt?sku=004548%2F70-G']){
  const response=await page.goto(base+path);
  if(new URL(page.url()).pathname==='/site-access')throw Error('BLOCKED: authenticated storage state required');
  assert.equal(response.status(),200,path);
  assert.equal(new URL(page.url()).pathname+new URL(page.url()).search,expected,path);
  await page.locator('.rpm-pdp-title').waitFor();
  assert.match(await page.locator('.rpm-pdp-title').innerText(),/004548\/70-G/);
  console.log('PASS',path);
 }
 const ordinary=await page.goto(base+'/produkt/produkt/RPM-00031');assert.equal(ordinary.status(),200);
 assert.match(new URL(page.url()).pathname,/\/RPM-00031$/);
 const missing=await page.goto(base+'/produkt/produkt?sku=__RPM_TEST_NONEXISTENT_20261126__');
 assert.equal(missing.status(),404);
 await context.close();
}finally{await browser.close()}
