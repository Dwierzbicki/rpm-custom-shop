import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/listing-history.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {listingScope,readListingSnapshot,withListingSnapshot,listingReturnPath}=m.exports;
const scope=listingScope('/sklep','Nypel');
const state={scope,page:10,search:'Nypel',stock:'available',order:'priceAsc',layout:'list',selected:{producer:'HEL'},price:{min:'10',max:'200'},choices:{family:'SKU/N'},treeOpen:false,scrollY:1234};
test('page, filters, variant and scroll are restored only for the original history entry',()=>{
 const h=withListingSnapshot({__NA:true,other:'keep'},state);
 assert.equal(h.__NA,true);assert.equal(h.other,'keep');
 assert.deepEqual(readListingSnapshot(h,scope),state);
 assert.equal(readListingSnapshot(h,listingScope('/sklep','BMW')),null);
 assert.equal(readListingSnapshot(h,listingScope('/sklep/hamulce','Nypel')),null);
 assert.equal(readListingSnapshot({},scope),null);
});
test('malformed state is bounded and normalized',()=>{
 const h=withListingSnapshot(null,{...state,page:99999,stock:'invalid',scrollY:-20,selected:{page:'99',producer:'HEL'},choices:Object.fromEntries(Array.from({length:300},(_,i)=>['family'+i,'sku'+i]))});
 const s=readListingSnapshot(h,scope);assert.equal(s.page,10000);assert.equal(s.stock,'all');assert.equal(s.scrollY,0);assert.equal(Object.keys(s.choices).length,200);assert.deepEqual(s.selected,{producer:'HEL'});
});
test('return to same-origin shop only',()=>{
 const origin='https://rpmcustom.pl';
 assert.equal(listingReturnPath(origin+'/sklep?q=E46',origin),'/sklep?q=E46');
 for(const path of ['https://example.com/sklep','https://rpmcustom.pl/sklep-fake','https://rpmcustom.pl/admin',''])assert.equal(listingReturnPath(path,origin),null);
});
