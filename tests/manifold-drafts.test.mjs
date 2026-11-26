import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(name,dependencies={}){
 const source=fs.readFileSync(new URL('../app/lib/'+name+'.ts',import.meta.url),'utf8');
 const mod={exports:{}};
 new Function('exports','module','require',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports,mod,path=>{if(!(path in dependencies))throw Error('Unexpected dependency '+path);return dependencies[path]});
 return mod.exports;
}
const {manifoldDrafts}=load('manifold-drafts',{'./manifold-options':load('manifold-options')});
test('two distinct operator drafts with no price or public visibility',()=>{
 const drafts=manifoldDrafts();
 assert.deepEqual(drafts.map(x=>x.key),['bmw-m50-m52-m54','toyota-2jz-ge']);
 for(const {input:p} of drafts){
  assert.equal(p.visible,false);assert.equal(p.price,0);assert.equal(p.stockStatus,'order');assert.equal(p.configurable,true);
  assert.deepEqual(p.images,[]);assert.deepEqual(p.targetCategory,['Układ wydechowy','Kolektory wydechowe']);
  assert.ok(p.description.length>100);const insulation=p.optionGroups.find(g=>g.id==='rpm-thermal-insulation');
  assert.equal(insulation.required,false);
  assert.deepEqual(insulation.options.map(o=>[o.id,o.price]),[['none',0],['termshield',1600]]);
  assert.ok(p.optionGroups.filter(g=>g.id!=='rpm-thermal-insulation').every(g=>g.required&&g.options.every(o=>o.price===0)));
 }
});
test('BMW has four chassis, Toyota has none; both have six flanges and EGT',()=>{
 const [bmw,toyota]=manifoldDrafts().map(x=>x.input);
 assert.deepEqual(bmw.optionGroups.find(g=>g.id==='rpm-chassis').options.map(o=>o.label),['BMW E36','BMW E46','BMW E8x','BMW E9x']);
 assert.ok(!toyota.optionGroups.some(g=>g.id==='rpm-chassis'||g.id==='rpm-engine'));
 for(const p of [bmw,toyota]){assert.equal(p.optionGroups.find(g=>g.id==='rpm-flange').options.length,6);assert.equal(p.optionGroups.find(g=>g.id==='rpm-egt').options.length,2)}
});

test('both new draft configurations require a WG diameter',()=>{for(const {input} of manifoldDrafts()){const group=input.optionGroups.find(g=>g.id==='rpm-wg-diameter');assert.equal(group.required,true);assert.equal(group.options.length,9)}});
