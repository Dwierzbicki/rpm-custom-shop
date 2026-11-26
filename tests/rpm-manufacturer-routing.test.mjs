import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(path,dependencies={}){
 const mod={exports:{}};
 const source=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
 new Function('exports','module','require',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(mod.exports,mod,p=>{if(!(p in dependencies))throw Error('Unexpected dependency '+p);return dependencies[p]});
 return mod.exports;
}
const tree=load('app/fmic-categories.ts');
const routing=load('app/category-routing.ts',{'./fmic-categories':tree});
const parent=['Układ wydechowy','Kolektory wydechowe'],stainless=[...parent,'Kolektory wydechowe nierdzewne'],cast=[...parent,'Kolektory wydechowe żeliwne'];
const fixture={category:'Kolektory',brand:'RPM Custom',targetCategory:parent,attributes:{Materiał:'Stal kwasoodporna AISI 316'}};
test('operator-confirmed stainless RPM material resolves to existing leaf and parent',()=>{
 assert.equal(routing.validCategoryPath(stainless),true);
 assert.deepEqual(routing.manualCategoryPath(fixture),stainless);
 assert.deepEqual(routing.resolveCategoryPath(routing.categoryPath(stainless)),stainless);
 assert.equal(routing.legacyManualCategory(stainless),'Kolektory');
});
test('unknown materials and explicit leaves remain unchanged',()=>{
 assert.deepEqual(routing.manualCategoryPath({...fixture,attributes:{}}),parent);
 assert.deepEqual(routing.manualCategoryPath({...fixture,brand:'Other'}),parent);
 assert.deepEqual(routing.manualCategoryPath({...fixture,targetCategory:cast}),cast);
 assert.equal(routing.legacyManualCategory([...parent,'Elementy kolektora wydechowego']),'Elementy kolektora wydechowego');
});
