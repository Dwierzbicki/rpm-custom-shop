import test from 'node:test';
import assert from 'node:assert/strict';
import {cartClearFingerprint,isApprovedFmicClearPost} from './fmic-cart-clear.mjs';
import {guardFmicRequest} from './fmic-guard.mjs';

const report=()=>({
 status:'nonempty',itemCount:3,reason:'items_detected',
 items:[
  {sku:'USA-ARE-14107',qty:1},
  {sku:'KSB546',qty:1},
  {sku:'JRSPEC-WT-40-B',qty:5},
 ],
});
const endpoint='https://fmic.pl/checkout/cart/updatePost/';
const validBody='form_key=ABCDEFGHIJKLMNOPQRSTUVWXYZ12&update_cart_action=empty_cart&'+
 'cart%5B123%5D%5Bqty%5D=1';

test('cart review fingerprint covers all real cart lines and quantities',()=>{
 const snapshot=report(),fingerprint=cartClearFingerprint(snapshot);
 assert.match(fingerprint,/^[a-f0-9]{64}$/);
 assert.equal(fingerprint,cartClearFingerprint({...snapshot,items:[...snapshot.items]}));
 assert.notEqual(fingerprint,cartClearFingerprint({...snapshot,
  items:snapshot.items.map((x,i)=>i===2?{...x,qty:6}:x)}));
 assert.notEqual(fingerprint,cartClearFingerprint({...snapshot,
  items:snapshot.items.slice().reverse()}));
 assert.ok(!fingerprint.includes('JRSPEC'));
});
test('unknown, empty, incomplete, oversized and invalid cart cannot be cleared',()=>{
 const snapshot=report();
 for(const value of [
  null,{status:'empty',itemCount:0,items:[]},
  {...snapshot,status:'unknown'},
  {...snapshot,itemCount:2},
  {...snapshot,items:[...snapshot.items.slice(0,2)]},
  {...snapshot,items:[...snapshot.items.slice(0,2),{sku:null,qty:5}]},
  {...snapshot,items:[...snapshot.items.slice(0,2),{sku:'BAD SKU',qty:5}]},
  {...snapshot,items:[...snapshot.items.slice(0,2),{sku:'SKU',qty:0}]},
  {...snapshot,itemCount:51,items:Array.from({length:51},()=>({sku:'RPM-1',qty:1}))},
 ])assert.throws(()=>cartClearFingerprint(value));
});
test('network guard refuses clear POST absent separate explicit one-shot approval',()=>{
 assert.equal(guardFmicRequest('POST',endpoint,false),'abort');
 assert.equal(guardFmicRequest('POST',endpoint,true),'abort');
 assert.equal(isApprovedFmicClearPost('POST',endpoint,validBody),true);
 for(const [method,url,body] of [
  ['GET',endpoint,validBody],
  ['POST','https://evil.org/checkout/cart/updatePost/',validBody],
  ['POST','https://fmic.pl.evil.org/checkout/cart/updatePost/',validBody],
  ['POST','http://fmic.pl/checkout/cart/updatePost/',validBody],
  ['POST',endpoint+'?unsafe=1',validBody],
  ['POST','https://fmic.pl/checkout/onepage/saveOrder',validBody],
  ['POST',endpoint,'form_key=ABCDEFGH&update_cart_action=update_qty'],
  ['POST',endpoint,'update_cart_action=empty_cart'],
  ['POST',endpoint,'form_key=ABCDEFGH&update_cart_action=empty_cart&payment=1'],
  ['POST',endpoint,validBody+'&update_cart_action=empty_cart'],
  ['POST',endpoint,'form_key=ABCDEFGH&update_cart_action=empty_cart&cart%5B1%5D%5Bqty%5D=101'],
  ['POST',endpoint,'form_key=ABCDEFGH&update_cart_action=empty_cart&form_key=ABCDEFGH'],
  ['POST',endpoint,'form_key=ABCDEFGH&update_cart_action=empty_cart&cart%5B1%5D%5Bremove%5D=1'],
  ['POST',endpoint,'form_key=ABCDEFGH&update_cart_action=empty_cart&checkout=1'],
 ])assert.equal(isApprovedFmicClearPost(method,url,body),false,method+' '+url+' '+body);
});
