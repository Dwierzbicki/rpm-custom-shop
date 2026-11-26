import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const modules=new Map();
function load(name){if(modules.has(name))return modules.get(name).exports;const m={exports:{}};modules.set(name,m);new Function('exports','module','require',ts.transpileModule(fs.readFileSync(new URL('../app/lib/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m,s=>load(s.slice(2)));return m.exports}
const {siliconeChoice,siliconeAlternatives}=load('silicone-dimensions');
const row=(angle,diameter,color='Czarny',suffix='B',kind='straight')=>({sku:String(angle).padStart(4,'0')+diameter+(kind==='straight'?'00':'')+'-'+suffix,name:(kind==='straight'?'Kolanko silikonowe':'Silikonowe kolanko redukcyjne')+" "+angle+"' "+diameter+'mm '+color,category:['Układ dolotowy','Łączniki silikonowe',(kind==='straight'?'Kolanka silikonowe ':'Kolanka redukcyjne ')+angle+'°'],brand:'',price:'42',available:true});
test('real FMIC syntax and SKU identity must agree',()=>{const r=row(45,'51');assert.equal(siliconeChoice(r).angle,45);assert.equal(siliconeChoice({...r,sku:'00455700-B'}),null);assert.equal(siliconeChoice({...r,category:['other']}),null);assert.equal(siliconeChoice({...r,name:r.name+' extra'}),null);assert.equal(siliconeChoice(row(45,'51/57','Czarny','B','reducer')).diameter,'51/57')});
test('angle and diameter preserve colour and kind, no fictional combinations',()=>{const current=row(45,'51');const a=siliconeAlternatives(current,[current,row(90,'51'),row(45,'57'),row(90,'57'),row(45,'51','Niebieski','N'),row(45,'51/57','Czarny','B','reducer'),{...row(45,'60'),brand:'other'}]);assert.deepEqual(a.angles.map(x=>x.angle),[45,90]);assert.deepEqual(a.diameters.map(x=>x.diameter),['51','57']);assert.equal(siliconeAlternatives(current,[row(90,'51')]),null);assert.equal(siliconeAlternatives(current,[current,current]),null)});
