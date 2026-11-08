import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import ts from 'typescript';

// This test may modify and delete rows: it ONLY runs against the disposable
// PostgreSQL service configured in GitHub Actions, never a production DATABASE_URL.
const connection=process.env.DATABASE_URL??'';
if(!/^postgres(?:ql)?:\/\/rpm_test:test_password@(?:localhost|127\.0\.0\.1):5432\/rpm_test$/.test(connection)){
 throw new Error('Refusing integration tests without disposable local rpm_test PostgreSQL');
}

// Tiny test-only CommonJS loader for our TS modules (no extra runtime package).
const require=createRequire(import.meta.url);
require.extensions['.ts']=(module,filename)=>{
 const compiled=ts.transpileModule(readFileSync(filename,'utf8'),{
  fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 module._compile(compiled,filename);
};
const {
 readProcurement,saveProcurementDraft,changeProcurement,
 ProcurementNotFound,ProcurementConflict,ProcurementInvalid,
}=require(fileURLToPath(new URL('../../app/lib/procurement-db.ts',import.meta.url)));
const {getDbPool}=require(fileURLToPath(new URL('../../app/lib/db.ts',import.meta.url)));

const allChecks={stock:true,price:true,variants:true,manualOnly:true};
function makeOffer(sku,productId,price=220){
 return {
  supplier:'fmic',supplierSku:sku,productId,
  brand:'Test Supplier',name:'Test part '+sku,mpn:'P-'+productId,ean:'',
  variant:'',purchaseNet:price,shippingNet:16,currency:'PLN',
  available:true,leadDays:3,matchStatus:'confirmed',
 };
}
const makeLine=(id)=>({
 productId:id,sku:'RPM-CI-'+id,name:'Test turbo',qty:2,unitPrice:799,
 options:{Flansza:'T3'},
});

test('PostgreSQL state machine: draft, approve, manual placement and conflicts',async t=>{
 const pool=getDbPool();
 const orderIds=[];
 const offerIds=[];
 const skuPrefix='CI-'+Date.now()+'-';
 try{
  // Ensure the same schema used by production, not an independently reimplemented fixture.
  await assert.rejects(readProcurement('999999999999999999'),ProcurementNotFound);

  async function seed(productId,status='confirmed'){
   const {rows:[order]}=await pool.query(
    "INSERT INTO rpm_orders(customer,items,total,status) VALUES($1::jsonb,$2::jsonb,$3,$4) RETURNING id::text AS id",
    [JSON.stringify({name:'CI',email:'test@invalid.local'}),
     JSON.stringify([makeLine(productId)]),1598,status],
   );
   orderIds.push(order.id);
   const draft=makeOffer(skuPrefix+productId,productId);
   const offers=await pool.query(
    'INSERT INTO rpm_supplier_offers(supplier,supplier_sku,data) VALUES($1,$2,$3::jsonb) RETURNING id',
    [draft.supplier,draft.supplierSku,JSON.stringify(draft)],
   );
   offerIds.push(offers.rows[0].id);
   return {id:order.id,offerId:offers.rows[0].id};
  }

  await t.test('only one draft per order; approval and manual placement require explicit checks',async()=>{
   const order=await seed(90001);
   const initial=await readProcurement(order.id);
   assert.equal(initial.plan.canDraft,true);
   assert.equal(initial.procurement,null);
   assert.equal(initial.plan.lines[0].supplierSku,skuPrefix+90001);

   const draft=await saveProcurementDraft(order.id,initial.plan.fingerprint);
   assert.equal(draft.status,'draft');
   const duplicated=await saveProcurementDraft(order.id,initial.plan.fingerprint);
   assert.equal(duplicated.id,draft.id);
   const count=await pool.query('SELECT count(*)::integer AS n FROM rpm_supplier_procurements WHERE order_id=$1',[order.id]);
   assert.equal(count.rows[0].n,1);

   await assert.rejects(
    changeProcurement(order.id,'approve',draft.fingerprint,{stock:true}),
    ProcurementInvalid,
   );
   const approved=await changeProcurement(order.id,'approve',draft.fingerprint,allChecks);
   assert.equal(approved.status,'approved');
   assert.ok(approved.approvedAt);
   await assert.rejects(saveProcurementDraft(order.id,initial.plan.fingerprint),ProcurementConflict);
   await assert.rejects(changeProcurement(order.id,'approve',draft.fingerprint,allChecks),ProcurementConflict);
   await assert.rejects(changeProcurement(order.id,'mark_placed',draft.fingerprint,{}),ProcurementInvalid);

   const placed=await changeProcurement(order.id,'mark_placed',draft.fingerprint,
    {manualPlaced:true},'FMIC-TEST-10001');
   assert.equal(placed.status,'placed_manually');
   assert.equal(placed.manualReference,'FMIC-TEST-10001');
   assert.ok(placed.placedAt);
   await assert.rejects(changeProcurement(order.id,'mark_placed',draft.fingerprint,
    {manualPlaced:true},'FMIC-TEST-10001'),ProcurementConflict);
   await assert.rejects(changeProcurement(order.id,'recheck',draft.fingerprint,{}),ProcurementConflict);
  });

  await t.test('supplier price changes invalidate approval; recheck refreshes the snapshot',async()=>{
   const order=await seed(90002);
   const initial=(await readProcurement(order.id)).plan;
   const draft=await saveProcurementDraft(order.id,initial.fingerprint);
   const approved=await changeProcurement(order.id,'approve',draft.fingerprint,allChecks);
   assert.equal(approved.status,'approved');

   const updated=makeOffer(skuPrefix+90002,90002,300);
   await pool.query('UPDATE rpm_supplier_offers SET data=$1::jsonb,updated_at=NOW() WHERE id=$2',
    [JSON.stringify(updated),order.offerId]);

   await assert.rejects(
    changeProcurement(order.id,'mark_placed',approved.fingerprint,{manualPlaced:true},'FMIC-20002'),
    ProcurementConflict,
   );
   const changed=(await readProcurement(order.id)).plan;
   assert.notEqual(changed.fingerprint,approved.fingerprint);
   const reopened=await changeProcurement(order.id,'recheck',approved.fingerprint,{});
   assert.equal(reopened.status,'draft');
   assert.equal(reopened.fingerprint,changed.fingerprint);
   assert.equal(reopened.plan.lines[0].purchaseNet,300);
   await assert.rejects(changeProcurement(order.id,'approve',approved.fingerprint,allChecks),ProcurementConflict);
   const updatedApproval=await changeProcurement(order.id,'approve',reopened.fingerprint,allChecks);
   assert.equal(updatedApproval.status,'approved');
  });

  await t.test('cancelled orders cannot create drafts or receive approval',async()=>{
   const order=await seed(90003,'confirmed');
   const plan=(await readProcurement(order.id)).plan;
   const draft=await saveProcurementDraft(order.id,plan.fingerprint);
   await pool.query("UPDATE rpm_orders SET status='cancelled' WHERE id=$1",[order.id]);
   await assert.rejects(changeProcurement(order.id,'approve',draft.fingerprint,allChecks),ProcurementConflict);
   await assert.rejects(saveProcurementDraft(order.id,plan.fingerprint),ProcurementInvalid);
  });

  await t.test('procurement writes never create or modify the public product catalog',async()=>{
   const result=await pool.query("SELECT to_regclass('public.rpm_catalog') AS tablename");
   assert.equal(result.rows[0].tablename,null);
   const audit=await pool.query(
    "SELECT count(*)::integer AS n FROM rpm_supplier_procurements WHERE order_id=ANY($1::bigint[])",
    [orderIds],
   );
   assert.equal(audit.rows[0].n,3);
  });
 }finally{
  try{
   if(orderIds.length){
    await pool.query('DELETE FROM rpm_supplier_procurements WHERE order_id=ANY($1::bigint[])',[orderIds]);
    await pool.query('DELETE FROM rpm_orders WHERE id=ANY($1::bigint[])',[orderIds]);
   }
   if(offerIds.length)await pool.query('DELETE FROM rpm_supplier_offers WHERE id=ANY($1::integer[])',[offerIds]);
  }finally{
   await pool.end();
  }
 }
});
