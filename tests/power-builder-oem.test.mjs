import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/lib/power-builder-oem.ts',import.meta.url),'utf8');
const exports={};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {oemReferences}=exports;
test('OEM references are scoped to exact reviewed engines and component groups',()=>{
 assert.ok(oemReferences('m52b25tu','bearings-rod','stock').some(r=>r.number==='11241284850'));
 assert.ok(oemReferences('m52b25tu','rings','stock').some(r=>r.number==='11251437077'));
 assert.ok(oemReferences('m54b30','bearings-main','stock').some(r=>r.number==='11211706847'));
 for(const version of ['m52b25','m50b30-stroker','2jz-ge','__proto__'])assert.equal(oemReferences(version,'bearings-rod','stock').length,0);
 assert.equal(oemReferences('m52b25tu','rings','forged').length,0);
 assert.equal(oemReferences('m54b30','rings','stock').length,0);
 assert.equal(oemReferences('m54b30','__proto__','stock').length,0);
 for(const ref of oemReferences('m52b25tu','rings','stock'))assert.ok(ref.source.startsWith('https://www.realoem.com/'));
});
