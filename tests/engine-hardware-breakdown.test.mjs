import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function load(name){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/engine-hardware/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});return exports}
const {diagrams}=load('catalog'),{allConnections,m54Breakdown,connectionRows,connectionForPosition}=load('m54-breakdown');
test('M54 research tree maps every reference row once, without pretending coverage',()=>{
 assert.equal(m54Breakdown.length,9);assert.equal(allConnections.length,103);
 assert.equal(new Set(allConnections.map(c=>c.id)).size,allConnections.length);
 const keys=[];
 for(const c of allConnections){const rows=connectionRows(c,diagrams);if(!c.diagramId){assert.equal(rows.length,0);assert.equal(c.positions,undefined);continue}assert.equal(rows.length,c.positions.length);for(const row of rows){keys.push(c.diagramId+':'+row.position);assert.equal(connectionForPosition(c.diagramId,row.position).id,c.id)}}
 assert.equal(keys.length,28);assert.equal(new Set(keys).size,keys.length);assert.equal(allConnections.filter(c=>connectionRows(c,diagrams).length).length,21);
});
test('unmapped connection does not inherit parts from a similar assembly',()=>{assert.equal(connectionRows(allConnections.find(c=>c.id==='pump-pickup'),diagrams).length,0)});
