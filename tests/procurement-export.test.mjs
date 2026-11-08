import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const source=await readFile(new URL('../app/lib/procurement-export.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText;
const {safeCsvCell,groupSupplierPurchases,makeSupplierCsv}=await import(
 'data:text/javascript;base64,'+Buffer.from(js).toString('base64')
);

const line=(index,supplier,extra={})=>({
 index,productId:index+10,sku:'RPM-'+index,name:'Produkt '+index,qty:2,
 options:{Flansza:'T4; Twin "Scroll"'},supplier,
 supplierSku:'SKU-'+index,offerId:20+index,offerName:'Oferta '+index,
 leadDays:3,purchaseNet:100.5,shippingNet:12,
 estimatedNetTotal:225,salesGrossTotal:400,
 blocked:null,requiresVariantCheck:true,...extra,
});
const plan={
 orderId:'99',orderStatus:'confirmed',lines:[
  line(0,'mtuning'),line(1,'fmic'),line(2,'mtuning',{qty:1,estimatedNetTotal:112.5}),
 ],
 counts:{ready:3,blocked:0,needsVariantCheck:3},
 suppliers:['fmic','mtuning'],totalEstimatedNet:562.5,
 maxLeadDays:7,fingerprint:'a'.repeat(64),canDraft:true,notes:[],
};

test('groups an approved plan per supplier, without mixing order lines',()=>{
 const groups=groupSupplierPurchases(plan);
 assert.deepEqual(groups.map(g=>g.supplier),['fmic','mtuning']);
 assert.deepEqual(groups.map(g=>g.itemCount),[2,3]);
 assert.deepEqual(groups.map(g=>g.estimatedNetTotal),[225,337.5]);
 assert.deepEqual(groups[1].lines.map(l=>l.index),[0,2]);
});

test('exports one spreadsheet for supplier and retains explicit variants',()=>{
 const exported=makeSupplierCsv(plan,'mtuning');
 assert.equal(exported.filename,'rpm-zakup-99-mtuning.csv');
 assert.ok(exported.csv.startsWith('\uFEFF'));
 assert.ok(exported.csv.includes('"SKU-0"'));
 assert.ok(exported.csv.includes('"SKU-2"'));
 assert.ok(!exported.csv.includes('"SKU-1"'),'no other supplier entries');
 assert.ok(exported.csv.includes('"Flansza: T4; Twin ""Scroll"""'));
 assert.ok(exported.csv.includes('"100,50"'));
 assert.ok(exported.csv.includes('"225,00"'));
 assert.ok(exported.csv.includes('DO WERYFIKACJI'));
 assert.equal(exported.count,3);
 assert.equal(exported.estimatedNetTotal,337.5);
});

test('supplier exports cannot contain customer personal data',()=>{
 const exported=makeSupplierCsv({...plan,customer:{
  email:'user@example.com',phone:'123456789',address:'Sekretna 11',
 }},'fmic');
 for(const phrase of ['user@example.com','Sekretna 11','123456789']){
  assert.ok(!exported.csv.includes(phrase));
 }
});

test('neutralizes spreadsheet formula injection and escapes double-quotes',()=>{
 for(const payload of ['=HYPERLINK("https://bad")','+123','-2+3','@SUM(A1)',
  '   =2+2','\t=2+2','\r\n=1+1']){
  assert.ok(safeCsvCell(payload).startsWith('"\''),payload);
 }
 assert.equal(safeCsvCell('abc"def'),'"abc""def"');
 const modified={...plan,lines:[line(0,'fmic',{
  supplierSku:'=2+2',offerName:'=cmd|/C calc',
 })]};
 const sheet=makeSupplierCsv(modified,'fmic').csv;
 assert.ok(sheet.includes('"\'=2+2"'));
 assert.ok(sheet.includes('"\'=cmd|/C calc"'));
});

test('blocks exports with missing offers, incomplete prices, bad status or unknown supplier',()=>{
 const cases=[
  {...plan,canDraft:false},
  {...plan,counts:{ready:2,blocked:1,needsVariantCheck:3}},
  {...plan,lines:[line(0,'unknown')]},
  {...plan,lines:[line(0,'fmic',{purchaseNet:null})]},
  {...plan,lines:[line(0,'fmic',{blocked:'Brak oferty'})]},
 ];
 for(const candidate of cases)assert.throws(()=>groupSupplierPurchases(candidate));
 assert.throws(()=>makeSupplierCsv(plan,'another'));
 assert.throws(()=>makeSupplierCsv({...plan,orderId:'../12'},'fmic'));
});
