import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const load=(file,deps={})=>{const exports={};vm.runInNewContext(ts.transpileModule(read('app/lib/'+file+'.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,require:n=>deps[n]});return exports};
const k=load('motolab-knowledge',{'./storefront-config':load('storefront-config')});
const id='12345678-1234-1234-1234-123456789012';
const engine={...k.emptyKnowledge('engine',id),sourceLocator:'Pomiar 001',excerpt:'Własne pomiary'};
engine.entry.variant='Double VANOS';engine.entry.configuration='OEM';
test('engine entry requires source and explicitly selected variant, unknown dimensions stay null',()=>{
 assert.equal(k.validKnowledgeInput(engine),true);assert.equal(engine.entry.boreMm,null);
 assert.equal(k.validKnowledgeInput({...engine,entry:{...engine.entry,version:'unknown'}}),false);
 assert.equal(k.validKnowledgeInput({...engine,entry:{...engine.entry,rodLengthMm:-1}}),false);
 assert.equal(k.validKnowledgeInput({...engine,sourceKind:'manufacturer'}),false);
 assert.equal(k.validKnowledgeInput({...engine,sourceUrl:'javascript:alert(1)'}),false);
});
test('technical data uses exact SKU, explicit parameter, source and excludes untrusted review fields',()=>{
 const x={...k.emptyKnowledge('technical',id),sourceKind:'manufacturer',sourceUrl:'https://example.com/doc',sourceLocator:'p. 5',excerpt:'135 mm'};
 Object.assign(x.entry,{sku:' SKU-1 ',parameter:'rod_length',value:'135',unit:'mm'});
 assert.equal(k.validKnowledgeInput(x),true);
 assert.equal(k.validKnowledgeInput({...x,entry:{...x.entry,parameter:'<script>'}}),false);
 const cleaned=k.cleanKnowledgeInput({...x,status:'approved',identity:{name:'fake'}});
 assert.equal(cleaned.status,undefined);assert.equal(cleaned.identity,undefined);assert.equal(cleaned.entry.sku,'SKU-1');
 const identity={sku:'SKU-1',name:'Rod',brand:'ZRP',mpn:'x',ean:'',category:'engine'};
 assert.equal(k.sameIdentity(identity,{...identity}),true);assert.equal(k.sameIdentity(identity,{...identity,mpn:'y'}),false);
});
test('knowledge saves draft only, review has optimistic revision guard and separate action',()=>{
 const db=read('app/lib/motolab-knowledge-db.ts'),api=read('app/api/admin/motolab-knowledge/route.ts');
 assert.ok(db.includes("status:'draft'"));assert.ok(db.includes("data->>'revision'=$3"));
 assert.ok(db.includes('sameIdentity(old.identity,await identity(db,old.entry))'));
 assert.ok(api.includes("x?.action==='review'"));assert.ok(api.includes("origin"));
});
