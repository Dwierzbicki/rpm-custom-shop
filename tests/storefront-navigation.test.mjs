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
const tree=await load('app/fmic-categories.ts');
const routing=await load('app/category-routing.ts',[["'./fmic-categories'",JSON.stringify(tree)]]);
const {storefrontPath,storefrontLocation}=await import(await load('app/lib/storefront-navigation.ts',[["'../category-routing'",JSON.stringify(routing)]]));
test('storefront view paths preserve established URLs',()=>{
 assert.equal(storefrontPath('home'),'/');
 assert.equal(storefrontPath('cart'),'/koszyk');
 assert.equal(storefrontPath('guides'),'/power-guides');
 assert.equal(storefrontPath('product'),null);
});
test('catalog deep links preserve query and category',()=>{
 const state=storefrontLocation('/sklep/uklad-wydechowy/kolanka-i-rury-nierdzewne/kolanka-nierdzewne','?q=90+mm');
 assert.equal(state.view,'catalog');assert.equal(state.query,'90 mm');
 assert.deepEqual(state.category,['Układ wydechowy','Kolanka i rury nierdzewne','Kolanka nierdzewne']);
});
test('non-catalog routes clear search and unknown paths are not redirected',()=>{
 assert.deepEqual(storefrontLocation('/','?q=BMW'),{view:'home',query:'',category:null});
 assert.equal(storefrontLocation('/produkt/test/SKU','').view,null);
});
