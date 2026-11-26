// Read-only, no cart submission. Requires approved pilot family and authorized session.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.RPM_BASE_URL??'http://localhost:3000';
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext(process.env.RPM_STORAGE_STATE?{storageState:process.env.RPM_STORAGE_STATE}:{});
 const page=await context.newPage();
 const first='KP9016-02-BLACK',second='KP9016-02-N';
 for(const [width,height] of [[360,800],[390,844],[768,1024],[1024,768],[1280,800],[1920,1080]]){
  await page.setViewportSize({width,height});
  await page.goto(base+'/produkt/produkt/'+first);
  const choices=page.locator('.rpm-pdp-variants');await choices.waitFor();
  assert.equal(await choices.locator('[aria-current=true]').getAttribute('data-variant-sku'),first);
  const next=choices.locator('a[data-variant-sku="'+second+'"]');await next.click();
  await page.waitForURL(url=>url.pathname.endsWith('/'+second));
  await page.locator('.rpm-pdp-variants [aria-current=true][data-variant-sku="'+second+'"]').waitFor();
  assert.equal(await page.locator('.rpm-product-sku strong').innerText(),second);
  assert.equal(await page.locator('main[data-rpm-audit-sku]').getAttribute('data-rpm-audit-sku'),'sku='+second);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  console.log('PASS',width,height);
 }
 await context.close();
}finally{await browser.close()}
