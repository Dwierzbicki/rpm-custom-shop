// Read-only, authorized browser session required when the storefront is locked.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.RPM_BASE_URL??'http://localhost:3000';
const browser=await chromium.launch();
try{
 const context=await browser.newContext(process.env.RPM_STORAGE_STATE?{storageState:process.env.RPM_STORAGE_STATE}:{});
 const page=await context.newPage();
 await page.goto(base+'/sklep/hamulce-i-kola');
 await page.locator('.fplp-card').first().waitFor();
 for(const [width,height,expected] of [[360,800,2],[390,844,2],[768,1024,2],[1024,768,2],[1150,800,2],[1151,800,4],[1280,800,4],[1365,800,4],[1366,800,5],[1367,800,5],[1920,1080,5]]){
  await page.setViewportSize({width,height});
  const grid=page.locator('.fplp-grid').filter({has:page.locator('.fplp-card')});
  const result=await grid.evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth>innerWidth+1}));
  assert.equal(result.columns,expected,'columns '+width);assert.equal(result.overflow,false,'overflow '+width);
  console.log('PASS',width,height,expected);
 }
 await page.getByRole('button',{name:'Widok listy',exact:true}).click();
 assert.equal(await page.locator('.fplp-grid.fplp-list').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
 await context.close();
}finally{await browser.close()}
