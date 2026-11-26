import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/pdp-purchase.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {purchaseSummary,showMobilePurchaseBar}=m.exports;
test('Pulsar and configured manifold show unit extras and quantity total',()=>{
 assert.deepEqual(purchaseSummary(3270,3270,1),{base:3270,extra:0,total:3270});
 assert.deepEqual(purchaseSummary(3000,3850,2),{base:3000,extra:850,total:7700});
 assert.deepEqual(purchaseSummary(10.10,10.30,3),{base:10.10,extra:.2,total:30.9});
});
test('secondary purchase bar only after primary controls pass viewport top',()=>{
 assert.equal(showMobilePurchaseBar(700,110),false);
 assert.equal(showMobilePurchaseBar(111,110),false);
 assert.equal(showMobilePurchaseBar(110,110),true);
 assert.equal(showMobilePurchaseBar(-40,110),true);
 assert.equal(showMobilePurchaseBar(NaN,110),false);
});
