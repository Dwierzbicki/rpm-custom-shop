import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(name){
 const source=fs.readFileSync(new URL('../app/lib/'+name+'.ts',import.meta.url),'utf8');
 const mod={exports:{}};
 new Function('exports','module',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports,mod);
 return mod.exports;
}
const {manifoldPreset,withManifoldOptions}=load('manifold-options');
const {configuredCartLine}=load('product-configuration');
const base={id:99,sku:'TEST-99',name:'Kolektor turbo BMW M50/M52/M54',engine:'BMW M50/M52/M54',category:'Kolektory',brand:'RPM Custom',price:2500,description:'Fixture'};
const config=chosenOptions=>({chosenOptions,engine:'',flange:'',wg:'',egt:false,qty:1});
test('BMW adds four required chassis options without applying to non-manifolds',()=>{
 const product=withManifoldOptions(base);
 const group=product.optionGroups.find(g=>g.id==='rpm-chassis');
 assert.equal(group.required,true);
 assert.deepEqual(group.options.map(o=>o.label),['BMW E36','BMW E46','BMW E8x','BMW E9x']);
 assert.equal(withManifoldOptions({...base,category:'Korbowody'}).optionGroups,undefined);
});
test('chassis required, unknown option rejected, separate line identities and surcharge preserved',()=>{
 const product={...base,configurable:true,optionGroups:manifoldPreset('bmw')};
 const choice={'rpm-engine':'m54','rpm-flange':'t4-twin','rpm-wg-diameter':'wg-44','rpm-egt':'yes'};
 assert.equal(configuredCartLine(product,config(choice)),null);
 assert.equal(configuredCartLine(product,config({...choice,'rpm-chassis':'invalid'})),null);
 product.optionGroups.find(g=>g.id==='rpm-chassis').options.find(o=>o.id==='e46').price=100;
 const a=configuredCartLine(product,config({...choice,'rpm-chassis':'e36'}));
 const b=configuredCartLine(product,config({...choice,'rpm-chassis':'e46'}));
 assert.equal(a.options.Nadwozie,'BMW E36');
 assert.equal(b.options.Nadwozie,'BMW E46');
 assert.equal(b.options.Wastegate,'2× WG');
 assert.equal(b.unitPrice,2600);
 assert.notEqual(a.key,b.key);
});
test('2JZ preset includes V-Band and EGT, no BMW group, preserves prior prices',()=>{
 const original=manifoldPreset('2jz-ge');
 original.find(g=>g.id==='rpm-flange').options[0].price=125;
 const groups=manifoldPreset('2jz-ge',original);
 assert.ok(!groups.some(g=>g.id==='rpm-chassis'||g.id==='rpm-engine'));
 assert.equal(groups.find(g=>g.id==='rpm-flange').options[0].price,125);
 const product={...base,name:'2JZ GE',engine:'2JZ GE',configurable:true,optionGroups:groups};
 const line=configuredCartLine(product,config({'rpm-flange':'vband-single','rpm-wg-diameter':'wg-38','rpm-egt':'no'}));
 assert.equal(line.options.Wastegate,'1× WG');
});

test('switching BMW template to 2JZ removes BMW-specific options',()=>{
 const switched=manifoldPreset('2jz-ge',manifoldPreset('bmw'));
 assert.ok(!switched.some(g=>g.id==='rpm-chassis'||g.id==='rpm-engine'));
});

test('both single and dual outlets require catalog-derived WG diameter and retain distinct configurations',()=>{
 const product=withManifoldOptions({...base,optionGroups:manifoldPreset('bmw')});
 const group=product.optionGroups.find(g=>g.id==='rpm-wg-diameter');
 assert.deepEqual(group.options.map(o=>o.label),['35 mm','38 mm','40 mm','44 mm','45 mm','50 mm','54 mm','60 mm']);
 const choices={'rpm-engine':'m54','rpm-chassis':'e46','rpm-egt':'no'};
 for(const [flange,count] of [['t3-single','1× WG'],['t3-twin','2× WG'],['t4-single','2× WG'],['t4-twin','2× WG'],['vband-single','1× WG']]){
  const state={...choices,'rpm-flange':flange};
  assert.equal(configuredCartLine(product,config(state)),null);
  assert.equal(configuredCartLine(product,config({...state,'rpm-wg-diameter':'wg-99'})),null);
  const a=configuredCartLine(product,config({...state,'rpm-wg-diameter':'wg-38'}));
  const b=configuredCartLine(product,config({...state,'rpm-wg-diameter':'wg-44'}));
  assert.equal(a.options.Wastegate,count);assert.equal(a.options['Średnica WG'],'38 mm');assert.notEqual(a.key,b.key);
 }
});
test('existing manifold pricing and WG diameter overrides remain unchanged',()=>{
 const original=manifoldPreset('bmw').filter(g=>g.id!=='rpm-wg-diameter');
 original.find(g=>g.id==='rpm-flange').options.find(o=>o.id==='t4-single').price=500;
 const item=withManifoldOptions({...base,optionGroups:original});
 assert.equal(item.optionGroups.find(g=>g.id==='rpm-flange').options.find(o=>o.id==='t4-single').price,500);
 item.optionGroups.find(g=>g.id==='rpm-wg-diameter').options.find(o=>o.id==='wg-44').price=75;
 assert.equal(withManifoldOptions(item).optionGroups.find(g=>g.id==='rpm-wg-diameter').options.find(o=>o.id==='wg-44').price,75);
});
