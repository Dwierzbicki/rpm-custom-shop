import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const raw=await readFile(new URL('../app/lib/b2b-cart-review.ts',import.meta.url),'utf8');
const js=ts.transpileModule(raw,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText;
const {validateCartReview,InvalidCartReview}=await import(
 'data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const job={jobId:'a'.repeat(64),orderId:'120',supplier:'fmic',
 lines:[{supplierSku:'F00VE35007-BOS',quantity:2}]};
const report=()=>({
 runId:'11111111-1111-4111-8111-111111111111',jobId:job.jobId,
 orderId:'120',supplier:'fmic',status:'cart-verified-needs-human-approval',
 lines:[{action:'add_to_cart',sku:'F00VE35007-BOS',qty:2,
  responseStatus:200,result:'requested'}],
 cartVerification:{ok:true,issues:[],verifiedLines:1,
  calculatedGrossPLN:7.98,observedSubtotalGrossPLN:7.98},
 cartAddRequests:1,blockedRequests:5,durationMs:1400,
 screenshot:'C:/private/local/FMICScreenshot.png',
 orderPlaced:false,orderSubmitted:false,note:'Ręczna kontrola',
});
test('verified cart report is sanitized: no screenshot path or vendor secrets',()=>{
 const saved=validateCartReview(report(),job);
 assert.equal(saved.verdict,'verified');
 assert.equal(saved.items,1);
 assert.equal(saved.cartAddRequests,1);
 assert.equal(saved.observedSubtotalGrossPLN,7.98);
 assert.ok(!('screenshot' in saved));
 assert.ok(!('lines' in saved));
 assert.ok(!JSON.stringify(saved).includes('private'));
});
test('failed cart comparison is recorded only as needs_review',()=>{
 const failed=report();
 failed.status='cart-not-verified';
 failed.cartVerification={ok:false,issues:['Zła ilość SKU'],verifiedLines:1,
  calculatedGrossPLN:7.98,observedSubtotalGrossPLN:11.97};
 const saved=validateCartReview(failed,job);
 assert.equal(saved.verdict,'needs_review');
 assert.deepEqual(saved.issues,['Zła ilość SKU']);
});
test('blocks fake order submissions, unknown job IDs and custom personal data',()=>{
 for(const updates of [
  {orderSubmitted:true},{orderPlaced:true},{jobId:'b'.repeat(64)},
  {orderId:'99'},{supplier:'mtuning'}, {password:'secret'},
  {customer:{phone:'123'}}, {redirect:'https://evil.example/checkout'},
  {cartAddRequests:-1},{durationMs:Infinity},
 ]){
  assert.throws(()=>validateCartReview({...report(),...updates},job),InvalidCartReview);
 }
});
test('cart verdict cannot claim verified when comparison has issues',()=>{
 const invalid=report();
 invalid.cartVerification.issues.push('extra SKU');
 assert.throws(()=>validateCartReview(invalid,job),InvalidCartReview);
});
test('only SKU and quantity from original approved task may appear in report',()=>{
 const invalid=report();
 invalid.lines[0].sku='OTHER';
 assert.throws(()=>validateCartReview(invalid,job),InvalidCartReview);
 const wrong=report();wrong.lines[0].responseStatus=500;
 assert.throws(()=>validateCartReview(wrong,job),InvalidCartReview);
});
