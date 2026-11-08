import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {searchFmicSkuOnPage,validateSearchSku,fmicSearchUrl,
 MAX_FMIC_SEARCH_CANDIDATES,MAX_FMIC_SEARCH_CONCURRENCY} from './fmic-search.mjs';
import {guardFmicRequest} from './fmic-guard.mjs';

async function fixture(sku,products,fn){
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({serviceWorkers:'block'});
  const calls=[];
  await context.route('**/*',route=>{
   const req=route.request(),url=req.url();calls.push({method:req.method(),url});
   if(guardFmicRequest(req.method(),url,false)!=='continue')return route.abort();
   if(url===fmicSearchUrl(sku)){
    const links=products.map(p=>'<a href="'+p.url+'">Produkt</a>').join('');
    return route.fulfill({status:200,contentType:'text/html',
     body:'<!doctype html><html><head><meta charset="utf-8"></head><body><main><section class="products-grid">'+links+'</section></main></body></html>'});
   }
   const match=products.find(p=>p.url===url);
   if(match)return route.fulfill({status:200,contentType:'text/html',
    body:'<!doctype html><html><head><meta charset="utf-8"></head><body><main><div class="product-info-main">'+
      (match.sku===null?'<span>Nieznany kod</span>':
       '<span class="sku">SKU: '+match.sku+'</span>')+
      '<div class="price-box"><span class="price">19,99 zł</span></div>'+
      '<span class="stock available">W magazynie</span></div></main></body></html>'});
   return route.abort();
  });
  const page=await context.newPage();
  await fn(page,calls);
  await context.close();
 }finally{await browser.close()}
}
test('SKU search URL is limited to one safe GET q parameter',()=>{
 const url=fmicSearchUrl('USA-ARE-14107');
 assert.equal(url,'https://fmic.pl/catalogsearch/result/?q=USA-ARE-14107');
 assert.equal(guardFmicRequest('GET',url,false),'continue');
 for(const invalid of ['', 'hello world', 'a', 'q=1&x=2', 'foo@bar', 'foo?bar']){
  assert.throws(()=>validateSearchSku(invalid));
 }
 for(const value of ['https://fmic.pl/catalogsearch/result/?q=abc&from=admin',
  'https://fmic.pl/catalogsearch/result/?q=abc%20def',
  'https://fmic.pl/checkout/cart/updatePost/']){
  assert.equal(guardFmicRequest('GET',value,false),'abort');
 }
 assert.equal(guardFmicRequest('POST',url,false),'abort');
});

test('exact SKU match on verified public card, not a search result label',async()=>{
 const sku='USA-ARE-14107';
 const cards=[
  {url:'https://fmic.pl/139923-listwa-aeromotive-usa-are-14107.html',sku},
  {url:'https://fmic.pl/222-wrong-product.html',sku:'OTHER-123'},
 ];
 await fixture(sku,cards,async(page,calls)=>{
  const r=await searchFmicSkuOnPage(page,sku);
  assert.equal(r.status,'found');
  assert.equal(r.checked,2);
  assert.equal(r.product.sku,sku);
  assert.equal(r.product.priceGrossPLN,19.99);
  assert.equal(r.product.stock,'W magazynie');
  assert.ok(calls.every(c=>c.method==='GET'));
 });
});

test('not found when only similar SKUs, no guessing from product URL',async()=>{
 const sku='KSB546';
 await fixture(sku,[{url:'https://fmic.pl/123-ksb546.html',sku:'KSB546-ALT'}],async page=>{
  const r=await searchFmicSkuOnPage(page,sku);
  assert.equal(r.status,'not-found');
  assert.equal(r.product,null);
 });
});

test('ambiguous duplicate exact SKU never selects a product automatically',async()=>{
 const sku='JRSPEC-WT-40-B';
 const cards=[
  {url:'https://fmic.pl/123-a.html',sku},
  {url:'https://fmic.pl/124-b.html',sku},
 ];
 await fixture(sku,cards,async page=>{
  const r=await searchFmicSkuOnPage(page,sku);
  assert.equal(r.status,'ambiguous');
  assert.equal(r.product,null);
 });
});

test('50 search results fail closed without visiting product cards',async()=>{
 const sku='RPM-001',cards=Array.from({length:50},(_,i)=>({
  url:'https://fmic.pl/'+(1000+i)+'-product.html',sku,
 }));
 await fixture(sku,cards,async(page,calls)=>{
  const r=await searchFmicSkuOnPage(page,sku);
  assert.equal(r.status,'unknown');
  assert.equal(r.reason,'too_many_search_candidates');
  assert.equal(calls.length,1);
  assert.equal(MAX_FMIC_SEARCH_CANDIDATES,24);
  assert.equal(MAX_FMIC_SEARCH_CONCURRENCY,3);
 });
});

test('product redirects or unsafe host cannot be used as a verified match',async()=>{
 const sku='ABC-55',cards=[{url:'https://evil.example/123-abc-55.html',sku}];
 await fixture(sku,cards,async(page,calls)=>{
  const r=await searchFmicSkuOnPage(page,sku);
  assert.equal(r.status,'not-found');
  assert.equal(r.product,null);
  assert.ok(calls.every(c=>!c.url.startsWith('https://evil.example')));
 });
});
