import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

function load(path,deps={}){
 const code=ts.transpileModule(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};new Function('exports','module','require',code)(m.exports,m,p=>{if(!(p in deps))throw Error('Unexpected dependency '+p);return deps[p]});return m.exports;
}
const tree=load('app/fmic-categories.ts');
const routing=load('app/category-routing.ts',{'./fmic-categories':tree});
const manual={id:31,sku:'RPM-00031',name:'Rods',brand:'RPM Custom',category:'Korbowody',price:2100,stockStatus:'available',visible:true};
const calls=[];
const db={query:async(sql,args)=>{
 calls.push({sql,args});
 if(sql.includes("to_regclass('rpm_variant_families')"))return {rows:[{present:false}]};
 if(sql.includes('page_rows AS MATERIALIZED'))return {rows:[{sku:'RPM-00031',manual_id:31,brand:'RPM Custom'}]};
 if(sql.includes('SELECT count(*)::int AS total'))return {rows:[{total:2}]};
 if(sql.includes(' AS facet,'))return {rows:[{facet:'producer',value:'RPM Custom',count:1},{facet:'producer',value:'Supplier',count:1}]};
 if(sql.includes('memberships.path AS path'))return {rows:[{path:['Silnik i turbo','Kute korbowody'],count:1}]};
 throw Error('Unexpected SQL '+sql);
}};
const {GET}=load('app/api/admin/fmic-preview/route.ts',{
 '../../../lib/fmic-image-ranking':{imageOrderSql:'img.pos'},
 'next/server':{NextResponse:{json:(data,init)=>Response.json(data,init)}},
 '../../../lib/brand-search':{brandSearchNames:()=>[]},
 '../../../lib/db':{getDbPool:()=>db},
 '../../../lib/listing-variants':load('app/lib/listing-variants.ts'),
 '../../../lib/fmic-facets':{explicitProducerFilter:()=>false,fmicSearchFacets:()=>[{key:'producer',label:'Producent',expression:"data->>'brand'"}]},
 '../../../lib/fmic-category-membership':{visibleCatalog:'TRUE',categoryExpansion:'',listingCategoryMembership:()=> 'cardinality($1::text[])>=0'},
 '../../../lib/catalog-db':{getCatalog:async()=>[manual]},
 '../../../lib/header-search':{matchesSearch:()=>true},
 'node:crypto':await import('node:crypto'),
 '../../../category-routing':routing,
 '../../../lib/fmic-search-performance':{cachedSearch:(_k,_ttl,fn)=>fn(),searchPatterns:()=>[],searchConditions:()=> 'TRUE',listingCacheKeys:()=>({count:'count',items:'items',facets:'facets',categories:'categories'})},
 '../../../lib/fmic-filter-order':{compareOptions:(a,b)=>a.value.localeCompare(b.value)}
});
test('public root without query runs mixed paginated listing and category counts',async()=>{
 calls.length=0;
 const response=await GET(new Request('https://rpmcustom.pl/api/catalog/fmic?category=%2Fsklep'));
 assert.equal(response.status,200);const data=await response.json();
 assert.equal(data.total,2);assert.equal(data.size,24);assert.equal(data.page,1);
 assert.equal(data.includesManual,true);assert.equal(data.items[0].sku,manual.sku);
 assert.equal(data.facets[0].options.length,2);
 assert.deepEqual(data.categories,[{path:['Silnik i turbo','Kute korbowody'],count:2}]);
 const items=calls.find(x=>x.sql.includes('page_rows AS MATERIALIZED'));
 assert.match(items.sql,/UNION ALL/);assert.deepEqual(items.args.slice(-2),[24,0]);
});
test('admin preview without category/query stays empty and does not query DB',async()=>{
 calls.length=0;const response=await GET(new Request('https://rpmcustom.pl/api/admin/fmic-preview'));
 assert.equal(response.status,200);assert.equal((await response.json()).total,0);assert.equal(calls.length,0);
});
test('public root page two and manufacturer filter are sent to shared SQL',async()=>{
 calls.length=0;const response=await GET(new Request('https://rpmcustom.pl/api/catalog/fmic?page=2&producer=RPM+Custom'));
 assert.equal(response.status,200);assert.equal((await response.json()).page,2);
 const items=calls.find(x=>x.sql.includes('page_rows AS MATERIALIZED'));
 assert.match(items.sql,/WHERE producer=\$\d+/);assert.deepEqual(items.args.slice(-3),['RPM Custom',24,24]);
});
