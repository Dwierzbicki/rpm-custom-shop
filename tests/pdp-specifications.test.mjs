import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/pdp-specifications.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {groupProductSpecifications,productIdentifiers}=m.exports;
const fields=['model','power','bearing','ar','compressor_wheel','compressor_inlet','turbine_wheel','turbine_inlet','oil_feed','water_thread','custom'].map(key=>({key,label:key,value:'fixture '+key}));
test('turbo groups retain every supplied field, including unknown fields',()=>{
 const groups=groupProductSpecifications(fields,['Turbosprężarki tuningowe']);
 assert.deepEqual(groups.map(g=>g.key),['general','compressor','turbine','lubrication','other']);
 assert.deepEqual(groups.flatMap(g=>g.fields).map(f=>f.key).sort(),fields.map(f=>f.key).sort());
 assert.equal(groups.find(g=>g.key==='compressor').fields[0].key,'compressor_wheel');
});
test('ordinary product has general fields and no empty invented groups',()=>{
 assert.deepEqual(groupProductSpecifications(fields.slice(0,1),['Korbowody']),[{key:'general',title:'Parametry produktu',fields:fields.slice(0,1)}]);
 assert.deepEqual(groupProductSpecifications([],['Turbosprężarki tuningowe']),[]);
});
test('shipping weight is not a customer-facing identifier and duplicate SKU is omitted',()=>{
 assert.deepEqual(productIdentifiers({sku:'123',mpn:'123',ean:'',shipping_weight:'8 kg'}),[]);
 assert.deepEqual(productIdentifiers({sku:'123',mpn:'ABC',ean:'987',shipping_weight:'8 kg'}),[['Numer katalogowy (MPN)','ABC'],['EAN','987']]);
});
