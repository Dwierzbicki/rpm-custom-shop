import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
function load(path,require=()=>{throw Error('unexpected import')}){
 const m={exports:{}};
 new Function('exports','module','require',ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m,require);
 return m.exports;
}
test('only brands outside the inference dictionary use explicit metadata pushdown',()=>{
 const {explicitProducerFilter}=load('app/lib/fmic-facets.ts');
 assert.equal(explicitProducerFilter('RPM Custom'),true);
 assert.equal(explicitProducerFilter('Pulsar'),false);
 assert.equal(explicitProducerFilter('HEL'),false);
 assert.equal(explicitProducerFilter('FMIC.Pro'),false);
 assert.equal(explicitProducerFilter(''),false);
});
test('single facet cache key ignores own selection, multi-facet keeps cross-filter state',()=>{
 const {listingCacheKeys}=load('app/lib/fmic-search-performance.ts',()=>({searchTokens:()=>[]}));
 const base={path:[],q:'',stock:'all',sort:null,page:1,min:null,max:null,selected:['']};
 const a=listingCacheKeys(base),b=listingCacheKeys({...base,selected:['RPM Custom']});
 assert.equal(a.facets,b.facets);assert.notEqual(a.count,b.count);assert.notEqual(a.items,b.items);
 assert.notEqual(listingCacheKeys({...base,selected:['','']}).facets,listingCacheKeys({...base,selected:['Pulsar','']}).facets);
});
