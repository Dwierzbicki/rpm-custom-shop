import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import ts from 'typescript';

if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
const values=new Map();
globalThis.sessionStorage={
 getItem:key=>values.get(key)??null,
 setItem:(key,value)=>values.set(key,String(value)),
 removeItem:key=>values.delete(key),
};
const source=await readFile(new URL('../app/lib/checkout-idempotency.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}
}).outputText;
const {checkoutRequestKey,clearCheckoutRequestKey}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

test('retrying the same checkout form reuses its key',async()=>{
 clearCheckoutRequestKey();
 const payload=JSON.stringify({customer:{email:'private@example.com'},lines:[{productId:1,qty:1}]});
 const first=await checkoutRequestKey(payload);
 assert.equal(first,await checkoutRequestKey(payload));
 assert.match(first,/^[0-9a-f-]{36}$/);
 const storage=[...values.values()][0];
 assert.ok(storage);
 assert.equal(storage.includes('private@example.com'),false);
 assert.equal(storage.includes('productId'),false);
});

test('editing checkout details generates a new key',async()=>{
 const first=await checkoutRequestKey(JSON.stringify({qty:1}));
 const changed=await checkoutRequestKey(JSON.stringify({qty:2}));
 assert.notEqual(first,changed);
});

test('successful checkout clears the previous submission',async()=>{
 const payload='unchanged';
 const first=await checkoutRequestKey(payload);
 clearCheckoutRequestKey();
 const second=await checkoutRequestKey(payload);
 assert.notEqual(first,second);
});
