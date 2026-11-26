import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/variant-batch.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {parseVariantReviewItems,maxVariantBatch}=m.exports;
const row=i=>({id:i.toString(16).padStart(32,'0'),fingerprint:'a'.repeat(32)});
test('only explicit distinct snapshots, one through twenty',()=>{
 for(const count of [1,20])assert.deepEqual(parseVariantReviewItems(Array.from({length:count},(_,i)=>row(i))),Array.from({length:count},(_,i)=>row(i)));
 for(const bad of [null,{},[],[row(1),row(1)],Array.from({length:maxVariantBatch+1},(_,i)=>row(i)),[{id:'bad',fingerprint:'a'.repeat(32)}],[{id:row(1).id,fingerprint:null}]])assert.equal(parseVariantReviewItems(bad),null);
});
test('discard untrusted extra fields',()=>{
 assert.deepEqual(parseVariantReviewItems([{...row(1),members:['injected'],decision:'approved'}]),[row(1)]);
});
