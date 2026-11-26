// Read-only production smoke; requires authorized storage state on locked shop.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.RPM_BASE_URL??'http://localhost:3000';
const browser=await chromium.launch();
try{
 for(const [width,height] of [[360,800],[390,844],[768,1024],[1024,768],[1280,800],[1920,1080]]){
  const context=await browser.newContext({viewport:{width,height},...(process.env.RPM_STORAGE_STATE?{storageState:process.env.RPM_STORAGE_STATE}:{})});
  const page=await context.newPage();
  await page.goto(base+'/sklep?q=KP99086');
  const card=page.locator('.fplp-card').filter({has:page.locator('[data-variant-sku="KP99086-N"]')});
  await card.locator('[data-variant-sku="KP99086-N"]').click();
  await card.locator('.fplp-name').click();
  await page.waitForURL(url=>url.pathname.startsWith('/produkt/'));
  await page.locator('.rpm-product-sku strong').waitFor();
  await page.goBack();
  await card.locator('[data-variant-sku="KP99086-N"][aria-pressed=true]').waitFor();
  assert.equal(await card.getAttribute('data-listing-sku'),'KP99086-N');
  await card.locator('.fplp-name').click();
  await page.locator('.fmic-pdp-back').click();
  await card.locator('[data-variant-sku="KP99086-N"][aria-pressed=true]').waitFor();
  await page.goto(base+'/sklep/hamulce-i-kola');
  const next=page.getByRole('button',{name:'Następna strona',exact:true});
  for(let n=2;n<=10;n++){
   const response=page.waitForResponse(r=>r.url().includes('/api/catalog/fmic?')&&new URL(r.url()).searchParams.get('page')===String(n)&&r.ok());
   await next.click();await response;
   await page.locator('.fplp-pagination button[aria-current=page]').filter({hasText:new RegExp('^'+n+'$')}).waitFor();await page.locator('.fplp-card').first().waitFor();
  }
  const first=page.locator('.fplp-card').first();const before=await first.getAttribute('data-listing-sku');
  await first.locator('.fplp-name').click();await page.locator('.rpm-product-sku strong').waitFor();await page.goBack();
  await page.locator('.fplp-pagination button[aria-current=page]').filter({hasText:/^10$/}).waitFor();
  assert.equal(await page.locator('.fplp-card').first().getAttribute('data-listing-sku'),before);
  await context.close();console.log('PASS',width,height);
 }
}finally{await browser.close()}
