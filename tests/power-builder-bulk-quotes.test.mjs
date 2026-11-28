import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/api/catalog/fmic/build-discovery/route.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const rows=[{sku:'A',name:'Current',target_category:['Engine']},{sku:'B',name:'Unavailable',target_category:['Engine']},{sku:'C',name:'Old name',target_category:['Engine']},{sku:'D',name:'Invalid price',target_category:['Engine']}];
const quoteRows=[{sku:'A',name:'Current',available:true,proposed_gross:'100.50',image:null,updated_at:'2026-01-01'},{sku:'B',name:'Unavailable',available:false,proposed_gross:120},{sku:'C',name:'New name',available:true,proposed_gross:150},{sku:'D',name:'Invalid price',available:true,proposed_gross:0}];
function route({catalog=rows,quotes=quoteRows}={}){
 const calls=[];
 const make=(row,slot)=>({sku:row.sku,name:row.name,slot});
 const deps={
  'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200,headers:options?.headers})}},
  '../../../../lib/fmic-image-ranking':{imageOrderSql:'img.pos'},
  '../../../../lib/fmic-category-membership':{visibleCatalog:'TRUE'},
  '../../../../lib/db':{getDbPool:()=>({query:async(sql,params)=>{calls.push({sql,params});return {rows:sql.includes('sku=ANY')?quotes:catalog}}})},
  '../../../../lib/power-builder-discovery':{
   pistonEngineVersions:['m54b30'],pistonDiscoveryCategory:['Pistons'],engineDiscoveryPaths:{rods:[['Engine']],gasket:[['Engine']]},extraDiscoveryPaths:{filter:[['Filter']]},
   discoverPiston:r=>make(r,'pistons'),discoverEnginePart:(r,v,id)=>make(r,id),discoverPart:r=>make(r,'bov'),discoverExtraPart:(r,path,id)=>make(r,id)
  }
 };
 const exports={};
 vm.runInNewContext(js,{exports,URL,console,process:{env:{SITE_LOCK_ENABLED:'1'}},require(name){assert.ok(Object.hasOwn(deps,name),name);return deps[name]}});
 return {GET:exports.GET,calls};
}
for(const [query,count] of [['slot=pistons&version=m54b30',1],['slot=engine-parts&version=m54b30',2],['slot=filter',1],['',1]]){
 test('discovery returns one bulk quote query and only currently purchasable matches: '+(query||'base'),async()=>{
  const {GET,calls}=route();
  const response=await GET({url:'https://example.test/api?'+query});
  assert.equal(response.status,200);
  assert.equal(response.headers['Cache-Control'],'private, no-store');
  assert.equal(response.body.items.length,count);
  assert.ok(response.body.items.every(item=>item.sku==='A'));
  assert.equal(response.body.quotes.find(q=>q.sku==='A').unitPrice,100.5);
  assert.equal(response.body.scanned,4);
  assert.equal(calls.length,2);
  assert.equal(calls[1].sql.includes('sku=ANY'),true);
  assert.equal(JSON.stringify(calls[1].params),JSON.stringify([['A','B','C','D']]));
 });
}
test('empty discovery does not issue a quote query',async()=>{
 const {GET,calls}=route({catalog:[]});
 const response=await GET({url:'https://example.test/api?slot=pistons&version=m54b30'});
 assert.equal(response.status,200);
 assert.equal(response.body.items.length,0);
 assert.equal(response.body.quotes.length,0);
 assert.equal(calls.length,1);
});
test('unknown engine is rejected before querying the catalogue',async()=>{
 const {GET,calls}=route();
 const response=await GET({url:'https://example.test/api?slot=engine-parts&version=__proto__'});
 assert.equal(response.status,400);
 assert.equal(calls.length,0);
});
