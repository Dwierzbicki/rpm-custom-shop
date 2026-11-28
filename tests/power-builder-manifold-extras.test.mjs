import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function load(file,deps={}){
 const src=readFileSync(new URL('../app/lib/'+file+'.ts',import.meta.url),'utf8');
 const exports={};
 vm.runInNewContext(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require(name){assert.ok(Object.hasOwn(deps,name),name);return deps[name]}});
 return exports;
}
const productConfig=load('product-configuration');
const {manifoldConfiguration}=load('motolab-manifold-config',{'./product-configuration':productConfig});
const group=(id,options)=>({id,name:id,required:true,options:options.map(([id,price])=>({id,label:id,price}))});
const product={id:32,sku:'RPM-00032',name:'Fixture',price:3000,configurable:true,optionGroups:[
 group('rpm-engine',[['m52',0]]),group('rpm-flange',[['t3-single',0]]),group('rpm-wg-diameter',[['wg-45',0]]),
 group('rpm-chassis',[['e46',0]]),group('rpm-egt',[['none',0],['yes',350],['seven',2450]]),group('rpm-thermal-insulation',[['none',0],['termshield',1600]])
]};
const spec={sku:product.sku,options:{'rpm-engine':'m52','rpm-flange':'t3-single','rpm-wg-diameter':'wg-45'}};
test('manifold extras start blank and do not increase the estimate',()=>{
 const initial=manifoldConfiguration(product,spec,{'rpm-chassis':'e46'});
 assert.equal(initial.chosenOptions['rpm-egt'],undefined);
 assert.equal(initial.chosenOptions['rpm-thermal-insulation'],undefined);
 assert.equal(initial.unitPrice,3000);
 assert.equal(initial.line,null);
 const free=manifoldConfiguration(product,spec,{'rpm-chassis':'e46','rpm-egt':'none','rpm-thermal-insulation':'none'});
 assert.equal(free.line.unitPrice,3000);
 const extra=manifoldConfiguration(product,spec,{'rpm-chassis':'e46','rpm-egt':'yes','rpm-thermal-insulation':'termshield'});
 assert.equal(extra.line.unitPrice,4950);
});
