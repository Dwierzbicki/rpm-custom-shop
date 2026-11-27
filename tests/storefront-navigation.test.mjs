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

test('Power Builder resets on leaving any storefront route and never restores legacy selections',()=>{const s=readFileSync(new URL('../app/components/storefront/hooks/usePowerGuides.ts',import.meta.url),'utf8');assert.ok(s.includes('if(!enabled)resetGuide()'));assert.ok(s.includes('if(event.persisted)resetGuide()'));assert.ok(s.includes("localStorage.removeItem('rpm-power-guide-form-v2')"));assert.ok(s.includes("startsWith('rpm-power-guide-selection-v2:')"));assert.ok(s.includes('selectionByConfiguration.current={}'));assert.ok(!s.includes('localStorage.getItem('));assert.ok(!s.includes('localStorage.setItem('));assert.ok(!s.includes("localStorage.clear("));const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');assert.ok(page.includes("enabled:view==='guides'"));});
