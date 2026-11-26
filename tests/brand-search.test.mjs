import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const brands=JSON.parse(readFileSync(new URL('../app/components/storefront/brand-assets.json',import.meta.url),'utf8'));
const source=readFileSync(new URL('../app/lib/brand-search.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};
vm.runInNewContext(js,{exports,require:(path)=>{assert.equal(path,'../components/storefront/brand-assets.json');return brands}});
const names=q=>Array.from(exports.brandSearchNames(q));
test('brand metadata works for all library entries',()=>{for(const b of brands)assert.ok(names(b.name).includes(b.name.toLowerCase()))});
test('manufacturer aliases resolve consistently',()=>{assert.deepEqual(names('Manley Performance'),names('Manley'));assert.deepEqual(names(' ECU MASTER '),names('ECUMaster'));assert.deepEqual(names('Garrett Motion'),names('Garrett'))});
test('non-brand queries remain ordinary searches',()=>{for(const q of ['BMW E46','Pulsar 6266','compatible with Garrett',"Garrett' OR 1=1",'__proto__'])assert.deepEqual(names(q),[])});

test('RPM Custom is a registered manufacturer',()=>{assert.deepEqual(names('RPM Custom'),['rpm custom']);assert.equal(brands.find(b=>b.slug==='rpm-custom').url,'/optimized/logo.webp')});
