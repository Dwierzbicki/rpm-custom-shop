import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/lib/power-build-profile.ts',import.meta.url),'utf8');
const exports={};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {validBuildProfile,fuelModel,budgetRemaining}=exports;
const profile={induction:'turbo',fuel:'e85',internals:'forged',priority:'response',budgetPln:30000};
test('only supported and explicitly selected project parameters pass',()=>{
 assert.equal(validBuildProfile(profile),true);
 assert.equal(validBuildProfile({...profile,budgetPln:null}),true);
 for(const patch of [{induction:'na'},{induction:'supercharger'},{fuel:''},{internals:''},{priority:''},{budgetPln:undefined},{budgetPln:NaN},{budgetPln:-1},{budgetPln:1000.5}])assert.equal(validBuildProfile({...profile,...patch}),false);
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
