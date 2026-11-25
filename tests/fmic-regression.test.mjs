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

test('Second classification pass distinguishes turbo components and explicit product types',()=>{
 for(const [name,path] of [["Blow off BOV Turbosmart TS-0265-1042 eBG50 Electronic BoostGate Black",["Układ wydechowy","Wastegate"]],["Turbine Housing Turbosmart 62mm T3",["Silnik i turbo","Turbosprężarki","Muszle wydechowe"]],["Koło zamachowe Xtreme Mazda",["Napęd i zawieszenie","Sprzęgło","Koła zamachowe"]],["Rear Suspension Arm 5 Wisefab",["Napęd i zawieszenie","Wahacze regulowane i drążki"]],["Pasek rozrządu GReddy Toyota 2JZ",["Silnik i turbo","Rozrząd","Paski rozrządu"]]])assert.deepEqual(mapper.mapFmicProductCategory('',name).targetPath,path);
 assert.equal(mapper.mapFmicProductCategory('','TS-0223-3011').status,'unmapped');
});

test('Final category additions and explicit classification retain ambiguous SKU review',()=>{
 for(const [name,path] of [["Filtr oleju GReddy OX-03",["Układ chłodzenia","Filtry oleju"]],["Outer CV Joint Assembly for BMW E46 Wisefab",["Napęd i zawieszenie","Półosie i przeguby"]],["COLLINITE 845 Insulator Wax trwały wosk",["Detailing","Zabezpieczenie lakieru","Woski i sealanty"]]])assert.deepEqual(mapper.mapFmicProductCategory('',name).targetPath,path);
 assert.equal(mapper.mapFmicCategory('Elektronika > Zestawy AFR').status,'exact');
 assert.equal(mapper.mapFmicCategory('Elektronika > Urządzenia pomiarowe').status,'exact');
 assert.equal(mapper.mapFmicProductCategory('','BMW 3 SERIES 5/83-3/91').status,'unmapped');
});

test('Reviewed SKU classification is limited to the known supplier record',()=>{
 const row={"mapping_status":"unmapped","name":"BMW 3 SERIES 5/83-3/91","sku":"W44040","source_category":""};
 assert.deepEqual(mapper.mapFmicProductCategory(row.source_category,row.name,row.sku).targetPath,['Napęd i zawieszenie','Mocowania amortyzatorów']);
 assert.equal(mapper.mapFmicProductCategory(row.source_category,row.name,'OTHER').status,'unmapped');
 assert.equal(mapper.mapFmicProductCategory(row.source_category,'Different product',row.sku).status,'unmapped');
});

