import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const load=(file,deps={})=>{const exports={};vm.runInNewContext(ts.transpileModule(read('app/lib/'+file+'.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,require:n=>deps[n]});return exports};
test('research records are valid unique unapproved source leads',()=>{const k=load('motolab-knowledge',{'./storefront-config':load('storefront-config')});const {researchBatchV1:r}=load('motolab-research-batch-v1');assert.equal(r.length,19);assert.equal(new Set(r.map(x=>x.id)).size,r.length);for(const x of r){assert.ok(k.validKnowledgeInput(x),x.entry.configuration);assert.equal(x.revision,0);assert.equal(x.status,undefined);assert.equal(x.entry.targetPowerPs,null);assert.equal(x.entry.targetTorqueNm,null);}});
test('research import cannot overwrite edited or approved records',()=>{assert.match(read('app/lib/motolab-knowledge-db.ts'),/ON CONFLICT\(key\) DO NOTHING RETURNING key/);assert.match(read('app/api/admin/motolab-knowledge/route.ts'),/import-research-v1/)});

test('Zgrywus workshop batch is separate, keeps reported measurements distinct from project targets',()=>{const k=load('motolab-knowledge',{'./storefront-config':load('storefront-config')});const {researchBatchV1:v1}=load('motolab-research-batch-v1');const {researchBatchV2:v2}=load('motolab-research-batch-v2');assert.equal(v2.length,7);assert.equal(new Set([...v1,...v2].map(x=>x.id)).size,v1.length+v2.length);for(const x of v2){assert.ok(k.validKnowledgeInput(x),x.entry.configuration);assert.equal(x.revision,0);assert.equal(x.entry.targetPowerPs,null);assert.equal(x.entry.targetTorqueNm,null);assert.ok(x.sourceUrl.startsWith('https://zgrywusgarage.pl/myproject/'));}const joker=v2.find(x=>x.entry.configuration.includes('Joker'));assert.ok(joker.entry.notes.includes('394 KM')&&joker.entry.notes.includes('440 KM'));assert.equal(joker.entry.crank,'');assert.ok(v2.some(x=>x.entry.notes.includes('HTTP 429')));});
