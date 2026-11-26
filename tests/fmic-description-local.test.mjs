import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const mod={exports:{}};
const source=fs.readFileSync(new URL('../app/lib/fmic-description-local.ts',import.meta.url),'utf8');
new Function('exports','module',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports,mod);
const {processCachedDescriptions}=mod.exports;

test('cached-only selection, distinct bounded parallel tasks, wait for all failures and successes',async()=>{
 const started=[],finished=[];
 const releases=new Map();
 const db={query:async(sql,args)=>{
  assert.match(sql,/FROM rpm_fmic_enrichment e/);
  assert.match(sql,/JOIN rpm_fmic_description_queue q USING\(sku\)/);
  assert.match(sql,/q.status='pending'/);
  assert.deepEqual(args,[3]);
  return {rows:['a','b','b','c','d'].map(sku=>({sku}))};
 }};
 let settled=false;
 const batch=processCachedDescriptions(db,async sku=>{
  started.push(sku);
  await new Promise(resolve=>releases.set(sku,resolve));
  finished.push(sku);
  if(sku==='b')throw Error('fixture failure');
 }).then(result=>{settled=true;return result});
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(started,['a','b','c']);
 releases.get('b')();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(settled,false);
 releases.get('a')();releases.get('c')();
 const result=await batch;
 assert.deepEqual(result.map(x=>x.status),['fulfilled','rejected','fulfilled']);
 assert.equal(finished.length,3);
});
test('empty cache queue performs no tasks',async()=>{
 const result=await processCachedDescriptions({query:async()=>({rows:[]})},async()=>{throw Error('unexpected work')});
 assert.deepEqual(result,[]);
});
