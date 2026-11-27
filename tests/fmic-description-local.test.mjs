import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const mod={exports:{}};
const source=fs.readFileSync(new URL('../app/lib/fmic-description-local.ts',import.meta.url),'utf8');
new Function('exports','module',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports,mod);
const {processCachedDescriptions,drainCachedDescriptions}=mod.exports;

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

test('local drain prioritizes builder SKU and processes up to twelve items with at most three active tasks',async()=>{
 let remaining=20,active=0,maxActive=0,queries=0;
 const db={query:async(sql,args)=>{
  assert.match(sql,/CASE WHEN q.sku=ANY\(\$2::text\[\]\)/);
  assert.deepEqual(args,[3,['builder-sku']]);queries++;
  return {rows:Array.from({length:Math.min(3,remaining)},(_,i)=>({sku:String(remaining-i)}))};
 }};
 const result=await drainCachedDescriptions(db,async()=>{active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setImmediate(r));active--;remaining--},['builder-sku'],()=>true);
 assert.equal(queries,4);assert.equal(result.length,12);assert.equal(maxActive,3);assert.equal(remaining,8);
});
test('drain respects pause and stops after a failed batch',async()=>{
 let queries=0;const db={query:async()=>{queries++;return {rows:['a','b','c'].map(sku=>({sku}))}}};
 assert.deepEqual(await drainCachedDescriptions(db,async()=>{},[],()=>false),[]);assert.equal(queries,0);
 const result=await drainCachedDescriptions(db,async sku=>{if(sku==='a')throw Error('fixture')},[],()=>true);
 assert.equal(queries,1);assert.equal(result[0].status,'rejected');
});
