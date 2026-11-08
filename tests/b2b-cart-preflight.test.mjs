import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const text=await readFile(new URL('../app/lib/b2b-cart-preflight.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(text,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText;
const {validateB2BPreflight,InvalidCartPreflight}=await import(
 'data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const common={
 orderId:'120',supplier:'fmic',jobId:'a'.repeat(64),fingerprint:'b'.repeat(64),
 runId:'11111111-1111-4111-8111-111111111111',
};
const empty=()=>({...common,status:'empty',itemCount:0,items:[],
 reason:'explicit_empty_message'});
const filled=()=>({...common,status:'nonempty',itemCount:1,
 items:[{sku:'F00VE35007-BOS',qty:2}],reason:'items_detected'});
test('accepts explicitly empty cart and strips all unsupported fields',()=>{
 const result=validateB2BPreflight(empty());
 assert.equal(result.status,'empty');
 assert.equal(result.items.length,0);
});
test('accepts existing items without customer information',()=>{
 const result=validateB2BPreflight(filled());
 assert.deepEqual(result.items,[{sku:'F00VE35007-BOS',qty:2}]);
 assert.equal(result.itemCount,1);
 assert.ok(!JSON.stringify(result).includes('password'));
});
test('requires exact consistent status, reason and item count',()=>{
 const invalid=[
  {...empty(),status:'nonempty'}, {...empty(),itemCount:1},
  {...empty(),items:[{sku:'123',qty:1}]},
  {...filled(),itemCount:0}, {...filled(),items:[]},
  {...filled(),reason:'explicit_empty_message'},
  {...empty(),reason:'unrecognized_cart_layout'},
  {...empty(),status:'unknown',reason:'cart_navigation_redirect',itemCount:2},
 ];
 for(const payload of invalid)assert.throws(()=>validateB2BPreflight(payload),InvalidCartPreflight);
});
test('rejects screenshots, freeform text, URLs, cookies and passwords',()=>{
 for(const extra of [
  {password:'do-not-store'},{cookies:[]},{html:'<div>unsafe</div>'},
  {screenshot:'C:/private.png'}, {url:'https://fmic.pl'},
  {customer:{name:'Someone'}},{message:'Please remove all products'},
  {jobId:'wrong'}, {runId:'invalid'}, {fingerprint:'mismatch'},
 ]){
  assert.throws(()=>validateB2BPreflight({...empty(),...extra}),InvalidCartPreflight);
 }
});
test('rejects invalid SKU, quantity or unknown fields nested inside a row',()=>{
 for(const row of [
  {sku:'Bad SKU!',qty:2},{sku:'SKU',qty:0},{sku:'SKU',qty:101},
  {sku:'SKU',qty:1,password:'oops'},
 ]){
  assert.throws(()=>validateB2BPreflight({...filled(),items:[row]}),InvalidCartPreflight);
 }
});
