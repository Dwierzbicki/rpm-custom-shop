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
 const r=report.buildHardwareReport(options);assert.ok(r);assert.equal(r.groups.length,8);assert.equal(r.usageCount,39);assert.equal(r.uniqueOem,36);assert.equal(r.unresolvedPartCount,0);assert.equal(r.gaps.reduce((n,g)=>n+g.items.length,0),79);
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
