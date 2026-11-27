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

test('live discovery distinguishes pre-filter and post-filter and rejects dedicated parts',()=>{
 const category=['Układ paliwowy','Filtry paliwa'];
 assert.equal(exports.discoverPart({sku:'DW-8-03-110-010K-8',name:'DeatschWerks In-Line Fuel Filter Kit -8AN 10 Micron 110mm'},category)?.slot,'fuel-post-filter');
 assert.equal(exports.discoverPart({sku:'DW-8-03-160-100K-8',name:'DeatschWerks In-Line Fuel Filter Kit -8AN 100 Micron 160mm'},category)?.slot,'fuel-pre-filter');
 assert.equal(exports.discoverPart({sku:'USA-RAD-20-0475-03',name:'Dedykowany filtr paliwa z wkładem stalowym 10um BMW E90 Radium Engineering'},category),null);
 assert.equal(exports.discoverPart({sku:'DW-8-03-110-040K-8',name:'DeatschWerks In-Line Fuel Filter Kit -8AN 40 Micron 110mm'},category),null);
});
test('EFI regulator discovery includes other brands but rejects low pressure regulators',()=>{
 const category=['Układ paliwowy','Regulatory ciśnienia paliwa','Regulatory ciśnienia paliwa'];
 assert.equal(exports.discoverPart({sku:'USA-ARE-13109',name:'Regulator ciśnienia paliwa Aeromotive A1000-6, Performance EFI'},category)?.brand,'Aeromotive');
 assert.equal(exports.discoverPart({sku:'NP-300-02-203',name:'Nuke Performance Fuel Pressure Regulator FPR100m AN-8'},category)?.brand,'Nuke Performance');
 assert.equal(exports.discoverPart({sku:'TS-0404-1122',name:'Regulator ciśnienia paliwa Turbosmart FPR6 AN6 niskie ciśnienie'},category),null);
});
test('universal intercooler discovery requires the correct category',()=>{
 const row={sku:'MMINT-UGB',name:'Intercooler uniwersalny Mishimoto G-Line Czarny'};
 assert.equal(exports.discoverPart(row,['Układ dolotowy','Intercooler','Uniwersalne'])?.slot,'intercooler');
 assert.equal(exports.discoverPart(row,['Układ dolotowy','Intercooler','Intercoolery dedykowane']),null);
});

test('intercooler dimensions are unique and sorted numerically, not by text or price',()=>{
 const names=['Intercooler 600x300x100mm FMIC.EU','Intercooler 600x300x76mm FMIC.EU','Intercooler 450x180x65mm FMIC.EU','Intercooler JRspec 600x300x76mm','Intercooler 600×180×90 mm','Intercooler uniwersalny Mishimoto G-Line'];
 assert.equal(JSON.stringify(exports.intercoolerDimensionOptions(names)),JSON.stringify(['450×180×65','600×180×90','600×300×76','600×300×100']));
 assert.equal(exports.intercoolerDimensions('Intercooler Mishimoto G-Line 63.5mm'),null);
});
