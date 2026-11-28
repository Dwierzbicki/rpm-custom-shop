import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function load(name){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/engine-hardware/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});return exports}
const {diagrams}=load('catalog'),{reconcileM54}=load('m54-reconciliation');
test('reference positions are reconciled only against their exact source and conditional rows remain open',()=>{
 const r=reconcileM54(diagrams);
 assert.equal(r.reduce((n,x)=>n+x.reference,0),21);
 assert.equal(r.reduce((n,x)=>n+x.missing,0),5);
 assert.equal(r.reduce((n,x)=>n+x.variant,0),3);
 assert.equal(reconcileM54(diagrams.map(d=>({...d,source:'https://example.com/other'}))).reduce((n,x)=>n+x.reference,0),0);
});
