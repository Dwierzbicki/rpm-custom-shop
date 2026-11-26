// Read-only storefront regression; uses an already authenticated Playwright storage state.
// RPM_BASE_URL=https://rpmcustom.pl RPM_STORAGE_STATE=/secure/state.json node scripts/test-manifold-pdp-rwd.mjs
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.RPM_BASE_URL??'http://localhost:3000';
const profiles=[[360,800],[390,844],[768,1024],[1024,768],[1280,800],[1920,1080]];
const browser=await chromium.launch({headless:true});
let failures=0;
try{
 for(const [width,height] of profiles){
  const context=await browser.newContext({viewport:{width,height},...(process.env.RPM_STORAGE_STATE?{storageState:process.env.RPM_STORAGE_STATE}:{})});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   for(const sku of ['RPM-00032','RPM-00033']){
    await page.goto(base+'/produkt/produkt/'+sku);
    if(new URL(page.url()).pathname==='/site-access')throw Error('BLOCKED: authenticated storage state required');
    await page.locator('.rpm-pdp-config').waitFor();
    const gallery=page.locator('.fmic-pdp-gallery');
    const bounds=await gallery.boundingBox();
    assert.ok(bounds&&bounds.height>=200,'Collapsed gallery');
    assert.equal(await page.locator('#rpm-pdp-description-title').count(),1);
    const add=page.locator('.rpm-pdp-add');
    assert.equal(await add.isDisabled(),true);
    const choose=async(group,value)=>page.locator('input[type=radio][name="'+sku+'-'+group+'"][value="'+value+'"]').check();
    if(sku==='RPM-00032'){await choose('rpm-engine','m54');await choose('rpm-chassis','e46')}
    await choose('rpm-flange','t3-single');
    await choose('rpm-wg-diameter','internal');
    await choose('rpm-egt','yes');
    assert.equal(await add.isEnabled(),true);
    assert.match(await page.locator('.rpm-pdp-wg-summary').innerText(),/0× WG/);
    const priceBefore=await page.locator('.price-large').innerText();
    await choose('rpm-flange','t4-single');
    assert.equal(await page.locator('input[name="'+sku+'-rpm-wg-diameter"][value="internal"]').count(),0);
    assert.equal(await add.isDisabled(),true);
    await choose('rpm-wg-diameter','wg-44');
    assert.equal(await add.isEnabled(),true);
    assert.match(await page.locator('.rpm-pdp-wg-summary').innerText(),/2× WG.*44 mm/s);
    assert.notEqual(await page.locator('.price-large').innerText(),priceBefore);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
    assert.deepEqual(errors,[]);
    console.log('PASS',width,height,sku);
   }
  }catch(e){failures++;console.error('FAIL/BLOCKED',width,height,e.message)}
  finally{await context.close()}
 }
}finally{await browser.close()}
if(failures)process.exitCode=1;
