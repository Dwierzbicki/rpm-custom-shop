import test from 'node:test';
import assert from 'node:assert/strict';
import {exampleJob} from './example-job.mjs';
import {expectedJobId,validateFixtureJob} from './validate.mjs';

const clone=value=>structuredClone(value);
test('accepts a verified offline order and keeps deterministic idempotency key',()=>{
 const job=exampleJob();
 assert.equal(validateFixtureJob(job),job);
 assert.equal(job.jobId,expectedJobId(job));
 assert.equal(job.estimatedNetTotalPLN,1044);
 assert.equal(job.mode,'fixture-only');
 assert.equal(job.manualApprovalRequired,true);
});

test('refuses unknown fields (including PII or a target B2B site)',()=>{
 for(const key of ['customer','address','password','targetUrl','checkoutUrl']){
  const job=exampleJob();job[key]='secret';
  assert.throws(()=>validateFixtureJob(job),/unexpected job fields/);
 }
});

test('rejects spoofed supplier, changed fingerprint and arbitrary execution ID',()=>{
 const valid=exampleJob();
 for(const changes of [
  {supplier:'another'},{procurementFingerprint:'b'.repeat(64)},{jobId:'0'.repeat(64)},
  {mode:'live'},{manualApprovalRequired:false},{orderId:'../../secret'},
 ]){
  const job={...clone(valid),...changes};
  assert.throws(()=>validateFixtureJob(job));
 }
});

test('blocks dangerous quantity, missing SKU and mismatched expected total',()=>{
 const orig=exampleJob();
 for(const change of [
  {quantity:0},{quantity:1.5},{quantity:51},{supplierSku:''},
  {expectedPurchaseNetPLN:-1},{expectedShippingNetPLN:Infinity},
  {sourceLine:0},
 ]){
  const job=clone(orig);Object.assign(job.lines[0],change);
  assert.throws(()=>validateFixtureJob(job));
 }
 const changed=clone(orig);changed.lines[0].quantity=3;
 assert.throws(()=>validateFixtureJob(changed),/total/);
});

test('blocks spoofed cart fields and duplicate line indices',()=>{
 const original=exampleJob();
 const extra=clone(original);extra.lines[0].checkout=true;
 assert.throws(()=>validateFixtureJob(extra));
 const duplicated=clone(original);duplicated.lines[1].sourceLine=1;
 assert.throws(()=>validateFixtureJob(duplicated));
});

test('changes in fingerprint or supplier produce a distinct job key',()=>{
 const x=exampleJob();
 const y={...x,supplier:'mtuning'};
 const z={...x,procurementFingerprint:'b'.repeat(64)};
 assert.notEqual(expectedJobId(x),expectedJobId(y));
 assert.notEqual(expectedJobId(x),expectedJobId(z));
});
