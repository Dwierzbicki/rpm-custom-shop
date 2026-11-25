import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../app/lib/shop-collections.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {collectionTotal,changeLineQuantity,removeCollectionLine,appendCollectionLine}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const line={key:'1-a',productId:1,qty:2,unitPrice:25};
test('collection totals use configured unit price and catalog fallback',()=>{
 assert.equal(collectionTotal([line,{key:'2',productId:2,qty:3}],[{id:1,price:100},{id:2,price:10}]),80);
});
test('quantity adjustment preserves existing min and max',()=>{
 assert.equal(changeLineQuantity([line],line.key,-20)[0].qty,1);
 assert.equal(changeLineQuantity([line],line.key,100)[0].qty,50);
 assert.equal(line.qty,2);
});
test('adding an identical configuration merges quantity; distinct configuration stays separate',()=>{
 assert.equal(appendCollectionLine([line],{...line,qty:3})[0].qty,5);
 assert.equal(appendCollectionLine([line],{...line,key:'1-b'}).length,2);
 assert.equal(removeCollectionLine([line],line.key).length,0);
});
