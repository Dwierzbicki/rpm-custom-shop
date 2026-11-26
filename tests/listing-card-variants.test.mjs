import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/listing-card-variants.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {listingCardChoices,selectedListingProduct}=m.exports;
const green={sku:'004548/70-G',name:'Zielony',color:'Zielony',proposed_gross:'56.00',available:true,image:'https://example.com/green.jpg'};
const black={sku:'004548/70-B',name:'Czarny',color:'Czarny',proposed_gross:'75.00',available:false,image:'https://example.com/black.jpg'};
const product={...green,variant_family_id:'f',variant_count:2,variants:[green,black]};
test('switch exact SKU, name, photo, price and availability together',()=>{
 const p=selectedListingProduct(product,black.sku);
 for(const key of ['sku','name','image','proposed_gross','available'])assert.equal(p[key],black[key]);
 assert.equal(selectedListingProduct(product,'unmatched'),product);
});
test('keep filter matches and reject ambiguous or manual variants',()=>{
 assert.deepEqual(listingCardChoices({...product,variants:[green]}),[green]);
 assert.equal(listingCardChoices({...product,manual_id:1}).length,0);
 assert.equal(listingCardChoices({...product,variants:[green,green]}).length,0);
 assert.equal(listingCardChoices({...product,variants:[black]}).length,0);
});
