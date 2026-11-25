import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../app/lib/product-configuration.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {describeConfiguration,configuredCartLine}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const initial={chosenOptions:{},engine:'',flange:'',wg:'',egt:false,qty:2};
test('legacy configurable manifold requires engine, flange and wastegate',()=>{
 const product={id:1,price:100,configurable:true};
 assert.equal(configuredCartLine(product,initial),null);
 const line=configuredCartLine(product,{...initial,engine:'M54',flange:'T3',wg:'1× WG',egt:true});
 assert.equal(line.qty,2);assert.equal(line.unitPrice,100);assert.equal(line.options.EGT,'Tak');
});
test('custom flange controls wastegate count and price',()=>{
 const product={id:2,price:100,optionGroups:[{id:'rpm-flange',name:'Flansza',required:true,options:[{id:'t4-twin',label:'T4 twin',price:25}]},{id:'rpm-wastegate',name:'Wastegate',required:true,options:[]}]};
 assert.equal(configuredCartLine(product,initial),null);
 const state={...initial,chosenOptions:{'rpm-flange':'t4-twin'}};
 assert.equal(describeConfiguration(product,state).totalPrice,250);
 assert.equal(configuredCartLine(product,state).options.Wastegate,'2× WG');
});
test('ordinary product needs no options',()=>{
 const line=configuredCartLine({id:3,price:12.5},initial);
 assert.equal(line.unitPrice,12.5);assert.equal(line.options,undefined);
});
