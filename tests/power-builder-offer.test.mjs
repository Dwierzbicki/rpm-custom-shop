import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/lib/power-builder-offer.ts',import.meta.url),'utf8');
const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {offerTotal,renderBuildOffer}=exports;
const row={label:'Rury',product:'Rura nierdzewna',sku:'PIPE',qty:3,unitPrice:120.50,status:'Wycena wstępna',priced:true};
const snapshot={language:'pl',engine:'M52B25TU',power:350,usage:'Drift',tier:'Smart',date:'27.11.2026',parameters:[{label:'Paliwo',value:'PB98'}],groups:[{label:'Wydech',rows:[row,{...row,qty:null,priced:false},{...row,qty:2,priced:false,status:'Konflikt'}]}],issues:[]};
test('offer totals include selected quantities and exclude unpriced/conflicting rows',()=>{
 assert.equal(offerTotal(snapshot),36150);
 assert.equal(offerTotal({...snapshot,groups:[{label:'test',rows:[{...row,qty:0},{...row,unitPrice:null},{...row,qty:1.5}]}]}),0);
});
test('offer uses A4 print layout and escapes all user or supplier text',()=>{
 const html=renderBuildOffer({...snapshot,engine:'<script>alert(1)</script>',customer:'A & B',issues:['<img onerror=alert(1)>']});
 assert.ok(html.includes('@page{size:A4'));
 assert.ok(html.includes('Zapisz / drukuj PDF'));
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(html.includes('A &amp; B'));
 assert.ok(!html.includes('<script>'));
 assert.ok(!html.includes('<img onerror'));
 assert.ok(html.includes('Oferta obejmuje wyłącznie aktualnie wybrane części'));
 assert.ok(!html.includes('Konflikt'));
});

test('real storefront logo and client-only offer preserve selected totals',()=>{
 const rows=[{...row,kind:'purchase'},{...row,label:'Optional rail',kind:'optional',priced:false,qty:null,unitPrice:null},{...row,label:'Workshop mount',kind:'advice',priced:false,qty:null,unitPrice:null},{...row,label:'Excluded part',kind:'excluded',priced:false,qty:null,unitPrice:null},{...row,label:'Conflicting part',kind:'conflict',priced:false,qty:1,unitPrice:200}];
 const model={...snapshot,groups:[{label:'Fuel',rows}]};
 const html=renderBuildOffer(model);
 assert.equal(offerTotal(model),36150);
 assert.ok(html.includes('/optimized/logo.webp'));
 assert.ok(html.includes('Wybrane części'));
 for(const label of ['Optional rail','Workshop mount','Excluded part','Conflicting part','Opcjonalne modernizacje','Zalecenia warsztatowe','Pominięte w zakupach','Konflikty techniczne'])assert.ok(!html.includes(label),label);
 assert.ok(html.includes('361,50'));
 assert.ok(html.includes('Rura nierdzewna'));
});
