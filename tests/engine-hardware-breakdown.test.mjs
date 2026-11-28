import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function load(name){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/engine-hardware/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});return exports}
const {diagrams}=load('catalog'),{allConnections,m54Breakdown,connectionRows,connectionForPosition,groupSections}=load('m54-breakdown');
test('M54 research tree maps every reference row once, without pretending coverage',()=>{
 assert.equal(m54Breakdown.length,5);assert.equal(allConnections.length,58);
 assert.equal(new Set(allConnections.map(c=>c.id)).size,allConnections.length);
 const keys=[];
 for(const c of allConnections){const rows=connectionRows(c,diagrams);if(!c.diagramId){assert.equal(rows.length,0);assert.equal(c.positions,undefined);continue}assert.equal(rows.length,c.positions.length);for(const row of rows){keys.push(c.diagramId+':'+row.position);assert.equal(connectionForPosition(c.diagramId,row.position).id,c.id)}}
 assert.equal(keys.length,49);assert.equal(new Set(keys).size,keys.length);assert.equal(allConnections.filter(c=>connectionRows(c,diagrams).length).length,34);
});
test('unmapped connection does not inherit parts from a similar assembly',()=>{assert.equal(connectionRows(allConnections.find(c=>c.id==='pump-pickup'),diagrams).length,0)});

test('whole group retains every mapped position, unknown joints and distinct diagram identity',()=>{
 const groups=m54Breakdown.map(g=>groupSections(g,diagrams));
 assert.equal(groups.flat().flatMap(s=>s.rows).length,49);
 const block=groupSections(m54Breakdown.find(g=>g.id==='block'),diagrams);
 assert.equal(block.length,10);assert.equal(block.flatMap(s=>s.rows).length,7);
 const oil=groupSections(m54Breakdown.find(g=>g.id==='oil'),diagrams);
 assert.ok(new Set(oil.filter(s=>s.rows.length).map(s=>s.diagram.id)).size>1);
 assert.ok(oil.some(s=>s.rows.length===0));
 const keys=groups.flat().flatMap(s=>s.rows.map(r=>s.diagram.id+':'+r.position));
 assert.equal(new Set(keys).size,keys.length);
});

test('core engine checklist excludes external equipment, manifolds and drivetrain interfaces',()=>{assert.equal(m54Breakdown.map(g=>g.id).join(','),'block,crank,head,timing,oil');for(const id of ["knock","damper","flywheel","clutch","crank-sensor","head-lift","spark","cover-ground","head-nut-12","cam-sensors","filter-sensor","pan-gearbox","oil-level","dipstick"])assert.ok(!allConnections.some(c=>c.id===id));assert.ok(allConnections.some(c=>c.id==='crank-hub'));assert.ok(allConnections.some(c=>c.id==='vanos-line'));assert.ok(allConnections.some(c=>c.id==='filter-short'));});
