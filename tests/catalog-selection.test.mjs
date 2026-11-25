import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
async function load(path,replacements=[]){
 let source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 for(const [from,to] of replacements)source=source.replace(from,to);
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 return 'data:text/javascript;base64,'+Buffer.from(js).toString('base64');
}
const filters=await load('app/lib/catalog-filters.ts');
const {productsInCategory,catalogValues,filterCatalogProducts}=await import(await load('app/lib/catalog-selection.ts',[["'./catalog-filters'",JSON.stringify(filters)]]));
const products=[{id:1,name:'Kolektor BMW',category:'Kolektory',sku:'BMW-1',brand:'RPM',engine:'M54',price:300},{id:2,name:'Kolektor Toyota',category:'Kolektory',sku:'TOY-2',brand:'RPM',engine:'2JZ',price:200},{id:3,name:'Turbo BMW',category:'Turbo',sku:'BMW-3',brand:'Pulsar',engine:'M54',price:100}];
test('category and subcategory selection use shared predicate',()=>{
 assert.deepEqual(productsInCategory(products,'Kolektory',{keywords:['bmw']}).map(p=>p.id),[1]);
 assert.deepEqual(productsInCategory(products,'Wszystkie',null).map(p=>p.id),[1,2,3]);
});
test('catalog search, engine and price sorting compose without mutating inputs',()=>{
 assert.deepEqual(filterCatalogProducts(products,' BMW ','M54',{},'priceAsc').map(p=>p.id),[3,1]);
 assert.deepEqual(products.map(p=>p.id),[1,2,3]);
});
test('catalog options are unique and keep all option first',()=>{
 assert.deepEqual(catalogValues(['Turbo','Kolektory','Turbo','']),['Wszystkie','Kolektory','Turbo']);
});
