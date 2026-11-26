// Read-only visual geometry regression. Requires a valid authorized session for the locked site.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.RPM_BASE_URL??'http://localhost:3000';
const browser=await chromium.launch();
try{
 const context=await browser.newContext(process.env.RPM_STORAGE_STATE?{storageState:process.env.RPM_STORAGE_STATE}:{});
 const page=await context.newPage();
 for(const path of ['/','/sklep/hamulce-i-kola','/produkt/produkt/KP9016-02-BLACK','/koszyk']){
  await page.goto(base+path);
  await page.locator('.rpm-header-main').waitFor();
  await page.locator('.rpm-footer-inner').waitFor();
  if(path.startsWith('/sklep'))await page.locator('.fplp-card').first().waitFor();
  if(path.startsWith('/produkt'))await page.locator('.fmic-pdp.rpm-pdp-premium').waitFor();
  for(const [width,height] of [[360,800],[390,844],[768,1024],[1024,768],[1280,800],[1365,800],[1366,800],[1367,800],[1920,1080],[2560,1440]]){
   await page.setViewportSize({width,height});
   const geometry=await page.evaluate(()=>{
    const box=(selector)=>{const el=document.querySelector(selector);return el?el.getBoundingClientRect().width:null};
    return {viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,header:box('.rpm-header-main'),footer:box('.rpm-footer-inner'),listing:box('.page:has(> .fmic-plp)'),detail:box('.page:has(> .fmic-pdp)'),cart:box('.rpm-cart-page')};
   });
   assert.ok(geometry.scroll<=geometry.viewport+1,path+' overflow '+width);
   if(width>=1366){
    assert.ok(Math.abs(geometry.header-Math.min(1800,geometry.viewport))<=2,path+' header '+width);
    assert.ok(Math.abs(geometry.footer-geometry.header)<=2,path+' footer '+width);
    if(geometry.listing!==null)assert.ok(Math.abs(geometry.listing-geometry.header)<=2,'listing width');
    for(const w of [geometry.detail,geometry.cart])if(w!==null)assert.ok(w<=1601,'detail width');
   }
   if(path==='/'){
    const edges=await page.evaluate(()=>{
     const brand=document.querySelector('.rpm-brand-carousel')?.getBoundingClientRect();
     const windowBox=document.querySelector('.rpm-brand-carousel-window')?.getBoundingClientRect();
     const lab=document.querySelector('.rpm-hp-v2 .rpm-motolab')?.getBoundingClientRect();
     if(!brand||!windowBox||!lab)return null;
     return [brand.left-lab.left,brand.right-lab.right,windowBox.left-lab.left,windowBox.right-lab.right];
    });
    assert.ok(edges&&edges.every(delta=>Math.abs(delta)<=1),'Brand carousel and MotoLab edges '+width+': '+JSON.stringify(edges));
   }
   console.log('PASS',path,width,height);
  }
 }
 await context.close();
}finally{await browser.close()}
