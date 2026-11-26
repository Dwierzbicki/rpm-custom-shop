import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/listing-variants.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {listingVariantScope}=m.exports;
test('exclusive categories use root-local activation',()=>{
 assert.equal(listingVariantScope(['Hamulce i koła'],false),'Hamulce i koła');
 assert.equal(listingVariantScope(['Układ chłodzenia','Nyple proste'],false),'Układ chłodzenia');
});
test('global counts, root and dual-membership categories keep global grouping',()=>{
 assert.equal(listingVariantScope(['Hamulce i koła'],true),null);
 assert.equal(listingVariantScope([],false),null);
 for(const root of ['Układ dolotowy','Układ wydechowy'])assert.equal(listingVariantScope([root],false),null);
});
