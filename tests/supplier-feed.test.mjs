import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

async function importPureTs(path){
 const source=await readFile(new URL(path,import.meta.url),'utf8');
 const transpiled=ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}
 }).outputText;
 return import('data:text/javascript;base64,'+Buffer.from(transpiled).toString('base64'));
}
const {previewSupplierCsv}=await importPureTs('../src/lib/supplier-csv-preview.ts');
const {planSupplierFeed,validSupplierFeedOptions}=await importPureTs('../app/lib/supplier-feed.ts');
const options={supplier:'fmic',shippingNet:15,leadDays:3,pricesNetPLNConfirmed:true};
const raw='sku;brand;ean;mpn;nazwa;cena;stan;wariant\nA1;Pulsar;5901234567890;T100;Turbo;1250,50;3;T3\nA2;Pulsar;5901234567891;T200;Wastegate;230,00;0;V-Band';
const parsed=previewSupplierCsv(raw);

function offered(id,sku,extra={}){
 return {id,supplier:'fmic',supplierSku:sku,brand:'Pulsar',mpn:'T100',
  ean:'5901234567890',name:'Turbo',variant:'T3',purchaseNet:900,
  shippingNet:15,currency:'PLN',available:true,leadDays:3,
  productId:45,matchStatus:'confirmed',...extra};
}

test('stages CSV rows without linking them or publishing shop products',()=>{
 const plan=planSupplierFeed(parsed,[],options);
 assert.equal(plan.canImport,true);
 assert.deepEqual(plan.counts,{create:2,update:0,unchanged:0});
 assert.deepEqual(plan.changes.map(x=>x.available),[true,false]);
 assert.equal(plan.changes[0].purchaseNet,1250.5);
 assert.equal(plan.changes[0].brand,'Pulsar');
 assert.equal(plan.changes[0].matchStatus,'unmatched');
 assert.equal(plan.changes[0].productId,null);
 assert.match(plan.fingerprint,/^[a-f0-9]{64}$/);
});

test('price and availability refresh preserves a manually confirmed link',()=>{
 const plan=planSupplierFeed(parsed,[offered(12,'A1')],options);
 assert.equal(plan.canImport,true);
 assert.deepEqual(plan.counts,{create:1,update:1,unchanged:0});
 const changed=plan.changes.find(x=>x.supplierSku==='A1');
 assert.equal(changed.productId,45);
 assert.equal(changed.matchStatus,'confirmed');
 assert.equal(changed.purchaseNet,1250.5);
});

test('a changed EAN or variant blocks overwriting confirmed offers',()=>{
 const existing=[offered(1,'A1',{ean:'9999999999999'})];
 const plan=planSupplierFeed(parsed,existing,options);
 assert.equal(plan.canImport,false);
 assert.match(plan.issues.map(e=>e.message).join(' '),/sprawdź ręcznie powiązanie/);
 assert.equal(plan.changes.some(x=>x.supplierSku==='A1'),false);
});

test('missing stock data blocks imports instead of assuming availability',()=>{
 const p=previewSupplierCsv('sku;name;price\nA;Turbo;500');
 const plan=planSupplierFeed(p,[],options);
 assert.equal(plan.canImport,false);
 assert.ok(plan.totalIssues>=1);
 assert.match(plan.issues.map(i=>i.message).join(' '),/stanu magazynowego/);
});

test('multiple variants with the same supplier SKU cannot overwrite one another',()=>{
 const p=previewSupplierCsv('sku;name;price;stock;variant\nX1;Turbo;100;1;T3\nX1;Turbo;200;1;T4');
 assert.equal(p.duplicates.length,0,'CSV parser allows different variants in its preview');
 const plan=planSupplierFeed(p,[],options);
 assert.equal(plan.canImport,false);
 assert.match(plan.issues.map(i=>i.message).join(' '),/Powtórzone SKU/);
});

test('CSV validation errors and duplicate records prevent partial imports',()=>{
 const p=previewSupplierCsv('sku;name;price;stock\nZ;One;100;1\nZ;Other;101;1\nQ;Invalid;abc;1');
 const plan=planSupplierFeed(p,[],options);
 assert.equal(plan.canImport,false);
 assert.equal(plan.totalIssues,2);
 assert.equal(plan.counts.create,1);
});

test('changing existing offer state invalidates old preview fingerprints',()=>{
 const a=planSupplierFeed(parsed,[offered(1,'A1')],options);
 const b=planSupplierFeed(parsed,[offered(1,'A1',{purchaseNet:999})],options);
 assert.notEqual(a.fingerprint,b.fingerprint);
});

test('explicit net-PLN confirmation and valid shipping costs are required',()=>{
 assert.equal(validSupplierFeedOptions(options),true);
 assert.equal(validSupplierFeedOptions({...options,shippingNet:-1}),false);
 assert.equal(validSupplierFeedOptions({...options,leadDays:1.5}),false);
 const withoutConfirmation=planSupplierFeed(parsed,[],{...options,pricesNetPLNConfirmed:false});
 assert.equal(withoutConfirmation.canImport,false);
});

test('uppercase/lowercase supplier SKUs resolve to the existing canonical SKU',()=>{
 const p=previewSupplierCsv('sku;name;price;stock\na1;Turbo;100;2');
 const plan=planSupplierFeed(p,[offered(1,'A1')],options);
 assert.equal(plan.canImport,true);
 assert.equal(plan.changes[0].supplierSku,'A1');
});
