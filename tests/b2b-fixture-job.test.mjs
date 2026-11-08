import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const transpile=source=>ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText;
const imports=source=>'data:text/javascript;base64,'+Buffer.from(transpile(source)).toString('base64');
const exportSource=await readFile(new URL('../app/lib/procurement-export.ts',import.meta.url),'utf8');
const exportUrl=imports(exportSource);
const jobSource=(await readFile(new URL('../app/lib/b2b-fixture-job.ts',import.meta.url),'utf8'))
 .replaceAll("from './procurement-export'","from '"+exportUrl+"'");
const {createB2BFixtureJob}=await import(imports(jobSource));
const line=(index,supplier,extra={})=>({
 index,productId:100+index,sku:'RPM-100'+index,name:'RPM Product',qty:2,
 options:{Flansza:'V-Band'},supplier,
 supplierSku:'SKU-'+index,offerId:10+index,offerName:'Supplier Part',
 leadDays:2,purchaseNet:100,shippingNet:10,estimatedNetTotal:220,
 salesGrossTotal:400,blocked:null,requiresVariantCheck:true,...extra,
});
const plan={
 orderId:'123',orderStatus:'confirmed',lines:[line(0,'fmic'),line(1,'mtuning')],
 counts:{ready:2,blocked:0,needsVariantCheck:2},
 suppliers:['fmic','mtuning'],totalEstimatedNet:440,maxLeadDays:7,
 fingerprint:'a'.repeat(64),canDraft:true,notes:[],
};

test('prepares one supplier-only offline job with a stable key',()=>{
 const result=createB2BFixtureJob(plan,'fmic');
 assert.equal(result.schemaVersion,1);
 assert.equal(result.mode,'fixture-only');
 assert.equal(result.manualApprovalRequired,true);
 assert.equal(result.currency,'PLN');
 assert.equal(result.orderId,'123');
 assert.deepEqual(result.lines.map(x=>x.supplierSku),['SKU-0']);
 assert.deepEqual(result.lines[0].options,{Flansza:'V-Band'});
 assert.equal(result.lines[0].quantity,2);
 assert.equal(result.estimatedNetTotalPLN,220);
 assert.match(result.jobId,/^[a-f0-9]{64}$/);
 assert.equal(result.jobId,createB2BFixtureJob(plan,'fmic').jobId);
 assert.notEqual(result.jobId,createB2BFixtureJob(plan,'mtuning').jobId);
});

test('offline job never exports private customer data or checkout links',()=>{
 const copy={...plan,customer:{name:'Secret',email:'secret@invalid.local',address:'Secret 12',phone:'987654321'}};
 const result=createB2BFixtureJob(copy,'fmic');
 const json=JSON.stringify(result);
 for(const secret of ['secret@invalid.local','Secret 12','987654321','checkoutUrl','supplierPassword']){
  assert.ok(!json.includes(secret));
 }
});

test('rejects missing lines, unknown suppliers, blocked drafts or malformed IDs',()=>{
 assert.throws(()=>createB2BFixtureJob(plan,'unexpected'));
 assert.throws(()=>createB2BFixtureJob({...plan,canDraft:false},'fmic'));
 assert.throws(()=>createB2BFixtureJob({...plan,orderId:'0'},'fmic'));
 assert.throws(()=>createB2BFixtureJob({...plan,fingerprint:'no'},'fmic'));
 assert.throws(()=>createB2BFixtureJob({...plan,lines:plan.lines.filter(x=>x.supplier==='mtuning'),
  counts:{ready:1,blocked:0,needsVariantCheck:1}},'fmic'));
});

test('invalid quantities, missing SKU or unexpected variants are rejected',()=>{
 const cases=[
  {qty:0},{qty:51},{supplierSku:''},{purchaseNet:-5},
  {options:{Flansza:123}},{name:'X'.repeat(201)},
 ];
 for(const c of cases){
  const modified={...plan,lines:[line(0,'fmic',c)]};
  assert.throws(()=>createB2BFixtureJob(modified,'fmic'));
 }
});
