import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/lib/motolab-build-evidence.ts',import.meta.url),'utf8');
const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL});
const {buildEvidenceFor,evidenceVersions}=exports;
const entry={kind:'engine',version:'m50b25',configuration:'M50B29 / M44',variant:'VANOS',block:'M50B25',crank:'M52B28',rods:'M50 NV',pistons:'M44B19',head:'M50',boreMm:85,strokeMm:84,rodLengthMm:null,compressionRatio:null,notes:'Private notes'};
const approved={id:'fixture',status:'approved',sourceUrl:'https://turbobmw.pl/viewtopic.php?t=9422',entry,reviewNote:'Private review'};
test('only approved public research is exposed, not notes or review metadata',()=>{
 const rows=buildEvidenceFor([approved,{...approved,id:'draft',status:'draft'},{...approved,id:'private',sourceUrl:'https://private.example/foo'},{...approved,id:'technical',entry:{kind:'technical'}}],'m50b25');
 assert.equal(rows.length,1);assert.equal(rows[0].pistons,'M44B19');assert.equal(rows[0].alternative,false);assert.equal(rows[0].compressionRatio,null);assert.ok(!('notes' in rows[0]));assert.ok(!('reviewNote' in rows[0]));
});
test('M50B29 can be viewed as an alternative to B30, never as exact fitment',()=>{
 assert.equal(buildEvidenceFor([approved],'m50b30-stroker')[0].alternative,true);
 assert.equal(buildEvidenceFor([approved],'2jz-gte').length,0);
 assert.equal(evidenceVersions('m50b30-stroker').length,2);
});
