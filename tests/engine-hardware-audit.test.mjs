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
const catalog=load('catalog'),a=load('audit',{'./catalog':catalog});
const row={...a.importTemplate.rows[0],oem:'TEST-01',position:'01',diagramId:'TEST',vehicle:'TEST',fitment:'TEST',namePl:'Test',nameEn:'Test',locationPl:'Test',locationEn:'Test',source:'https://example.com/doc'};
const batch={engine:'M54B30',rightsEvidence:'test fixture',rows:[row]};
test('audit does not label pilot complete or sales ready',()=>{const r=a.auditEngine('M54B30');assert.equal(r.usageCount,36);assert.equal(r.saleReady,0);assert.ok(r.assemblies.every(x=>['partial','pending'].includes(x.status)));assert.equal(a.auditEngine('M54B25').usageCount,0)});
test('import accepts explicit unknown quantity but rejects guessing or duplicates',()=>{assert.equal(a.validateBatch(batch).ok,true);assert.equal(a.validateBatch({...batch,rightsEvidence:''}).ok,false);assert.equal(a.validateBatch({...batch,rows:[row,row]}).ok,false);assert.equal(a.validateBatch({...batch,rows:[{...row,quantity:1}]}).ok,false);assert.equal(a.validateBatch({...batch,rows:[{...row,quantity:1,quantityUnit:'set'}]}).ok,true);assert.equal(a.validateBatch({...batch,rows:[{...row,torque:'20 Nm'}]}).ok,false)});
