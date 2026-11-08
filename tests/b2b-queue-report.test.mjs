import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const src=await readFile(new URL('../app/lib/b2b-queue-report.ts',import.meta.url),'utf8');
const output=ts.transpileModule(src,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText;
const {validateOfflineReport,InvalidOfflineReport}=await import(
 'data:text/javascript;base64,'+Buffer.from(output).toString('base64')
);
const job={jobId:'a'.repeat(64),orderId:'12345',supplier:'fmic',lines:[{},{}]};
const report=()=>({
 runId:'11111111-1111-4111-8111-111111111111',
 jobId:job.jobId,orderId:job.orderId,supplier:job.supplier,items:2,
 blockedRequests:0,sentToSupplier:false,orderPlaced:false,status:'offline-simulation-only',
 durationMs:2300,trace:[
  {action:'validate_job',result:'ok',elapsedMs:0},
  {action:'populate_cart',result:'ok',elapsedMs:110},
  {action:'screenshot',result:'ok',elapsedMs:2000},
 ],
 image:'C:/users/rpm/local/artifacts/test.png',
});

test('accepts a local demo report, but strips local screenshot path',()=>{
 const parsed=validateOfflineReport(report(),job);
 assert.equal(parsed.runId,report().runId);
 assert.equal(parsed.trace.length,3);
 assert.equal(parsed.durationMs,2300);
 assert.ok(!('image' in parsed));
 assert.equal(parsed.orderPlaced,false);
 assert.equal(parsed.sentToSupplier,false);
});

test('refuses spoofed B2B purchases, network access, altered job ID and unknown fields',()=>{
 const changes=[
  {orderPlaced:true},{sentToSupplier:true},{blockedRequests:1},
  {status:'real-order'}, {jobId:'b'.repeat(64)},
  {items:100},{orderId:'999'}, {supplier:'mtuning'},
  {password:'do-not-store'},{checkoutUrl:'https://supplier.example/checkout'},
  {runId:'foo'}, {durationMs:Infinity},
 ];
 for(const extra of changes)assert.throws(()=>validateOfflineReport({...report(),...extra},job),InvalidOfflineReport);
});

test('requires structured step names and bounded durations',()=>{
 for(const change of [
  {action:'send_order',result:'ok',elapsedMs:100},
  {action:'validate_job',result:'success',elapsedMs:100},
  {action:'validate_job',result:'ok',elapsedMs:-1},
  {action:'validate_job',result:'ok',elapsedMs:1.2},
 ]){
  const v=report();
  v.trace[0]={...change};
  assert.throws(()=>validateOfflineReport(v,job),InvalidOfflineReport);
 }
 const missing=report();missing.trace=[{action:'verify_cart',result:'ok',elapsedMs:2}];
 assert.throws(()=>validateOfflineReport(missing,job),InvalidOfflineReport);
});

test('does not accept a report containing customer PII or secret fields',()=>{
 for(const name of ['customer','password','address','cookie','token','html']){
  assert.throws(()=>validateOfflineReport({...report(),[name]:'secret'},job),InvalidOfflineReport);
 }
});
