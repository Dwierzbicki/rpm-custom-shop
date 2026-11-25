import test from 'node:test';
import assert from 'node:assert/strict';
import {cases,scenarioUrl,validateResponse} from '../scripts/fmic-benchmark.mjs';
test('Benchmark uses storefront read-only endpoints and fixed scenarios',()=>{
 assert.equal(cases.length,11);
 for(const s of cases)assert.match(scenarioUrl('https://rpmcustom.pl',s).pathname,/^\/api\/catalog\/fmic(?:\/suggest|\/product)?$/);
});
test('Benchmark rejects invalid payloads, duplicates and wrong price order',()=>{
 const s=cases.find(x=>x.params.sort==='priceAsc');
 const data={page:1,total:2,facets:[],items:[{sku:'a',proposed_gross:'10'},{sku:'b',proposed_gross:'20'}]};
 assert.equal(validateResponse(s,data).items,2);
 assert.throws(()=>validateResponse(s,{...data,items:[...data.items].reverse()}));
 assert.throws(()=>validateResponse(s,{...data,items:[data.items[0],data.items[0]]}));
 assert.throws(()=>validateResponse(s,{...data,items:[]}));
 assert.throws(()=>validateResponse(cases.at(-1),{product:{sku:'wrong'},related:[]}));
});
