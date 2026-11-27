import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/lib/power-builder-discovery.ts',import.meta.url),'utf8');
const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {discoverBov}=exports;
test('discovers complete universal valves even if supplier brand field is empty',()=>{
 for(const [sku,name,brand] of [
 ['284300001','Zawór Blow Off Pulsar PSR 50mm 9PSI V-band','Pulsar'],
 ['USA-TIAL-002573','Zawór upustowy Blow off Tial Q Czarny 11psi','TiAL'],
 ['RTMG-901-0370','RTMG Performance Universal Blow Off Valve Double Piston Black','RTMG Performance'],
 ['TS-0205-1130','Zawór Blow off BOV Turbosmart TS-0205-1130 Vee-Port PRO Universal','Turbosmart'],
 ['VLV-BO-PP-TYP1-25MM','Blow Off Properfekt Typ I 25 mm','Properfekt']
 ])assert.equal(discoverBov({sku,name,brand:''})?.brand,brand);
});
test('rejects accessories, replicas, diesel and named vehicle applications',()=>{
 for(const [sku,name] of [
 ['USA-TIAL-003907','Blow off Valve Spring Tial Sport Q and QR Series Brown'],
 ['TS-0204-3108','Blow off Turbosmart Race Port Sensor Cap - Black'],
 ['VLV-BO-HKS-SSQV3-B','Blow off SSQV 3 HKS style Czarny'],
 ['TS-0215-1367','Blow off Turbosmart Smart Port Supersonic BOV - Ford F150 3.5 EcoBoost'],
 ['704325092','Pulsar PSR Next Generation 50mm BOV Blow-Off Valve Diaphragm Only'],
 ['EBOV','Regulowany zawór blow off do silników turbodiesel']
 ])assert.equal(discoverBov({sku,name}),null);
});
