import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';

async function load(path, replacements=[]){
 let source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 for(const [from,to] of replacements)source=source.replace(from,to);
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
}
const {compareOptions}=await load('app/lib/fmic-filter-order.ts');
function sorted(values){return values.map(value=>({value})).sort(compareOptions).map(x=>x.value)}
test('numeric facets order ascending including decimal A/R',()=>{
 assert.deepEqual(sorted(['1.15','0.9','0.12','1.00','0.82','0']),['0','0.12','0.82','0.9','1.00','1.15']);
 assert.deepEqual(sorted(['1000 cc','440 cc','750 cc']),['440 cc','750 cc','1000 cc']);
 assert.deepEqual(sorted(['10,5','2,25','1,5']),['1,5','2,25','10,5']);
});
test('model identifiers use natural order',()=>assert.deepEqual(sorted(['PSR 6266','PSR 100','PSR 99']),['PSR 99','PSR 100','PSR 6266']));
const {fmicFacets,fmicSearchFacets}=await load('app/lib/fmic-facets.ts');
test('maximum five technical filters for turbo, unknown categories none',()=>{
 assert.equal(fmicFacets(['Silnik i turbo','Turbosprężarki tuningowe']).length,5);
 assert.deepEqual(fmicFacets([]),[]);
 assert.deepEqual(fmicFacets(['Nieznana']),[]);
});
const sharpUrl=import.meta.resolve('sharp');
const {inspectImage}=await load('app/lib/fmic-image-quality.ts',[
 ["from 'sharp'","from "+JSON.stringify(sharpUrl)],
 ["import {getDbPool} from './db';","const getDbPool=()=>{throw new Error('Database not allowed in unit tests')};"]
]);
test('image audit classifies fixtures without contacting supplier',async t=>{
 const white=await sharp({create:{width:100,height:100,channels:3,background:'#ffffff'}}).png().toBuffer();
 const dark=await sharp({create:{width:100,height:100,channels:3,background:'#222222'}}).png().toBuffer();
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original});
 const check=async (body,status=200)=>{globalThis.fetch=async()=>new Response(body,{status});return inspectImage('https://fmic.pl/test.png')};
 assert.equal((await check(white)).status,'blank');
 assert.equal((await check(dark)).status,'ok');
 assert.equal((await check('not an image')).status,'review');
 assert.equal((await check('',404)).status,'missing');
 assert.equal((await check('',503)).status,'review');
 assert.equal((await check(dark)).hash,(await check(dark)).hash);
 globalThis.fetch=async()=>{throw Error('Unexpected outbound call')};
 assert.equal((await inspectImage('https://example.org/test.png')).status,'review');
});

test('broad searches stay lightweight and category facets are unique',()=>{
 assert.deepEqual(fmicSearchFacets([]).map(f=>f.key),['producer']);
 const turbo=fmicSearchFacets(['Silnik i turbo','Turbosprężarki','Turbosprężarki tuningowe']);
 assert.equal(new Set(turbo.map(f=>f.key)).size,turbo.length);
 for(const key of ['producer','model','flange','ar','bearing'])assert.ok(turbo.some(f=>f.key===key));
 assert.match(turbo.find(f=>f.key==='ar').expression,/Turbosprężarki tuningowe.*ANY\(target_category\)/);
 assert.ok(fmicSearchFacets(['Silnik i turbo','Kute tłoki']).some(f=>f.key==='piston_bore'));
 assert.ok(!fmicSearchFacets(['Elektronika']).some(f=>['ar','flow','piston_bore'].includes(f.key)));
});
const {mergeTechnicalFields,splitTechnicalFields}=await load('app/lib/fmic-technical.ts');
test('product cards share facet values and preserve explicitly published specifications',()=>{
 const base={intro:'',warranty:'',fields:[{key:'turbine_inlet',label:'Flansza',value:'T3'}]};
 const merged=mergeTechnicalFields(base,[{key:'flange',label:'Flansza',value:'T4'},{key:'ar',label:'A/R',value:'0.82'},{key:'piston_bore',label:'Średnica tłoka (mm)',value:''}]);
 assert.deepEqual(merged.fields.map(f=>f.value),['T3','0.82']);
 const pistons=mergeTechnicalFields({intro:'',warranty:'',fields:[]},[{key:'piston_bore',label:'Średnica tłoka (mm)',value:'84.25'},{key:'compression',label:'Stopień sprężania',value:'9'}]);
 assert.deepEqual(splitTechnicalFields(pistons.fields,['Kute tłoki']).highlights.map(f=>f.value),['84.25 mm','9:1']);
});
