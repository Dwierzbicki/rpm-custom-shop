import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../app/lib/checkout-payload.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {checkoutPayload}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const opts={cart:[{key:'1',productId:1,qty:2,unitPrice:500,options:{Flansza:'T3'}}],lang:'pl',phonePrefix:'+48',shippingMethod:'courier',paymentMethod:'pay_on_pickup'};
test('checkout payload preserves existing wire format and excludes client prices',()=>{
 const f=new FormData();f.set('phone',' 123456789 ');f.set('name','Test');
 const p=JSON.parse(checkoutPayload(f,opts));
 assert.equal(p.customer.type,'private');assert.equal(p.customer.phone,'+48 123456789');
 assert.deepEqual(p.lines,[{productId:1,qty:2,options:{Flansza:'T3'}}]);
 assert.equal(p.language,'pl');assert.equal(p.shippingMethod,'courier');assert.equal(p.paymentMethod,'pay_on_pickup');
});
test('identical checkout inputs produce stable payload for idempotency',()=>{
 const f=new FormData();f.set('type','company');f.set('nip','1234567890');
 assert.equal(checkoutPayload(f,opts),checkoutPayload(f,opts));
 assert.notEqual(checkoutPayload(f,opts),checkoutPayload(f,{...opts,cart:[{...opts.cart[0],qty:3}]}));
});
