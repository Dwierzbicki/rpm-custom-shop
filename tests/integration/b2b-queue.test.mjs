import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import ts from 'typescript';

if(!/^postgres(?:ql)?:\/\/rpm_test:test_password@(?:localhost|127\.0\.0\.1):5432\/rpm_test$/.test(process.env.DATABASE_URL??'')){
 throw Error('This integration test requires the disposable local rpm_test PostgreSQL only');
}
const require=createRequire(import.meta.url);
require.extensions['.ts']=(module,filename)=>{
 module._compile(ts.transpileModule(readFileSync(filename,'utf8'),{
  fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText,filename);
};
const base=new URL('../../app/lib/',import.meta.url);
const {getDbPool}=require(fileURLToPath(new URL('db.ts',base)));
const {readProcurement,saveProcurementDraft,changeProcurement}=require(fileURLToPath(new URL('procurement-db.ts',base)));
const {enqueueB2BTask,cancelB2BTask,recordB2BOfflineReport,recordFmicCartReview,recordB2BAgentEvent,getB2BQueue,getB2BQueueOverview,QueueConflict}=
 require(fileURLToPath(new URL('b2b-queue-db.ts',base)));
const {createB2BFixtureJob}=require(fileURLToPath(new URL('b2b-fixture-job.ts',base)));
const pool=getDbPool();
const checks={stock:true,price:true,variants:true,manualOnly:true};
const jobReport=job=>({
 runId:'11111111-1111-4111-8111-111111111111',
 jobId:job.jobId,orderId:job.orderId,supplier:job.supplier,items:job.lines.length,
 blockedRequests:0,sentToSupplier:false,orderPlaced:false,status:'offline-simulation-only',
 durationMs:1200,trace:[
  {action:'validate_job',result:'ok',elapsedMs:0},
  {action:'populate_cart',result:'ok',elapsedMs:400},
  {action:'screenshot',result:'ok',elapsedMs:1100},
 ],image:'private-user-path.png',
});

test('PostgreSQL B2B queue: idempotence, offline reports, audit trail and conflicts',async t=>{
 const orderIds=[],offerIds=[];
 const skuPrefix='QUEUE-CI-'+Date.now()+'-';
 try{
  await assert.rejects(readProcurement('999999999999999999'));
  async function seed(suffix){
   const id=91000+suffix;
   const item={productId:id,sku:'RPM-'+id,name:'Wastegate',qty:2,unitPrice:499,options:{}};
   const order=(await pool.query(
    "INSERT INTO rpm_orders(customer,items,total,status) VALUES('{}'::jsonb,$1::jsonb,998,'confirmed') RETURNING id::text",
    [JSON.stringify([item])]
   )).rows[0].id;
   orderIds.push(order);
   for(const supplier of ['fmic','mtuning']){
    const sku=skuPrefix+supplier+'-'+suffix;
    const offer={supplier,supplierSku:sku,productId:id,name:'Oferta '+sku,brand:'Test',
     mpn:'TEST',ean:'',variant:'',purchaseNet:supplier==='fmic'?200:230,
     shippingNet:15,currency:'PLN',available:true,leadDays:2,matchStatus:'confirmed'};
    const row=await pool.query('INSERT INTO rpm_supplier_offers(supplier,supplier_sku,data) VALUES($1,$2,$3::jsonb) RETURNING id',
     [supplier,sku,JSON.stringify(offer)]);
    offerIds.push(row.rows[0].id);
   }
   const plan=(await readProcurement(order)).plan;
   assert.equal(plan.canDraft,true);
   const draft=await saveProcurementDraft(order,plan.fingerprint);
   const approved=await changeProcurement(order,'approve',draft.fingerprint,checks);
   assert.equal(approved.status,'approved');
   return {order,plan,approved};
  }
  await t.test('creates exactly one task per supplier, records no order placement',async()=>{
   const {order,plan}=await seed(1);
   const first=await enqueueB2BTask(order,'fmic',plan.fingerprint);
   assert.equal(first.created,true);
   assert.equal(first.task.status,'queued');
   const again=await enqueueB2BTask(order,'fmic',plan.fingerprint);
   assert.equal(again.created,false);
   assert.equal(again.task.id,first.task.id);
   const all=await getB2BQueue(order);
   assert.equal(all.tasks.length,1);
   assert.equal(all.events.length,1);
   const overview=await getB2BQueueOverview();
   assert.ok(overview.summary.total>=1);
   assert.ok(overview.tasks.some(t=>t.id===first.task.id));
   const job=createB2BFixtureJob(plan,'fmic');
   const report=await recordB2BOfflineReport(order,'fmic',plan.fingerprint,jobReport(job));
   assert.equal(report.newReport,true);
   assert.equal(report.task.status,'offline_reported');
   const duplicated=await recordB2BOfflineReport(order,'fmic',plan.fingerprint,jobReport(job));
   assert.equal(duplicated.newReport,false);
   const after=await getB2BQueue(order);
   assert.equal(after.events.filter(event=>event.event==='offline_reported').length,1);
   assert.equal(after.events.find(event=>event.event==='offline_reported').trace.length,3);
   await assert.rejects(recordB2BOfflineReport(order,'mtuning',plan.fingerprint,jobReport(job)));
   const localCart={
    runId:'22222222-2222-4222-8222-222222222222',
    jobId:job.jobId,orderId:job.orderId,supplier:'fmic',
    status:'cart-verified-needs-human-approval',
    lines:job.lines.map(line=>({
     action:'add_to_cart',sku:line.supplierSku,qty:line.quantity,
     responseStatus:200,result:'requested',
    })),
    cartVerification:{ok:true,issues:[],verifiedLines:job.lines.length,
     calculatedGrossPLN:540,observedSubtotalGrossPLN:540},
    cartAddRequests:job.lines.length,blockedRequests:4,durationMs:1580,
    screenshot:'LOCAL-ONLY-PRIVATE-IMAGE.png',
    orderPlaced:false,orderSubmitted:false,note:'Koszyk do ręcznej kontroli',
   };
   const cartRecord=await recordFmicCartReview(order,'fmic',plan.fingerprint,localCart);
   assert.equal(cartRecord.newReport,true);
   assert.equal(cartRecord.verdict,'verified');
   const duplicateCart=await recordFmicCartReview(order,'fmic',plan.fingerprint,localCart);
   assert.equal(duplicateCart.newReport,false);
   const cartRows=(await getB2BQueue(order)).cartReviews;
   assert.equal(cartRows.length,1);
   assert.equal(cartRows[0].verdict,'verified');
   assert.ok(!JSON.stringify(cartRows).includes('PRIVATE-IMAGE'));
   const monitored=(await getB2BQueueOverview()).cartReviews;
   assert.ok(monitored.some(row=>row.id===cartRows[0].id));
   const agentEvent=(runId,seq,phase,mode='inspect',stepIndex=null)=>({
    orderId:order,supplier:'fmic',jobId:job.jobId,
    fingerprint:plan.fingerprint,runId,seq,phase,mode,stepIndex,
   });
   const run='33333333-3333-4333-8333-333333333333';
   const started=await recordB2BAgentEvent(agentEvent(run,1,'started'));
   assert.equal(started.created,true);
   const duplicate=await recordB2BAgentEvent(agentEvent(run,1,'started'));
   assert.equal(duplicate.created,false);
   await assert.rejects(recordB2BAgentEvent(agentEvent(
    '44444444-4444-4444-8444-444444444444',1,'started')),QueueConflict);
   await assert.rejects(recordB2BAgentEvent(agentEvent(run,3,'inspected','inspect',0)),QueueConflict);
   await recordB2BAgentEvent(agentEvent(run,2,'inspect_product','inspect',0));
   await recordB2BAgentEvent(agentEvent(run,3,'inspected','inspect',0));
   await recordB2BAgentEvent(agentEvent(run,4,'completed_readonly'));
   const runCart='55555555-5555-4555-8555-555555555555';
   await recordB2BAgentEvent(agentEvent(runCart,1,'started','cart-only'));
   await recordB2BAgentEvent(agentEvent(runCart,2,'inspect_product','cart-only',0));
   await recordB2BAgentEvent(agentEvent(runCart,3,'inspected','cart-only',0));
   await recordB2BAgentEvent(agentEvent(runCart,4,'cart_add','cart-only',0));
   await recordB2BAgentEvent(agentEvent(runCart,5,'cart_add_ack','cart-only',0));
   await recordB2BAgentEvent(agentEvent(runCart,6,'inspect_cart','cart-only'));
   await recordB2BAgentEvent(agentEvent(runCart,7,'cart_verified','cart-only'));
   const liveEvents=(await getB2BQueueOverview()).agentEvents;
   const cartDone=liveEvents.find(x=>x.runId===runCart&&x.phase==='cart_verified');
   assert.equal(cartDone.taskId,first.task.id);
   assert.equal(cartDone.jobId,job.jobId);
   assert.ok(!JSON.stringify(liveEvents).includes('Authorization'));
   const cancelled=await cancelB2BTask(order,'fmic',job.jobId);
   assert.equal(cancelled.task.status,'cancelled');
   const requeued=await enqueueB2BTask(order,'fmic',plan.fingerprint);
   assert.equal(requeued.task.id,first.task.id);
   assert.equal(requeued.task.status,'queued');
   assert.equal(requeued.created,true);
   const eventCount=(await getB2BQueue(order)).events;
   assert.equal(eventCount.filter(x=>x.event==='requeued').length,1);
  });
  await t.test('changed stock or pricing cannot queue new jobs without re-approval',async()=>{
   const {order,plan}=await seed(2);
   const row=await pool.query(`SELECT id,data FROM rpm_supplier_offers
    WHERE data->>'productId'='91002' AND supplier='fmic'`);
   const updated={...row.rows[0].data,purchaseNet:201};
   await pool.query('UPDATE rpm_supplier_offers SET data=$1::jsonb WHERE id=$2',
    [JSON.stringify(updated),row.rows[0].id]);
   await assert.rejects(enqueueB2BTask(order,'fmic',plan.fingerprint),QueueConflict);
   const reopened=await changeProcurement(order,'recheck',plan.fingerprint,{});
   const reapproved=await changeProcurement(order,'approve',reopened.fingerprint,checks);
   assert.notEqual(reapproved.fingerprint,plan.fingerprint);
   const result=await enqueueB2BTask(order,'fmic',reapproved.fingerprint);
   assert.equal(result.created,true);
  });
  await t.test('placed manually disallows new queue tasks',async()=>{
   const {order,plan}=await seed(3);
   await changeProcurement(order,'mark_placed',plan.fingerprint,{manualPlaced:true},'FMIC-TEST-456');
   await assert.rejects(enqueueB2BTask(order,'fmic',plan.fingerprint),QueueConflict);
  });
 }finally{
  try{
   if(orderIds.length){
    await pool.query('DELETE FROM rpm_b2b_agent_events WHERE task_id IN (SELECT id FROM rpm_b2b_tasks WHERE order_id=ANY($1::bigint[]))',[orderIds]);
    await pool.query('DELETE FROM rpm_b2b_cart_reviews WHERE task_id IN (SELECT id FROM rpm_b2b_tasks WHERE order_id=ANY($1::bigint[]))',[orderIds]);
    await pool.query('DELETE FROM rpm_b2b_task_events WHERE task_id IN (SELECT id FROM rpm_b2b_tasks WHERE order_id=ANY($1::bigint[]))',[orderIds]);
    await pool.query('DELETE FROM rpm_b2b_tasks WHERE order_id=ANY($1::bigint[])',[orderIds]);
    await pool.query('DELETE FROM rpm_supplier_procurements WHERE order_id=ANY($1::bigint[])',[orderIds]);
    await pool.query('DELETE FROM rpm_orders WHERE id=ANY($1::bigint[])',[orderIds]);
   }
   if(offerIds.length)await pool.query('DELETE FROM rpm_supplier_offers WHERE id=ANY($1::int[])',[offerIds]);
  }finally{await pool.end()}
 }
});