test('Final reviewed SKU assignments keep uncertain products for review',()=>{
 for(const [sku,row] of Object.entries({"BMC01":{"name":"Wiązka do kontrolera PWM - moduł Varex","source":"Produkty bez kategorii","target":["Układ wydechowy","Przepustnica wydechu"]},"MMFT-16ORB-34BK":{"name":"Nypel Mishimoto AN16ORB na 3/4\" Aluminiowy Czarny","source":"Produkty bez kategorii","target":["Pozostałe","Złączki i uszczelnienia"]},"MMFT-CHKVLV-34":{"name":"Zawór jednokierunkowy Mishimoto 3/4\" (19mm)","source":"Produkty bez kategorii","target":["Pozostałe","Złączki i uszczelnienia"]},"MZR-HEADRAIN-RB":{"name":"Adapter Spływu Głowicy MZR Garage Nissan Skyline Stagea RB20 RB25 RB26","source":"Pozostałe > Pozostałe","target":["Układ chłodzenia","Adaptery układu smarowania"]},"RTMG-901-0536":{"name":"Konwenter ciśnienia skrzynka próżniowa RTMG Performance dla VW Golf MK5 1.4 TSI","source":"Pozostałe > Pozostałe","target":["Silnik i turbo","Turbosprężarki","Dodatki"]},"RTMG-901-0711":{"name":"RTMG Performance DSG DQ200 Original Mechatronic Repair Set","source":"","target":["Napęd i zawieszenie","Części skrzyni biegów"]},"THOR-ECHO":{"name":"Additional component ECHO Thor","source":"Pozostałe > Pozostałe","target":["Układ wydechowy","Elektroniczne systemy wydechowe"]},"TS-0401-3006":{"name":"FPR/OPR Mounting Bracket/Clip Replacement","source":"Produkty bez kategorii","target":["Układ paliwowy","Regulatory ciśnienia paliwa","Akcesoria"]},"TS-0505-2007":{"name":"1/16NPT Male-1/8NPT Female Fit","source":"Produkty bez kategorii","target":["Układ wydechowy","Wastegate","Akcesoria"]},"TS-0505-2008":{"name":"1/16NPT Male - -3AN Flare Fit","source":"Produkty bez kategorii","target":["Układ wydechowy","Wastegate","Akcesoria"]},"TS-0505-2009":{"name":"1/16NPT Male - -4AN Flare fit","source":"Produkty bez kategorii","target":["Układ wydechowy","Wastegate","Akcesoria"]},"TS-0505-3007":{"name":"74mm Locking Collar","source":"Produkty bez kategorii","target":["Układ wydechowy","Wastegate","Akcesoria"]},"TS-0505-3008":{"name":"74mm Collar Tool","source":"Produkty bez kategorii","target":["Pozostałe","Akcesoria warsztatowe"]},"TS-0505-3009":{"name":"1/16NPT 6mm Hose Tail Fittings + Blanks","source":"Produkty bez kategorii","target":["Układ wydechowy","Wastegate","Akcesoria"]},"TS-0550-3008":{"name":"6mm Hose Tail Fittings & Blanks","source":"Produkty bez kategorii","target":["Układ wydechowy","Wastegate","Akcesoria"]},"TS-0550-3012":{"name":"Slave Collar / Heatshield","source":"Produkty bez kategorii","target":["Układ wydechowy","Wastegate","Akcesoria"]},"TS-0550-3057":{"name":"Czujnik HE Turbosmart","source":"Produkty bez kategorii","target":["Układ wydechowy","Wastegate","Akcesoria"]},"TS-9001-1006":{"name":"TS Silicon Hose Gauge","source":"Produkty bez kategorii","target":["Układ dolotowy","Łączniki silikonowe","Przewody podciśnienia"]},"USA-RAD-14-0291":{"name":"AN6 ORB to 8.5mm Barb Radium Engineering","source":"","target":["Pozostałe","Złączki i uszczelnienia"]},"USA-RAD-18-0043":{"name":"O-Ring Multipack 6AN 8AN 10AN FKM Radium Engineering","source":"","target":["Pozostałe","Złączki i uszczelnienia"]},"USA-RAD-18-0043-06":{"name":"O-Ring 5 Pack 6AN FKM Radium Engineering","source":"","target":["Pozostałe","Złączki i uszczelnienia"]},"USA-RAD-18-0043-08":{"name":"O-Ring 5 Pack 8AN FKM Radium Engineering","source":"","target":["Pozostałe","Złączki i uszczelnienia"]},"USA-RAD-18-0043-10":{"name":"O-Ring 5 Pack 10AN FKM Radium Engineering","source":"","target":["Pozostałe","Złączki i uszczelnienia"]},"WF229_100A":{"name":"Front E90 Steering Rack Conversion Kit Wisefab WF229_100A","source":"","target":["Napęd i zawieszenie","Elementy układu kierowniczego"]},"WF346_100A":{"name":"Rear Knuckle Front Bushing Wisefab WF346_100A","source":"","target":["Napęd i zawieszenie","Zwrotnice"]},"WF359_120A":{"name":"Front Rack Relocation Jig Assembly Wisefab WF359_120A","source":"","target":["Pozostałe","Akcesoria warsztatowe"]},"WF366_800":{"name":"Rear Skid Plate Wisefab WF366_800","source":"","target":["Napęd i zawieszenie","Śruby i akcesoria"]},"WF700_907":{"name":"ID20 OD35 Spherical Bearing Housing M16x1.5 Wisefab WF700_907","source":"","target":["Napęd i zawieszenie","Śruby i akcesoria"]},"WF809_100A":{"name":"Front E90 Steering Rack Conversion Kit Wisefab WF809_100A","source":"","target":["Napęd i zawieszenie","Elementy układu kierowniczego"]},"WF860_700A_LHD":{"name":"Front Steering Rack Support Left Wisefab WF860_700A_LHD","source":"","target":["Napęd i zawieszenie","Elementy układu kierowniczego"]},"WF860_840A":{"name":"Front GT86 IS Rack Insert Assembly Wisefab WF860_840A","source":"","target":["Napęd i zawieszenie","Elementy układu kierowniczego"]},"WFR80_400A":{"name":"Front Steering Rack Template Wisefab WFR80_400A","source":"","target":["Pozostałe","Akcesoria warsztatowe"]},"WFR80_400A-RHD":{"name":"Front Steering Rack Template RHD Right Wisefab WFR80_400A-RHD","source":"","target":["Pozostałe","Akcesoria warsztatowe"]}})){
 assert.deepEqual(mapper.mapFmicProductCategory(row.source,row.name,sku).targetPath,row.target);
 }
 for(const [sku,row] of Object.entries({"FGM130-TP":{"name":"Timing Pin - FGM130-TP","source":"","target":["Pozostałe"]},"TS-0991-1001":{"name":"Boost Up System - Blue","source":"Produkty bez kategorii","target":["Pozostałe"]},"TS-0991-1003":{"name":"Boost Up System - Black","source":"Produkty bez kategorii","target":["Pozostałe"]}})){
  const match=mapper.mapFmicProductCategory(row.source,row.name,sku);
  assert.equal(match.status,'normalized');
  assert.deepEqual(match.targetPath,['Pozostałe']);
 }
 assert.equal(mapper.mapFmicProductCategory('Produkty bez kategorii','Boost Up System - Blue','UNKNOWN-SKU').status,'unmapped');
 assert.equal(mapper.mapFmicProductCategory('Produkty bez kategorii','Different product','TS-0991-1001').status,'unmapped');
});

