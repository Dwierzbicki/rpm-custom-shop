import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/link-audit.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {classifyAuditResponse,auditCsv}=m.exports;
test('exact SKU in rendered HTML, including slash and percent',()=>{
 const sku='004548/70-G',html='<main data-rpm-audit-sku="sku=004548%2F70-G">';
 assert.equal(classifyAuditResponse(200,'basic','text/html',html,sku),'200');
 assert.match(classifyAuditResponse(200,'basic','text/html',html,'004548%2F70-G'),/brak zgodności/);
 assert.match(classifyAuditResponse(200,'basic','text/html','<h1>404</h1>',sku),/brak zgodności/);
});
test('access gate, redirects and errors are never successful',()=>{
 assert.equal(classifyAuditResponse(200,'basic','text/html','<form method="post" action="/site-access">'),'Blokada dostępu');
 assert.equal(classifyAuditResponse(0,'opaqueredirect','',''),'Przekierowanie');
 for(const code of [401,403,404,429,500,503])assert.equal(classifyAuditResponse(code,'basic','text/html',''),'HTTP '+code);
 assert.match(classifyAuditResponse(200,'basic','application/json','{}'),/nie HTML/);
});
test('CSV escapes formula injection and quotes',()=>{
 const csv=auditCsv([{id:'1',path:'/produkt/x',sku:'=1+1',result:'Błąd "test"',checkedAt:'2026-11-26'}]);
 assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"Błąd ""test"""'));
});
