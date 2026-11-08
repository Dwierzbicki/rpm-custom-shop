import test from 'node:test';
import assert from 'node:assert/strict';
import {createAgentReporter,validateReportingServer} from './agent-reporter.mjs';
import {exampleJob} from './example-job.mjs';
import {runFmicAgent} from './agent-run.mjs';
import {exampleFmicProductUrl} from './fmic-guard.mjs';

function reporterMock(){
 const phases=[];
 return {runId:'11111111-1111-4111-8111-111111111111',phases,
  async report(phase,stepIndex=null){phases.push({phase,stepIndex});return {accepted:true}}};
}

test('agent only sends private token to the exact trusted RPM Custom host',async()=>{
 for(const url of ['https://evil.example','https://rpm-custom-shop.onrender.com.evil.example',
  'http://rpm-custom-shop.onrender.com','https://user:password@rpm-custom-shop.onrender.com',
  'https://rpm-custom-shop.onrender.com/@test','https://rpm-custom-shop.onrender.com?token=x']){
  assert.throws(()=>validateReportingServer(url),url);
 }
 assert.equal(validateReportingServer('https://rpm-custom-shop.onrender.com'),
  'https://rpm-custom-shop.onrender.com');
 assert.equal(validateReportingServer('http://127.0.0.1:3000'),
  'http://127.0.0.1:3000');
 const calls=[];
 const mockFetch=async(url,options)=>{
  calls.push({url,options});
  return {ok:true,status:200,async json(){return {accepted:true,created:true,eventId:'10'}}};
 };
 const runner=createAgentReporter(exampleJob(),'inspect',{
  token:'Z'.repeat(60),server:'https://rpm-custom-shop.onrender.com',
  fetchImpl:mockFetch,runId:'11111111-1111-4111-8111-111111111111',
 });
 await runner.report('started');
 await runner.report('inspect_product',0);
 assert.equal(runner.sequence,2);
 assert.equal(calls[0].url,'https://rpm-custom-shop.onrender.com/api/b2b-agent');
 assert.equal(calls[0].options.headers.Authorization,'Bearer '+'Z'.repeat(60));
 assert.equal(calls[0].options.redirect,'error');
 const first=JSON.parse(calls[0].options.body);
 assert.equal(first.jobId,exampleJob().jobId);
 assert.equal(first.seq,1);
 assert.ok(!JSON.stringify(first).includes('ZZZZZZ'));
});

test('loss of progress reporting stops before any further work',async()=>{
 let calls=0;
 const reporter=createAgentReporter(exampleJob(),'inspect',{
  token:'X'.repeat(40),fetchImpl:async()=>{calls++;return {ok:false,status:409}},
 });
 await assert.rejects(reporter.report('started'),/Zatrzymuję działania/);
 assert.equal(reporter.sequence,0);
 assert.equal(calls,1);
});

test('default runner only inspects public product pages and reports stages',async()=>{
 const job=exampleJob(),reporter=reporterMock(),products={};
 for(const line of job.lines)products[line.supplierSku]={url:exampleFmicProductUrl,maxUnitGrossPLN:null};
 let reads=0,cartChanges=0;
 const result=await runFmicAgent(job,{products},{
  reporter,inspectImpl:async(url,options)=>{
   reads++;assert.equal(url,exampleFmicProductUrl);
   assert.ok(options.expectedSku);
   return {product:{sku:options.expectedSku}};
  },prepareImpl:async()=>{cartChanges++;throw Error('Never called')},
 });
 assert.equal(result.orderPlaced,false);
 assert.equal(result.cartChanged,false);
 assert.equal(reads,2);
 assert.equal(cartChanges,0);
 assert.deepEqual(reporter.phases.map(x=>x.phase),[
  'started','inspect_product','inspected','inspect_product','inspected','completed_readonly',
 ]);
});

test('cart writing is disabled without three explicit operator confirmations',async()=>{
 const job=exampleJob(),reporter=reporterMock();
 const products=Object.fromEntries(job.lines.map(x=>[x.supplierSku,{
  url:exampleFmicProductUrl,maxUnitGrossPLN:900,
 }]));
 for(const options of [{mode:'cart-only'},{mode:'cart-only',allowCartWrite:true},
  {mode:'cart-only',allowCartWrite:true,confirmCartOnly:true}]){
  await assert.rejects(runFmicAgent(job,{products},{...options,reporter}),/Zakaz zmian koszyka/);
 }
 assert.equal(reporter.phases.length,0);
});

test('even an approved cart run only emits cart verification, never order submission',async()=>{
 const job=exampleJob(),reporter=reporterMock();
 const products=Object.fromEntries(job.lines.map(x=>[x.supplierSku,{
  url:exampleFmicProductUrl,maxUnitGrossPLN:900,
 }]));
 const result=await runFmicAgent(job,{products},{
  mode:'cart-only',allowCartWrite:true,confirmCartOnly:true,cartEnvEnabled:true,
  reporter,
  prepareImpl:async(_job,_config,options)=>{
   assert.equal(options.ack,'ADD_TO_CART_ONLY');
   await options.onProgress('inspect_product',0);
   await options.onProgress('inspected',0);
   await options.onProgress('cart_add',0);
   await options.onProgress('cart_add_ack',0);
   await options.onProgress('inspect_cart',null);
   return {status:'cart-verified-needs-human-approval',
    orderPlaced:false,orderSubmitted:false};
  },
 });
 assert.equal(result.cartVerified,true);
 assert.equal(result.orderPlaced,false);
 assert.equal(reporter.phases.at(-1).phase,'cart_verified');
 assert.ok(!reporter.phases.some(x=>/submit|place_order|checkout/i.test(x.phase)));
});
