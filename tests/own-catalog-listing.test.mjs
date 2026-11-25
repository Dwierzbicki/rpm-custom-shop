import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function load(file,deps={}){
 const source=readFileSync(new URL('../app/'+file+'.ts',import.meta.url),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(js,{exports,require(name){assert.ok(name in deps,'Unexpected dependency '+name);return deps[name]}});return exports;
}
const taxonomy=load('fmic-categories');
const search=load('lib/header-search');
const own=load('lib/own-catalog-listing',{'../fmic-categories':taxonomy,'./header-search':search});
const prism={id:31,sku:'RPM-00031',name:'Kute korbowody PRISM BMW M50 / M52 / M54 135 mm',brand:'PRISM',category:'Korbowody',price:2100,engine:'BMW M54',stockStatus:'available',visible:true,images:['https://example.com/fixture.jpg'],attributes:{'Numer katalogowy':'ZZZ135'}};
test('manual PRISM is mapped to real shop category and searchable by SKU, brand and manufacturer code',()=>{
 const p=own.ownCategoryPath(prism.category);
 assert.equal(JSON.stringify(p),JSON.stringify(['Silnik i turbo','Kute korbowody']));
 assert.ok(own.ownInPath(p,['Silnik i turbo']));assert.ok(!own.ownInPath(p,['Układ paliwowy']));
 for(const q of ['Prism','RPM-00031','ZZZ135','M54 135'])assert.equal(own.ownListingRows([prism],q,'all',null,null).length,1);
 assert.equal(own.ownProductHref(31),'/?product=31');
});
test('hidden, retired and mismatched products never enter the public listing',()=>{
 for(const product of [{...prism,id:2},{...prism,visible:false}])assert.equal(own.ownListingRows([product],'PRISM','all',null,null).length,0);
 assert.equal(own.ownListingRows([prism],'other','all',null,null).length,0);
 assert.equal(own.ownListingRows([prism],'PRISM','unavailable',null,null).length,0);
 assert.equal(own.ownListingRows([prism],'PRISM','available',2200,null).length,0);
 assert.equal(own.ownListingRows([prism],'PRISM','available',null,2000).length,0);
 assert.equal(own.ownCategoryPath('__proto__').length,0);
});
test('a widened supplier page can be merged without skipping or duplicating own products',()=>{
 const supplier=Array.from({length:65},(_,i)=>i*3),manual=[-1,8,50,51,100,999];
 const merged=[...supplier,...manual].sort((a,b)=>a-b);
 for(let offset=0;offset<merged.length;offset+=24){const start=Math.max(0,offset-manual.length);const page=[...supplier.slice(start,start+24+manual.length),...manual].sort((a,b)=>a-b).slice(offset-start,offset-start+24);assert.deepEqual(page,merged.slice(offset,offset+24))}
});
