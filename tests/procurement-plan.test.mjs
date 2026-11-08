import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

function dataUrl(source){
 const js=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
 }}).outputText;
 return 'data:text/javascript;base64,'+Buffer.from(js).toString('base64');
}
const matchingSource=await readFile(new URL('../app/lib/supplier-matching.ts',import.meta.url),'utf8');
const matchingUrl=dataUrl(matchingSource);
const plannerSource=(await readFile(new URL('../app/lib/procurement-plan.ts',import.meta.url),'utf8'))
 .replaceAll("from './supplier-matching';","from '"+matchingUrl+"';");
const {planProcurement}=await import(dataUrl(plannerSource));
const order={id:'92',status:'confirmed',total:2600,items:[
 {productId:101,sku:'RPM-101',name:'Wastegate',qty:2,unitPrice:600,options:{}},
 {productId:102,sku:'RPM-102',name:'Turbo',qty:1,unitPrice:1400,options:{}},
]};
const offer=(id,productId,extra={})=>({
 id,supplier:'fmic',supplierSku:'F-'+id,brand:'Turboworks',mpn:'P-'+id,ean:'',
 name:'Item '+id,variant:'',purchaseNet:320,shippingNet:25,currency:'PLN',
 available:true,leadDays:3,productId,matchStatus:'confirmed',...extra,
});
const offers=[offer(1,101),offer(2,102,{purchaseNet:700})];

test('chooses verified supplier offers by per-unit net cost and shipping',()=>{
 const plan=planProcurement(order,[...offers,offer(3,101,{purchaseNet:290,shippingNet:100})],7);
 assert.equal(plan.canDraft,true);
 assert.deepEqual(plan.counts,{ready:2,blocked:0,needsVariantCheck:0});
 assert.equal(plan.lines[0].offerId,1);
 assert.equal(plan.lines[0].estimatedNetTotal,690);
 assert.equal(plan.lines[1].estimatedNetTotal,725);
 assert.equal(plan.totalEstimatedNet,1415);
 assert.equal(plan.lines[0].salesGrossTotal,1200);
 assert.match(plan.fingerprint,/^[a-f0-9]{64}$/);
 assert.match(plan.notes.join(' '),/wewnętrzny plan zakupu/);
});

test('unmatched, rejected, unavailable and late offers block draft creation',()=>{
 for(const reason of [
  {matchStatus:'unmatched'}, {matchStatus:'rejected'}, {available:false},
  {leadDays:20},{purchaseNet:Infinity},{currency:'USD'},
 ]){
  const plan=planProcurement(order,[offer(1,101,reason),offers[1]],7);
  assert.equal(plan.canDraft,false);
  assert.equal(plan.counts.blocked,1);
  assert.ok(plan.lines[0].blocked);
 }
});

test('draft cannot be made from unconfirmed, shipped or cancelled orders',()=>{
 for(const status of ['new','shipped','cancelled']){
  const plan=planProcurement({...order,status},offers,7);
  assert.equal(plan.canDraft,false);
  assert.equal(plan.counts.blocked,0);
 }
});

test('configuration and flange options force explicit human compatibility check',()=>{
 const configured={...order,items:[{...order.items[0],options:{Flansza:'T4 Twin Scroll'}},order.items[1]]};
 const plan=planProcurement(configured,offers,7);
 assert.equal(plan.canDraft,true);
 assert.equal(plan.counts.needsVariantCheck,1);
 assert.equal(plan.lines[0].requiresVariantCheck,true);
 assert.match(plan.notes.join(' '),/ręcznie sprawdź flansze/);
});

test('supplier stock booleans are not treated as a quantity guarantee',()=>{
 const big={...order,items:[{...order.items[0],qty:50},order.items[1]]};
 const plan=planProcurement(big,offers,7);
 assert.equal(plan.canDraft,true);
 assert.match(plan.notes.join(' '),/nie jest potwierdzoną liczbą sztuk/);
});

test('price, availability, supplier or order status changes invalidate fingerprints',()=>{
 const initial=planProcurement(order,offers,7);
 const changed=[
  planProcurement(order,[offer(1,101,{purchaseNet:321}),offers[1]],7),
  planProcurement(order,[offer(1,101,{available:false}),offers[1]],7),
  planProcurement(order,[offer(1,101,{supplier:'mtuning'}),offers[1]],7),
  planProcurement({...order,status:'processing'},offers,7),
  planProcurement(order,offers,4),
 ];
 for(const entry of changed)assert.notEqual(entry.fingerprint,initial.fingerprint);
});

test('orders with many suppliers are labelled for manual coordination',()=>{
 const plan=planProcurement(order,[offers[0],offer(2,102,{supplier:'mtuning'})],7);
 assert.deepEqual(plan.suppliers,['fmic','mtuning']);
 assert.match(plan.notes.join(' '),/kilku dostawców/);
});

test('malformed line values do not produce actionable sourcing drafts',()=>{
 const broken={...order,items:[{...order.items[0],qty:0},order.items[1]]};
 const plan=planProcurement(broken,offers,7);
 assert.equal(plan.canDraft,false);
 assert.equal(plan.counts.blocked,1);
});

test('two lines of same product remain separate so variants are never merged',()=>{
 const o={...order,items:[{...order.items[0],options:{Flansza:'T3'}},
  {...order.items[0],options:{Flansza:'V-Band'}}]};
 const plan=planProcurement(o,[offers[0]],7);
 assert.equal(plan.lines.length,2);
 assert.equal(plan.lines[0].index,0);
 assert.equal(plan.lines[1].index,1);
 assert.equal(plan.counts.needsVariantCheck,2);
});
