// Read-only SSR/first-render regression, including JavaScript disabled.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.RPM_BASE_URL??'http://localhost:3000';
const browser=await chromium.launch();
try{
 for(const javaScriptEnabled of [false,true]){
  for(const width of [390,768,1366,1920]){
   const context=await browser.newContext({javaScriptEnabled,viewport:{width,height:900},...(process.env.RPM_STORAGE_STATE?{storageState:process.env.RPM_STORAGE_STATE}:{})});
   const page=await context.newPage();
   for(const path of ['/','/produkt/produkt/KP9016-02-BLACK']){
    await page.goto(base+path,{waitUntil:'domcontentloaded'});
    await page.locator('.rpm-header-v2').waitFor();
    if(javaScriptEnabled)await page.locator('.rpm-header-v2:not(.rpm-header-measuring)').waitFor();
    const state=await page.evaluate(()=>{
     const visible=selector=>{const el=document.querySelector(selector);return !!el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&el.getBoundingClientRect().width>0};
     return {desktop:visible('.rpm-desktop-categories'),mobile:visible('.rpm-clean-nav')};
    });
    assert.deepEqual(state,width>1000?{desktop:true,mobile:false}:{desktop:false,mobile:true},path+' '+width+' JS='+javaScriptEnabled);
    console.log('PASS',path,width,'JS='+javaScriptEnabled);
   }
   await context.close();
  }
 }
}finally{await browser.close()}
