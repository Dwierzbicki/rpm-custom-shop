import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function load(name,deps={}){const exports={};vm.runInNewContext(ts.transpileModule(read('app/engine-hardware/'+name+'.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URLSearchParams,require(n){assert.ok(n in deps);return deps[n]}});return exports}
const catalog=load('catalog'),breakdown=load('m54-breakdown'),report=load('report-data',{'./m54-breakdown':breakdown});
const options={engine:'M54B30',profileId:'',revision:null,profiles:[],parts:catalog.parts,diagrams:catalog.diagrams};
test('report includes all engine rows independent of browsing and preserves units without summing across diagrams',()=>{
 const r=report.buildHardwareReport(options);assert.ok(r);assert.equal(r.groups.length,17);assert.equal(r.usageCount,85);assert.equal(r.uniqueOem,78);assert.equal(r.unresolvedPartCount,0);assert.equal(r.gaps.reduce((n,g)=>n+g.items.length,0),4);
 const rows=r.groups.flatMap(g=>g.rows);assert.equal(rows.filter(x=>x.usage.oem==='07119905391').length,2);assert.equal(rows.find(x=>x.usage.oem==='11121740065').usage.quantityUnit,'set');assert.ok(!('totalQuantity' in r));
});
test('report rejects unsupported preview engine and mismatched release profiles',()=>{
 assert.equal(report.buildHardwareReport({...options,engine:'M54B25'}),null);
 assert.equal(report.buildHardwareReport({...options,revision:'test',profileId:'bad'}),null);
 const profiles=[{id:'p1',engine:'M54B30'},{id:'p2',engine:'M54B25'}];
 const diagrams=[{...catalog.diagrams[0],profileId:'p1'},{...catalog.diagrams[1],profileId:'p2'}];
 const r=report.buildHardwareReport({...options,revision:'test',profileId:'p1',profiles,diagrams});assert.equal(r.groups.length,1);assert.equal(r.gaps.length,0);
 assert.equal(report.buildHardwareReport({...options,revision:'test',profileId:'p2',profiles,diagrams}),null);
});
test('PDF view is explicit about print, preview protection and missing data',()=>{
 const page=read('app/engine-hardware/report/page.tsx'),css=read('app/engine-hardware/report/report.css'),button=read('app/engine-hardware/report/PrintReportButton.tsx');
 assert.ok(page.includes("process.env.ENGINE_HARDWARE_PREVIEW!=='1'"));assert.ok(page.includes('KATALOG NIEKOMPLETNY'));assert.ok(page.includes('nie sumujemy'));assert.ok(css.includes('@page{size:A4'));assert.ok(css.includes('display:table-header-group'));assert.ok(button.includes('window.print()'));assert.equal(report.hardwareReportHref('M54B30','','pl'),'/engine-hardware/report?engine=M54B30&lang=pl');
});

test('report omits out-of-scope and unresolved peripheral positions',()=>{const r=report.buildHardwareReport(options);const rows=r.groups.flatMap(g=>g.rows);for(const oem of ["11721742644","07119904992","07119905544"])assert.ok(!rows.some(x=>x.usage.oem===oem));assert.ok(!r.gaps.some(g=>['intake','exhaust','cooling','accessory'].includes(g.id)));});

test('VANOS oil line total appears only once and grouped cam counts are not duplicated',()=>{const r=report.buildHardwareReport(options),rows=r.groups.flatMap(g=>g.rows);assert.equal(rows.filter(x=>x.usage.oem==='32416852469').length,1);assert.equal(rows.find(x=>x.usage.oem==='32416852469').usage.quantity,2);assert.equal(rows.find(x=>x.usage.oem==='32411093596').usage.quantity,4);assert.equal(rows.filter(x=>x.usage.oem==='11617545279').length,1);assert.ok(r.reviewed.some(c=>c.id==='filter-line'));assert.ok(!r.gaps.flatMap(g=>g.items).some(c=>c.id==='filter-line'));});

test('measurement list retains source variant and does not invent dimensions; coolant drain plug occurs once',()=>{const r=report.buildHardwareReport(options);assert.ok(r.missingDimensions.length>0);assert.ok(r.missingDimensions.every(x=>(!x.part?.dimension.trim()||x.part.dimensionStatus==='partial')&&x.source&&x.vehicle));const rows=r.groups.flatMap(g=>g.rows);assert.equal(rows.filter(x=>x.usage.oem==='07119904539').length,1);const washer=rows.find(x=>x.usage.oem==='07119963200');assert.equal(washer.part.dimension,'A14 × 18-AL');assert.equal(washer.usage.quantity,1);assert.equal(report.buildHardwareReport({...options,engine:'M54B22'}),null);});

test('partial dimensions stay on the measurement list and are not treated as full specifications',()=>{const r=report.buildHardwareReport(options);for(const oem of ['11211720633','11361436675','11361432373','11131740000','11361748745']){const row=r.missingDimensions.find(x=>x.usage.oem===oem);assert.ok(row);assert.equal(row.part.dimensionStatus,'partial');assert.ok(row.part.technicalEvidence.includes('https://'));}});
