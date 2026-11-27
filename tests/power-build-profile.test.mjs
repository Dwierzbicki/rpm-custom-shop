import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/lib/power-build-profile.ts',import.meta.url),'utf8');
const exports={};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {validBuildProfile,rodOptionsFor,fuelModel,budgetRemaining}=exports;
const profile={induction:'turbo',fuel:'e85',internals:'forged',rods:'forged',priority:'response',budgetPln:30000};
test('only supported and explicitly selected project parameters pass',()=>{
 assert.equal(validBuildProfile(profile,'m54b30'),true);
 assert.equal(validBuildProfile({...profile,budgetPln:null},'m54b30'),true);
 for(const patch of [{induction:'na'},{induction:'supercharger'},{fuel:''},{internals:''},{priority:''},{budgetPln:undefined},{budgetPln:NaN},{budgetPln:-1},{budgetPln:1000.5}])assert.equal(validBuildProfile({...profile,...patch},'m54b30'),false);
});
test('fuel estimates use petrol or conservative E85 blend assumptions',()=>{
 assert.equal(fuelModel('pb95'),'petrol');assert.equal(fuelModel('pb98'),'petrol');
 assert.equal(fuelModel('e85'),'ethanol');assert.equal(fuelModel('flex'),'ethanol');
});
test('budget delta is based on actual selected subtotal and never implies a full build',()=>{
 assert.equal(budgetRemaining(30000,25290),4710);
 assert.equal(budgetRemaining(20000,25290),-5290);
 assert.equal(budgetRemaining(null,25290),null);
 assert.equal(budgetRemaining(30000,NaN),null);
});

test('BMW M50/M52/M54 support three explicit rod options, Toyota never accepts M50B25 NV',()=>{
 for(const version of ['m50b20','m50b25','m50b30-stroker','m52b20','m52b25','m52b28','m54b22','m54b25','m54b30']){
  assert.equal(rodOptionsFor(version).join(','),'stock,m50b25nv,forged');
  for(const rods of ['stock','m50b25nv','forged'])assert.equal(validBuildProfile({...profile,rods},version),true);
  assert.equal(validBuildProfile({...profile,rods:''},version),false);
  assert.equal(validBuildProfile({...profile,rods:'auto'},version),false);
 }
 for(const version of ['2jz-ge','2jz-gte']){
  assert.equal(rodOptionsFor(version).join(','),'stock,forged,auto');
  assert.equal(validBuildProfile({...profile,rods:'m50b25nv'},version),false);
 }
 assert.equal(validBuildProfile(profile,'unknown'),false);
});
