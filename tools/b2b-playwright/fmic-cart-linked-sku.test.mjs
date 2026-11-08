import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFmicCartItemProductUrl} from './fmic-cart-sku.mjs';
import {checkFmicCartPreflight} from './fmic-cart-preflight.mjs';
import {verifyFmicCartLineSkus,MAX_FMIC_PRODUCT_LOOKUPS,MAX_FMIC_CART_LINES} from './fmic-cart-linked-sku.mjs';

const CART='https://fmic.pl/checkout/cart/';
const fixture=rows=>`<!doctype html><html><body class="checkout-cart-index">
 <main><button id="empty_cart_button">Wyczyść koszyk</button>
 <section class="cart-summary">Suma</section>
 ${rows.map((row,i)=>`<div class="cart-product-line">
   ${row.cartSku?`<span class="sku">${row.cartSku}</span>`:''}
   ${row.link===false?'':`<a class="block" title="Produkt" href="${row.url}">
     <img alt="Produkt" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="/></a>`}
   <input id="cart-${i+1}-qty" name="cart[${i+1}][qty]" value="${row.qty}"/>
  </div>`).join('')}
 </main></body></html>`;

async function withMockFmic(rows,skuMap,fn){
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext();
  const requests=[];
  await context.route('**/*',route=>{
   const r=route.request(),url=r.url();
   requests.push({method:r.method(),url});
   if(url===CART){
    return route.fulfill({status:200,contentType:'text/html',body:fixture(rows)});
   }
   if(skuMap.has(url)){
    const sku=skuMap.get(url);
    return route.fulfill({status:200,contentType:'text/html',
     body:`<div class="product-info-main">
      ${sku?`<div class="flex sku">SKU: ${sku}</div>`:'<p>Brak SKU</p>'}
      </div>`});
   }
   return route.abort();
  });
  const page=await context.newPage();
  await fn(page,requests);
  await context.close();
 }finally{await browser.close()}
}

test('real FMIC cart hyperlink leads to SKU marker on product card, no writes',async()=>{
 const url='https://fmic.pl/139923-listwa-paliwowa-aeromotive-universal-listwa-do-obrobki-17-3-4-length-5-8-id-usa-are-14107.html';
 const rows=[{url,qty:1}];
 await withMockFmic(rows,new Map([[url,'USA-ARE-14107']]),async(page,requests)=>{
  const result=await checkFmicCartPreflight(page);
  assert.deepEqual(result,{status:'nonempty',itemCount:1,items:[
   {sku:'USA-ARE-14107',qty:1}],reason:'items_detected'});
  assert.equal(page.url(),CART);
  assert.ok(requests.some(r=>r.url===url));
  assert.ok(requests.every(r=>r.method==='GET'));
 });
});

test('handles 12 different cart products in stable order (one lookup each)',async()=>{
 const rows=Array.from({length:12},(_,i)=>({
  url:`https://fmic.pl/${1000+i}-produkt-${i+1}.html`,qty:i+1
 }));
 const cards=new Map(rows.map((row,i)=>[row.url,`FMIC-${1000+i}`]));
 await withMockFmic(rows,cards,async(page,requests)=>{
  const result=await checkFmicCartPreflight(page);
  assert.equal(result.itemCount,12);
  assert.deepEqual(result.items,rows.map((row,i)=>({sku:`FMIC-${1000+i}`,qty:i+1})));
  assert.equal(requests.filter(r=>r.url!==CART).length,12);
  assert.ok(requests.every(r=>r.method==='GET'));
 });
});

test('multiple different line items sharing the same URL are individually preserved',async()=>{
 const url='https://fmic.pl/1234-shared-product.html';
 await withMockFmic([{url,qty:1},{url,qty:4}],
  new Map([[url,'SKU-1234']]),async(page,requests)=>{
   const result=await checkFmicCartPreflight(page);
   assert.deepEqual(result.items,[{sku:'SKU-1234',qty:1},{sku:'SKU-1234',qty:4}]);
   assert.equal(requests.filter(r=>r.url===url).length,1);
  });
});

test('missing product SKU cannot be guessed from url / name / numeric cart id',async()=>{
 const url='https://fmic.pl/139923-fake-usa-are-14107.html';
 await withMockFmic([{url,qty:2}],new Map([[url,null]]),async(page)=>{
  const result=await checkFmicCartPreflight(page);
  assert.deepEqual(result.items,[{sku:null,qty:2}]);
 });
});

