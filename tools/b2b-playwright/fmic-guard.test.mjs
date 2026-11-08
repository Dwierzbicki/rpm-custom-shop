import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFmicProductUrl,guardFmicRequest,exampleFmicProductUrl} from './fmic-guard.mjs';

test('example product URL is bound to real FMIC domain',()=>{
 assert.equal(validateFmicProductUrl(exampleFmicProductUrl),exampleFmicProductUrl);
});
test('rejects checkout URLs, redirect hosts, credentials and untrusted protocols',()=>{
 for(const url of [
  'https://fake-fmic.pl/product.html',
  'http://fmic.pl/123.html',
  'https://fmic.pl.evil.org/123.html',
  'https://user:pass@fmic.pl/123.html',
  'https://fmic.pl/checkout/cart/',
  'https://fmic.pl/123.html?redirect=https://evil.org',
  'file:///etc/passwd',
 ]){
  assert.throws(()=>validateFmicProductUrl(url),url);
 }
});
test('network blocks ALL order, payment and checkout mutations even with cart consent',()=>{
 const urls=[
  '/checkout/onepage/saveOrder',
  '/checkout/index/',
  '/payment/process',
  '/rest/default/V1/carts/123/payment-information',
  '/graphql',
  '/checkout/cart/updatePost/',
  '/order/place',
 ];
 for(const path of urls){
  for(const method of ['GET','POST','PUT','DELETE']){
   assert.equal(guardFmicRequest(method,'https://fmic.pl'+path,true),'abort',method+' '+path);
  }
 }
});
test('only explicit cart add route may POST (and never in read-only mode)',()=>{
 const add='https://fmic.pl/checkout/cart/add/uenc/abcd/product/999/';
 assert.equal(guardFmicRequest('POST',add,false),'abort');
 assert.equal(guardFmicRequest('POST',add,true),'continue');
 assert.equal(guardFmicRequest('PUT',add,true),'abort');
 assert.equal(guardFmicRequest('POST','https://fmic.pl/checkout/cart/',true),'abort');
 assert.equal(guardFmicRequest('GET','https://fmic.pl/checkout/cart/',false),'continue');
 assert.equal(guardFmicRequest('GET',exampleFmicProductUrl,false),'continue');
});
test('rejects third-party collection endpoints and external host redirects',()=>{
 for(const endpoint of [
  'https://api.fmic.pl/checkout/cart/add/',
  'https://evil.org/checkout/cart/add/',
  'https://fmic.pl.evil.org/product.html',
  'https://accounts.google.com/signin',
  'http://fmic.pl/checkout/cart/add/',
 ]){
  assert.equal(guardFmicRequest('POST',endpoint,true),'abort',endpoint);
 }
});

test('read-only guard refuses unsafe GET actions with possible state mutation',()=>{
 for(const path of [
  '/wishlist/index/add/product/1',
  '/customer/account/logout',
  '/checkout/cart/delete/id/123',
  '/checkout/cart/updatePost',
  '/review/product/post',
  '/rest/V1/carts/mine',
  '/customer/account/edit',
 ]){
  assert.equal(guardFmicRequest('GET','https://fmic.pl'+path,false),'abort',path);
  assert.equal(guardFmicRequest('GET','https://fmic.pl'+path,true),'abort',path);
 }
 assert.equal(guardFmicRequest('GET','https://fmic.pl/static/version123/frontend/fmic/style.css'),'continue');
 assert.equal(guardFmicRequest('GET','https://fmic.pl/media/catalog/product/test.jpg'),'continue');
});

test('read-only FMIC homepage SKU search is narrowly scoped',()=>{
 const good='https://fmic.pl/?q=JRSPEC-WT-40-B';
 assert.equal(guardFmicRequest('GET',good,false),'continue');
 assert.equal(guardFmicRequest('GET','https://fmic.pl/',false),'continue');
 for(const url of [
  'https://fmic.pl/?q=SKU%20WITH%20SPACE',
  'https://fmic.pl/?q=SKU&view=admin',
  'https://fmic.pl/?q=SKU&q=OTHER',
  'https://evil.example/?q=SKU',
  'https://fmic.pl/?q=SKU%26checkout',
  'https://fmic.pl/?unknown=foo',
  'https://fmic.pl/catalogsearch/result/?q=SKU',
 ]){
  assert.equal(guardFmicRequest('GET',url,false),'abort',url);
 }
 assert.equal(guardFmicRequest('POST',good,false),'abort');
 assert.equal(guardFmicRequest('POST',good,true),'abort');
});
