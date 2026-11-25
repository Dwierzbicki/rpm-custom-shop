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

const categorySql=await load('app/lib/fmic-category-membership.ts');
const categoryIndexes=await import('../scripts/fmic-category-indexes.mjs');
test('Category index expressions match storefront SQL and preserve ordered prefix checks',()=>{
 for(const key of ['visibleCatalog','primaryCategory','alternateCategory'])assert.equal(categoryIndexes[key],categorySql[key]);
 const sql=categorySql.categoryMembership('$1');
 assert.ok(sql.includes('cardinality($1::text[])=0'));
 for(const expr of [categorySql.primaryCategory,categorySql.alternateCategory]){
  assert.ok(sql.includes('('+expr+') @> $1::text[]'));
  assert.ok(sql.includes('('+expr+')[1:cardinality($1::text[])]=$1::text[]'));
 }
});

const taxonomy=await load('app/fmic-categories.ts');
const taxonomyUrl='data:text/javascript;base64,'+Buffer.from(ts.transpileModule(readFileSync(new URL('../app/fmic-categories.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const mapper=await load('app/lib/fmic-category-mapping.ts',[["from '../fmic-categories'","from "+JSON.stringify(taxonomyUrl)],["import {categoryPath} from '../category-routing';","const categoryPath=(parts)=>'/sklep/'+parts.join('/');"]]);
test('Approved category remapping preserves product grouping and rejects unknown paths',()=>{
 const cases=["Detailing > Mycie samochodu > Mycie wstępne","Detailing > Mycie samochodu > Piany aktywne","Detailing > Mycie samochodu > Szampony","Detailing > Pielęgnacja szyb > Mycie szyb","Detailing > Plastiki zewnętrzne i elementy gumowe > Pielęgnacja","Detailing > Plastiki zewnętrzne i elementy gumowe > Renowacja","Detailing > Przygotowanie lakieru > Dekontaminacja lakieru","Detailing > Przygotowanie lakieru > Glinki i lubrykanty","Elektronika > CANchecked > Akcesoria","Elektronika > CANchecked > Czujniki","Elektronika > CANchecked > Wyświetlacze","Elektronika > Wskaźniki > Akcesoria","Elektronika > Wskaźniki > Czujniki","Elektronika > Wskaźniki > Wskaźniki","Elektronika > Zawory EBC i N75 > Akcesoria","Elektronika > Zawory EBC i N75 > Zawory","Napęd i zawieszenie > Śruby i akcesoria > Camber Bolt","Napęd i zawieszenie > Wahacze regulowane i drążki > Drążki","Napęd i zawieszenie > Wahacze regulowane i drążki > Hicas lock kit","Napęd i zawieszenie > Wahacze regulowane i drążki > Końcówki kierownicze","Napęd i zawieszenie > Wahacze regulowane i drążki > Wahacze","Napęd i zawieszenie > Zestawy skrętu > Akcesoria","Napęd i zawieszenie > Zestawy skrętu > Zestawy skrętu","Pozostałe > Wycieraczki samochodowe > Uniwersalne","Silnik i turbo > Rozrząd > Kółka rozrządu","Silnik i turbo > Rozrząd > Paski rozrządu","Silnik i turbo > Rozrząd > Wałki rozrządu","Silnik i turbo > Tuleje i pierścienie tłokowe > Pierścienie tłokowe","Silnik i turbo > Tuleje i pierścienie tłokowe > Tuleje tłokowe","Silnik i turbo > Układ zapłonowy > Kable i wiązki","Silnik i turbo > Układ zapłonowy > Świece zapłonowe","Układ chłodzenia > Końcówki olejowe > Klucze nastawne","Układ chłodzenia > Końcówki olejowe > PTFE","Układ chłodzenia > Końcówki olejowe > Push on","Układ chłodzenia > Końcówki olejowe > Swivel","Układ chłodzenia > Podstawki korki i termostaty oleju","Układ chłodzenia > Wentylatory > Akcesoria","Układ chłodzenia > Wentylatory > Dedykowane","Układ chłodzenia > Wentylatory > Ssące","Układ chłodzenia > Wentylatory > Tłoczące","Układ dolotowy > Kolanka i rury nierdzewne > Spawane kolanka nierdzewne welding porn","Układ dolotowy > Łączniki silikonowe > Zatyczki do króćców podcisnienia","Układ dolotowy > Oil catch tank > Akcesoria","Układ dolotowy > Oil catch tank > Oil catch tank","Układ dolotowy > Zestawy wtrysku wody i metanolu > Akcesoria","Układ dolotowy > Zestawy wtrysku wody i metanolu > Zestawy","Układ paliwowy > Filtry paliwa > Akcesoria","Układ paliwowy > Filtry paliwa > Filtry Paliwa","Układ paliwowy > Filtry paliwa > Mocowania","Układ paliwowy > Filtry paliwa > Wkłady filtrów","Układ paliwowy > Swirl Poty > Akcesoria","Układ paliwowy > Swirl Poty > Swirl Poty","Układ paliwowy > Wtryskiwacze > Wtryskiwacze Dedykowane","Układ paliwowy > Wtryskiwacze > Wtryskiwacze Uniwersalne","Układ paliwowy > Zbiorniki paliwa > Akcesoria","Układ paliwowy > Zbiorniki paliwa > Zbiorniki Paliwa","Układ wydechowy > Katalizatory > Benzyna","Układ wydechowy > Katalizatory > Diesel","Układ wydechowy > Katalizatory > Sportowe","Układ wydechowy > Tłumiki sportowe > Tłumiki aktywne","Układ wydechowy > Tłumiki sportowe > Tłumiki dedykowane","Układ wydechowy > Tłumiki sportowe > Tłumiki przelotowe","Układ wydechowy > Wastegate > Akcesoria","Układ wydechowy > Wastegate > Sprężyny","Układ wydechowy > Wastegate > Zawory Wastegate","Wyposażenie wnętrza i kierowcy > Fotele i mocowania > Fotele","Wyposażenie wnętrza i kierowcy > Fotele i mocowania > Mocowania","Wyposażenie wnętrza i kierowcy > Odzież kierowcy FIA > Bielizna","Wyposażenie wnętrza i kierowcy > Odzież kierowcy FIA > Buty","Wyposażenie wnętrza i kierowcy > Odzież kierowcy FIA > Kombinezony","Wyposażenie wnętrza i kierowcy > Odzież kierowcy FIA > Kominiarki","Wyposażenie wnętrza i kierowcy > Odzież kierowcy FIA > Rękawice"];
 for(const source of cases)assert.ok(['exact','normalized'].includes(mapper.mapFmicCategory(source).status),source);
 assert.deepEqual(mapper.mapFmicCategory('Napęd i zawieszenie > Elementy poliuretanowe > BMW > BMW E46 M3').targetPath,['Napęd i zawieszenie','Elementy poliuretanowe']);
 assert.equal(mapper.mapFmicCategory('Elektronika > nieznana').status,'parent_review');
 assert.equal(mapper.mapFmicCategory('').status,'unmapped');
});

test('Product classification only fills missing supplier categories with explicit product types',()=>{
 const classify=(name,source='')=>mapper.mapFmicProductCategory(source,name);
 assert.deepEqual(classify('Zestaw sprzęgła Xtreme Clutch BMW').targetPath,['Napęd i zawieszenie','Sprzęgło','Zestawy sprzęgła']);
 assert.deepEqual(classify('Dystanse przykręcane FMIC.Pro','Default Category').targetPath,['Hamulce i koła','Dystanse kół']);
 assert.deepEqual(classify('Xtreme Flywheel - Lightweight').targetPath,['Napęd i zawieszenie','Sprzęgło','Koła zamachowe']);
 assert.deepEqual(classify('Zestaw zawieszenia B12 PK VW Passat').targetPath,['Napęd i zawieszenie','Amortyzatory i sprężyny']);
 assert.equal(classify('Xtreme Replacement Bolt').status,'unmapped');
 assert.equal(classify('Zestaw sprzęgła BMW','Elektronika > nieznana').status,'parent_review');
 assert.deepEqual(classify('Zestaw sprzęgła BMW','Hamulce i koła > Tarcze hamulcowe').targetPath,['Hamulce i koła','Tarcze hamulcowe']);
});