test('two products do not leak SKU when a linked card has no SKU',async()=>{
 const a='https://fmic.pl/111-first.html';
 const b='https://fmic.pl/222-second.html';
 await withMockFmic([{url:a,qty:2},{url:b,qty:3}],
  new Map([[a,'SKU-FIRST'],[b,null]]),async(page)=>{
   const result=await checkFmicCartPreflight(page);
   assert.deepEqual(result.items,[{sku:'SKU-FIRST',qty:2},{sku:null,qty:3}]);
  });
});

test('different visible cart SKU and product-card SKU conflict => null only on that line',async()=>{
 const a='https://fmic.pl/111-first.html',b='https://fmic.pl/222-second.html';
 await withMockFmic([{url:a,qty:1,cartSku:'OLD-SKU'},{url:b,qty:2}],
  new Map([[a,'NEW-SKU'],[b,'SKU-TWO']]),async(page)=>{
   const result=await checkFmicCartPreflight(page);
   assert.deepEqual(result.items,[{sku:null,qty:1},{sku:'SKU-TWO',qty:2}]);
  });
});

test('untrusted URL is never visited, even when the other line is valid',async()=>{
 const evil='https://evil.example/999-product.html';
 const good='https://fmic.pl/111-product.html';
 await withMockFmic([{url:evil,qty:3},{url:good,qty:1}],
  new Map([[good,'SKU-111']]),async(page,requests)=>{
   const result=await checkFmicCartPreflight(page);
   assert.deepEqual(result.items,[{sku:null,qty:3},{sku:'SKU-111',qty:1}]);
   assert.ok(!requests.some(r=>r.url.startsWith('https://evil.example/')));
  });
});

test('more than one unique product-card link inside same cart item is ambiguous',async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.setContent(`<main><div class="cart-row">
   <a href="https://fmic.pl/11-first.html">First</a>
   <a href="https://fmic.pl/22-other.html">Other</a>
   <input id="cart-1-qty" name="cart[1][qty]" value="1"/>
  </div></main>`);
  assert.equal(await readFmicCartItemProductUrl(page.locator('input')),null);
 }finally{await browser.close()}
});

test('bad link and absent product card keep read-only nonempty status',async()=>{
 const url='https://fmic.pl/555-no-card.html';
 await withMockFmic([{url,qty:1}],new Map(),async(page)=>{
  const result=await checkFmicCartPreflight(page);
  assert.deepEqual(result.items,[{sku:null,qty:1}]);
  assert.equal(result.status,'nonempty');
 });
});

test('max 50 cart lines, 3 concurrent product reads, preserved order',async()=>{
 assert.equal(MAX_FMIC_CART_LINES,50);
 assert.equal(MAX_FMIC_PRODUCT_LOOKUPS,3);
 const urls=Array.from({length:50},(_,i)=>`https://fmic.pl/${10000+i}-sample.html`);
 const items=urls.map((_,i)=>({sku:null,qty:i%10+1}));
 let active=0,peak=0,created=0;
 const cartPage={context:()=>({newPage:async()=>{
  created++;active++;peak=Math.max(peak,active);
  let url='';
  return {
   goto:async(target)=>{url=target;await new Promise(resolve=>setTimeout(resolve,1));return {status:()=>200}},
   url:()=>url,
   locator:selector=>({
    count:async()=>selector==='.sku'?1:0,
    nth:()=>({
     isVisible:async()=>true,
     innerText:async()=>`SKU-${new URL(url).pathname.split('-')[0].slice(1)}`,
    }),
   }),
   close:async()=>{active--},
  };
 }})};
 const result=await verifyFmicCartLineSkus(cartPage,items,urls);
 assert.equal(result.length,50);
 assert.equal(created,50);
 assert.ok(peak<=3,`peak opened tabs: ${peak}`);
 assert.ok(peak>=2);
 assert.deepEqual(result.map(x=>x.qty),items.map(x=>x.qty));
 assert.equal(result[0].sku,'SKU-10000');
 assert.equal(result[49].sku,'SKU-10049');
 await assert.rejects(verifyFmicCartLineSkus(cartPage,[...items,{sku:null,qty:1}],
  [...urls,urls[0]]),/Niepoprawna liczba/);
});
