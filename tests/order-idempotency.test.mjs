import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const source=await readFile(new URL('../app/lib/order-idempotency.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}
}).outputText;
const {isValidIdempotencyKey,orderRequestHash}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

test('accepts only canonical UUID v4 keys',()=>{
 assert.equal(isValidIdempotencyKey('d7cc09d8-5d29-4ad1-b736-d9990ba01029'),true);
 assert.equal(isValidIdempotencyKey('d7cc09d8-5d29-1ad1-b736-d9990ba01029'),false);
 assert.equal(isValidIdempotencyKey('some-random-key'),false);
 assert.equal(isValidIdempotencyKey(null),false);
});
test('identical attempts produce the same fingerprint',()=>{
 const payload={customer:{name:'Tester',email:'test@example.com'},lines:[{productId:1,qty:2}]};
 assert.equal(orderRequestHash(payload),orderRequestHash({...payload}));
 assert.equal(orderRequestHash(payload).length,64);
});
test('changing cart or customer changes fingerprint',()=>{
 const payload={customer:{name:'Tester'},lines:[{productId:1,qty:2}]};
 assert.notEqual(orderRequestHash(payload),orderRequestHash({...payload,lines:[{productId:1,qty:3}]}));
 assert.notEqual(orderRequestHash(payload),orderRequestHash({...payload,customer:{name:'Another'}}));
});
