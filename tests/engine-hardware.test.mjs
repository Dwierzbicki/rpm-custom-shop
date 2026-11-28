import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/engine-hardware/catalog.ts',import.meta.url),'utf8');
const exports={};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {families,parts,diagrams,diagramsFor,partByOem,canSell,hasLicensedImage,matches,searchEngineParts}=exports;
test('exact requested engine variants, no borrowed fitments',()=>{
 assert.equal(families.flatMap(f=>f.versions).length,20);
 assert.equal(diagramsFor('M54B25').length,0);
 assert.equal(diagramsFor('2JZ-GE VVT-i').length,0);
 assert.equal(diagramsFor('M54B30').length,8);
});
test('OEM identity is unique but usages may repeat',()=>{
 assert.equal(new Set(parts.map(p=>p.oem)).size,parts.length);
 for(const d of diagrams){assert.equal(new Set(d.usages.map(u=>u.position)).size,d.usages.length);for(const u of d.usages){assert.ok(partByOem(u.oem));assert.ok(Number.isInteger(u.quantity)&&u.quantity>0)}}
 assert.equal(diagrams.flatMap(d=>d.usages).filter(u=>u.oem==='07119905391').length,2);
});
test('no pilot row may be sold or show an unlicensed drawing',()=>{
 for(const d of diagrams){assert.equal(hasLicensedImage(d),false);for(const u of d.usages)assert.equal(canSell(partByOem(u.oem),u),false)}
 const p=parts[0],u=diagrams[0].usages[0];
 assert.equal(canSell({...p,sku:'TEST',technicalEvidence:'test'},u),false);
 assert.equal(hasLicensedImage({...diagrams[0],image:{path:'https://example.com/oem.png',rightsEvidence:'test'}}),false);
 assert.equal(matches(p,u,'07119905391'),true);
});

test('M54B30 preview keeps individual facts and set quantities scoped to their source',()=>{assert.equal(parts.length,36);assert.equal(diagrams.flatMap(d=>d.usages).length,39);const head=diagrams.find(d=>d.id==='11_9908').usages.find(u=>u.position==='05');assert.equal(head.quantity,1);assert.equal(head.quantityUnit,'set');assert.equal(partByOem(head.oem).unit,'set');assert.equal(searchEngineParts(diagrams,parts,'11 24 7 589 671')[0].usage.quantity,12);assert.ok(searchEngineParts(diagrams,parts,'M9x47').some(x=>x.part.oem==='11247589671'));assert.equal(searchEngineParts(diagrams,parts,'').length,0)});