const searchPerformance=await load('app/lib/fmic-search-performance.ts',[["import {searchTokens} from './header-search';","const searchTokens=(q)=>q.split(' ');"]]);
test('Listing cache reuses aggregate results across pagination and sorting only',()=>{
 const input={path:['Hamulce i koła'],q:'BMW',stock:'all',sort:null,page:1,min:null,max:null,selected:['']};
 const keys=searchPerformance.listingCacheKeys(input);
 const next=searchPerformance.listingCacheKeys({...input,page:2,sort:'priceAsc'});
 assert.equal(keys.count,next.count);
 assert.equal(keys.facets,next.facets);
 assert.equal(keys.categories,next.categories);
 assert.notEqual(keys.items,next.items);
 const selected=searchPerformance.listingCacheKeys({...input,selected:['HEL']});
 assert.notEqual(keys.count,selected.count);
 assert.notEqual(keys.facets,selected.facets);
 assert.notEqual(keys.items,selected.items);
 assert.equal(keys.categories,selected.categories);
 const price=searchPerformance.listingCacheKeys({...input,min:100});
 for(const key of Object.keys(keys))assert.notEqual(keys[key],price[key]);
});
test('Aggregate cache deduplicates concurrent requests and retries rejected loads',async()=>{
 let calls=0;
 const load=async()=>{calls++;return 42};
 const values=await Promise.all([searchPerformance.cachedSearch('test-shared',1000,load),searchPerformance.cachedSearch('test-shared',1000,load)]);
 assert.deepEqual(values,[42,42]);assert.equal(calls,1);
 await assert.rejects(searchPerformance.cachedSearch('test-retry',1000,async()=>{throw Error('retry')}));
 assert.equal(await searchPerformance.cachedSearch('test-retry',1000,load),42);
});
