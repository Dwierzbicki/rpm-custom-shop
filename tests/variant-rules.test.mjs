import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/variant-rules.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {colorCandidate,variantStatus,helColors}=m.exports;
test('color suffix preserves technical identity',()=>{
 assert.deepEqual(colorCandidate('Kolanko 45 48/70mm Zielony'),{family:'kolanko 45 48/70mm',color:'Zielony'});
 assert.notEqual(colorCandidate('Wastegate 38mm 7psi Black').family,colorCandidate('Wastegate 38mm 14psi Blue').family);
 assert.notEqual(colorCandidate('WG 38mm 2-bolt Black').family,colorCandidate('WG 38mm V-band Silver').family);
 assert.equal(colorCandidate('WG Black 14psi'),null);
 assert.equal(colorCandidate('Czarny'),null);
 assert.equal(colorCandidate('WG constructor'),null);
});
test('review remains separate from latest snapshot',()=>{
 assert.equal(variantStatus('pending',true,'a',null),'pending');
 assert.equal(variantStatus('approved',true,'a','a'),'approved');
 assert.equal(variantStatus('approved',true,'b','a'),'conflict');
 assert.equal(variantStatus('rejected',false,'a','a'),'conflict');
 assert.equal(variantStatus('rejected',true,'a','a'),'rejected');
});
test('HEL suffixes and normalized colors are unique',()=>{
 assert.equal(helColors.length,13);
 for(const i of [0,1,2,3])assert.equal(new Set(helColors.map(row=>row[i])).size,13);
});
