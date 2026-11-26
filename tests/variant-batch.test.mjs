import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/variant-batch.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {parseVariantReviewItems,maxVariantBatch}=m.exports;
const row=i=>({id:i.toString(16).padStart(32,'0'),fingerprint:'a'.repeat(32)});
test('only explicit distinct snapshots, one through one hundred',()=>{
 for(const count of [1,20,50,100])assert.deepEqual(parseVariantReviewItems(Array.from({length:count},(_,i)=>row(i))),Array.from({length:count},(_,i)=>row(i)));
 for(const bad of [null,{},[],[row(1),row(1)],Array.from({length:maxVariantBatch+1},(_,i)=>row(i)),[{id:'bad',fingerprint:'a'.repeat(32)}],[{id:row(1).id,fingerprint:null}]])assert.equal(parseVariantReviewItems(bad),null);
});
test('discard untrusted extra fields',()=>{
 assert.deepEqual(parseVariantReviewItems([{...row(1),members:['injected'],decision:'approved'}]),[row(1)]);
});

test('category is a bounded JSON path, not raw SQL',()=>{
 const {parseVariantCategory,variantPageSizes}=m.exports;
 assert.deepEqual(parseVariantCategory(null),[]);assert.deepEqual(parseVariantCategory('["Układ chłodzenia","Nyple"]'),['Układ chłodzenia','Nyple']);
 for(const bad of ['invalid','{}','[null]','[""]',JSON.stringify(Array(9).fill('x'))])assert.equal(parseVariantCategory(bad),null);
 assert.deepEqual(variantPageSizes,[20,50,100]);
});
