import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const load=(file,deps={})=>{const exports={};vm.runInNewContext(ts.transpileModule(read('app/lib/'+file+'.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,require:n=>deps[n]});return exports};
test('research records are valid unique unapproved source leads',()=>{const k=load('motolab-knowledge',{'./storefront-config':load('storefront-config')});const {researchBatchV1:r}=load('motolab-research-batch-v1');assert.equal(r.length,19);assert.equal(new Set(r.map(x=>x.id)).size,r.length);for(const x of r){assert.ok(k.validKnowledgeInput(x),x.entry.configuration);assert.equal(x.revision,0);assert.equal(x.status,undefined);assert.equal(x.entry.targetPowerPs,null);assert.equal(x.entry.targetTorqueNm,null);}});
test('research import cannot overwrite edited or approved records',()=>{assert.match(read('app/lib/motolab-knowledge-db.ts'),/ON CONFLICT\(key\) DO NOTHING RETURNING key/);assert.match(read('app/api/admin/motolab-knowledge/route.ts'),/import-research-v1/)});
