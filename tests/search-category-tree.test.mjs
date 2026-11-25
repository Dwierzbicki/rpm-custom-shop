import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/lib/search-category-tree.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {buildSearchTree,searchCategoryHref}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('parent totals sum each exact category once, including direct parent products',()=>{
 const tree=buildSearchTree([{path:['Silnik','Turbo'],count:8},{path:['Silnik','Dolot'],count:3},{path:['Silnik'],count:2},{path:['Zawieszenie'],count:4}]);
 assert.equal(tree[0].name,'Silnik');assert.equal(tree[0].count,13);assert.deepEqual(tree[0].children.map(n=>[n.name,n.count]),[['Turbo',8],['Dolot',3]]);assert.equal(tree.reduce((sum,n)=>sum+n.count,0),17);
});
test('empty and zero categories excluded; same child name in separate branches stays separate',()=>{
 const tree=buildSearchTree([{path:[],count:3},{path:['A'],count:0},{path:['B','X'],count:2},{path:['C','X'],count:1}]);
 assert.deepEqual(tree.map(n=>[n.name,n.children[0].path]),[['B',['B','X']],['C',['C','X']]]);
});
test('category links retain search term without preview mode',()=>{
 const u=new URL(searchCategoryHref('/sklep/elektronika',' E46 + M54 '),'https://rpmcustom.pl');assert.equal(u.pathname,'/sklep/elektronika');assert.equal(u.searchParams.get('q'),'E46 + M54');assert.equal(u.searchParams.has('fmicPreview'),false);
});
