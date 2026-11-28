import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function load(name,deps={}){
 const exports={};const source=readFileSync(new URL('../app/engine-hardware/'+name+'.ts',import.meta.url),'utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,require(n){assert.ok(n in deps);return deps[n]}});
 return exports;
}
const catalog=load('catalog'),audit=load('audit',{'./catalog':catalog}),r=load('release',{'./catalog':catalog,'./audit':audit});
const l={pl:'TEST',en:'TEST'};
function fixture(){
 const profiles=audit.engineIds.map((engine,i)=>({id:'p'+i,engine,vehicle:'TEST '+i,market:'TEST',production:'TEST',fitmentEvidence:'TEST',coverage:audit.assemblies.map(([assemblyId],j)=>({assemblyId,status:j===0?'complete':'not-applicable',evidence:'TEST'}))}));
 const parts=['BMW','Toyota'].map(manufacturer=>({key:manufacturer+':TEST-01',oem:'TEST-01',manufacturer,name:l,dimension:'TEST',technicalEvidence:'TEST',unit:'set',sku:'TEST-'+manufacturer}));
 const diagrams=profiles.map((p,i)=>{const manufacturer=p.engine.startsWith('2JZ')?'Toyota':'BMW';return {id:'d'+i,sourceId:'src',profileId:p.id,engine:p.engine,vehicle:p.vehicle,title:l,source:'https://example.com/doc',assemblyIds:['block'],image:{path:'/engine-hardware/licensed/test.png',rightsEvidence:'TEST',sha256:'a'.repeat(64)},usages:[{position:'01',partKey:manufacturer+':TEST-01',oem:'TEST-01',quantity:1,quantityUnit:'set',location:l,mountingEvidence:'TEST',torque:'TEST',torqueSource:'TEST',replacement:'always',hotspots:[{x:0.5,y:0.5}]}]}});
 return {schema:1,revision:'fixture',reviewedBy:'TEST',reviewDate:'2026-11-28',scopeEvidence:'TEST',rightsEvidence:'TEST',profiles,parts,diagrams};
}
test('no release means production remains unavailable; complete structural fixture only',()=>{
 assert.equal(r.validateRelease(null).ok,false);
 assert.equal(r.validateRelease(fixture()).ok,true);
 const f=fixture();f.profiles.pop();assert.equal(r.validateRelease(f).ok,false);
 const empty=fixture();empty.profiles[0].coverage.forEach(a=>a.status='not-applicable');empty.diagrams.shift();assert.equal(r.validateRelease(empty).ok,false);
});
test('reject incomplete coverage, unlicensed asset and unknown or mixed unit',()=>{
 const f=fixture();f.profiles[0].coverage.pop();assert.equal(r.validateRelease(f).ok,false);
 const g=fixture();g.diagrams[0].image.rightsEvidence='';assert.equal(r.validateRelease(g).ok,false);
 const h=fixture();h.diagrams[0].usages[0].quantityUnit='piece';assert.equal(r.validateRelease(h).ok,false);
 const i=fixture();i.diagrams[0].usages[0].hotspots=[];assert.equal(r.validateRelease(i).ok,false);
});
test('reject ambiguous OEM, missing trade state, unmapped assemblies and cross-make assignment',()=>{
 const f=fixture();f.parts[0].sku='';assert.equal(r.validateRelease(f).ok,false);
 const g=fixture();g.diagrams[0].assemblyIds=['head'];assert.equal(r.validateRelease(g).ok,false);
 const h=fixture();h.diagrams[0].usages[0].partKey='Toyota:TEST-01';assert.equal(r.validateRelease(h).ok,false);
 const i=fixture();i.diagrams[0].usages.push(i.diagrams[0].usages[0]);assert.equal(r.validateRelease(i).ok,false);
});
