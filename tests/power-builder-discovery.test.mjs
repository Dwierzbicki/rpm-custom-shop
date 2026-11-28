import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/lib/power-builder-discovery.ts',import.meta.url),'utf8');
const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {discoverBov}=exports;
test('discovers complete universal valves even if supplier brand field is empty',()=>{
 for(const [sku,name,brand] of [
 ['284300001','Zawór Blow Off Pulsar PSR 50mm 9PSI V-band','Pulsar'],
 ['USA-TIAL-002573','Zawór upustowy Blow off Tial Q Czarny 11psi','TiAL'],
 ['RTMG-901-0370','RTMG Performance Universal Blow Off Valve Double Piston Black','RTMG Performance'],
 ['TS-0205-1130','Zawór Blow off BOV Turbosmart TS-0205-1130 Vee-Port PRO Universal','Turbosmart'],
 ['VLV-BO-PP-TYP1-25MM','Blow Off Properfekt Typ I 25 mm','Properfekt']
 ])assert.equal(discoverBov({sku,name,brand:''})?.brand,brand);
});
test('rejects accessories, replicas, diesel and named vehicle applications',()=>{
 for(const [sku,name] of [
 ['USA-TIAL-003907','Blow off Valve Spring Tial Sport Q and QR Series Brown'],
 ['TS-0204-3108','Blow off Turbosmart Race Port Sensor Cap - Black'],
 ['VLV-BO-HKS-SSQV3-B','Blow off SSQV 3 HKS style Czarny'],
 ['TS-0215-1367','Blow off Turbosmart Smart Port Supersonic BOV - Ford F150 3.5 EcoBoost'],
 ['704325092','Pulsar PSR Next Generation 50mm BOV Blow-Off Valve Diaphragm Only'],
 ['EBOV','Regulowany zawór blow off do silników turbodiesel']
 ])assert.equal(discoverBov({sku,name}),null);
});

test('live discovery distinguishes pre-filter and post-filter and rejects dedicated parts',()=>{
 const category=['Układ paliwowy','Filtry paliwa'];
 assert.equal(exports.discoverPart({sku:'DW-8-03-110-010K-8',name:'DeatschWerks In-Line Fuel Filter Kit -8AN 10 Micron 110mm'},category)?.slot,'fuel-post-filter');
 assert.equal(exports.discoverPart({sku:'DW-8-03-160-100K-8',name:'DeatschWerks In-Line Fuel Filter Kit -8AN 100 Micron 160mm'},category)?.slot,'fuel-pre-filter');
 assert.equal(exports.discoverPart({sku:'USA-RAD-20-0475-03',name:'Dedykowany filtr paliwa z wkładem stalowym 10um BMW E90 Radium Engineering'},category),null);
 assert.equal(exports.discoverPart({sku:'DW-8-03-110-040K-8',name:'DeatschWerks In-Line Fuel Filter Kit -8AN 40 Micron 110mm'},category),null);
});
test('EFI regulator discovery includes other brands but rejects low pressure regulators',()=>{
 const category=['Układ paliwowy','Regulatory ciśnienia paliwa','Regulatory ciśnienia paliwa'];
 assert.equal(exports.discoverPart({sku:'USA-ARE-13109',name:'Regulator ciśnienia paliwa Aeromotive A1000-6, Performance EFI'},category)?.brand,'Aeromotive');
 assert.equal(exports.discoverPart({sku:'NP-300-02-203',name:'Nuke Performance Fuel Pressure Regulator FPR100m AN-8'},category)?.brand,'Nuke Performance');
 assert.equal(exports.discoverPart({sku:'TS-0404-1122',name:'Regulator ciśnienia paliwa Turbosmart FPR6 AN6 niskie ciśnienie'},category),null);
});
test('universal intercooler discovery requires the correct category',()=>{
 const row={sku:'MMINT-UGB',name:'Intercooler uniwersalny Mishimoto G-Line Czarny'};
 assert.equal(exports.discoverPart(row,['Układ dolotowy','Intercooler','Uniwersalne'])?.slot,'intercooler');
 assert.equal(exports.discoverPart(row,['Układ dolotowy','Intercooler','Intercoolery dedykowane']),null);
});

test('intercooler dimensions are unique and sorted numerically, not by text or price',()=>{
 const names=['Intercooler 600x300x100mm FMIC.EU','Intercooler 600x300x76mm FMIC.EU','Intercooler 450x180x65mm FMIC.EU','Intercooler JRspec 600x300x76mm','Intercooler 600×180×90 mm','Intercooler uniwersalny Mishimoto G-Line'];
 assert.equal(JSON.stringify(exports.intercoolerDimensionOptions(names)),JSON.stringify(['450×180×65','600×180×90','600×300×76','600×300×100']));
 assert.equal(exports.intercoolerDimensions('Intercooler Mishimoto G-Line 63.5mm'),null);
});

test('on-demand air filter lookup uses the exact category and mounting diameter',()=>{
 const path=['Układ dolotowy','Filtry powietrza','Filtry stożkowe'];
 const row={sku:'FP-AF-150-76-B',name:'Stożkowy filtr powietrza FMIC.Pro dł. 150mm średnica montażowa 76mm'};
 assert.equal(exports.discoverExtraPart(row,path,'filter')?.brand,'FMIC.Pro');
 assert.equal(exports.airFilterDiameter(row.name),76);
 assert.equal(exports.airFilterDiameter('Stożkowy filtr powietrza dł. 150mm'),null);
 assert.equal(exports.discoverExtraPart(row,path,'throttle'),null);
 assert.equal(exports.discoverExtraPart(row,path,'__proto__'),null);
 assert.equal(exports.discoverExtraPart({sku:'10042',name:'Filtr powietrza Blitz style'},path,'filter'),null);
});
test('catalogue discovery separates sensor purposes and rejects connectors',()=>{
 const path=['Elektronika','Ecumaster','Czujniki i akcesoria'];
 const row={sku:'ECU-1T1CZU0003',name:'Ecumaster 10 barowy czujnik ciśnienia oleju'};
 assert.equal(exports.discoverExtraPart(row,path,'oil-pressure-sensor')?.sku,row.sku);
 assert.equal(exports.discoverExtraPart(row,path,'fuel-pressure-sensor'),null);
 assert.equal(exports.discoverExtraPart({sku:'ECU-1T2WTY0108',name:'Wtyczka czujnika ciśnienia oleju 10BAR Ecumaster'},path,'oil-pressure-sensor'),null);
});
test('throttle candidates do not include vehicle-specific adapters',()=>{
 const path=['Układ dolotowy','Przepustnice'];
 assert.equal(exports.discoverExtraPart({sku:'JRSPEC-THROTTLE-70',name:'Przepustnica JRspec 70mm'},path,'throttle')?.brand,'JRspec');
 assert.equal(exports.discoverExtraPart({sku:'MZR-DBW-60-CA',name:'Adapter do Elektronicznej Przepustnicy Bosch 60mm MZR Garage dla Nissan S13 CA18'},path,'throttle'),null);
});

test('compressor inlet uses cold side dimensions, not turbine or wheel',()=>{
 assert.equal(exports.compressorInletMm({fields:[{key:'compressor_inlet',value:'3″ Przewód'},{key:'turbine_inlet',value:'2.5″ V-Band'}]},''),76.2);
 assert.equal(exports.compressorInletMm({fields:[]},'Wlot kompresora: Przewód 3″ Wylot kompresora: Przewód 2″'),76.2);
 assert.equal(exports.compressorInletMm({fields:[{key:'compressor_inlet',value:'4″ Przewód'}]},''),101.6);
 assert.equal(exports.compressorInletMm({fields:[{key:'turbine_inlet',value:'2.5″ V-Band'}]},'Wirnik kompresora: 45.64/60.07/62mm'),null);
 assert.equal(exports.compressorInletMm({fields:[{key:'compressor_inlet',value:'3″ V-Band'}]},''),null);
 assert.equal(exports.suggestedFilterDiameter(76.2,[70,76,80,89]),76);
 assert.equal(exports.suggestedFilterDiameter(101.6,[89,100,102]),102);
 assert.equal(exports.suggestedFilterDiameter(76.2,[70,80]),null);
});


test('full catalogue turbo screen finds PTX28 variants for 360 PS without guessing actuator or flange',()=>{
 const rows=[
  ['102128182','Turbosprężarka Pulsar PSR 2860 Gen2 475HP .64 2.5" V-Band Wlot 3" V-Band Wylot Stal Nierdzewna Łożyska kulkowe','vband-single','external',.64],
  ['102128196','Turbosprężarka Pulsar PSR 2860 Gen2 475HP .64 T3 Wlot 3" V-Band Wylot Stal Nierdzewna Łożyska kulkowe','t3-single','external',.64],
  ['102128149','Turbosprężarka Pulsar PSR 2860 Gen2 475HP .64 T25 Wlot 5-Bolt Wylot IWG Stamping Aktuator 7.4PSI Łożyska kulkowe','t25-single','internal',.64],
  ['102128202','Turbosprężarka Pulsar PSR 2860 GEN 2 łożysko kulkowe podwójny V-Band 0.72 A/R IWG PSR Billet Actuator 7.4psi','vband-single','internal',.72],
  ['102128181','Turbosprężarka Pulsar PSR 2867 Gen2 550HP .64 2.5" V-Band Wlot 3" V-Band Wylot Stal Nierdzewna Łożyska kulkowe','vband-single','external',.64]
 ];
 for(const [sku,name,flange,wg,ar] of rows){
  const part=exports.discoverTurbo({sku,name},360);
  assert.ok(part,sku);
  assert.equal(part.turbo.flange,flange,sku);
  assert.equal(part.turbo.wg,wg,sku);
  assert.equal(part.turbo.ar,ar,sku);
 }
 const a=exports.discoverTurbo({sku:rows[0][0],name:rows[0][1]},360).turbo;
 const b=exports.discoverTurbo({sku:rows[3][0],name:rows[3][1]},360).turbo;
 assert.ok(exports.compareTurboCatalogue(a,b,360,'response','drift')<0);
 assert.ok(exports.compareTurboCatalogue(a,b,360,'power','track')>0);
});
test('screen excludes incomplete and out-of-class turbos; unknown data remains unknown',()=>{
 assert.equal(exports.discoverTurbo({sku:'x',name:'Pulsar PSR 6870E Ball Bearing Turbo up to 1100 HP Standard Compressor Cover without Turbine Housing'},850),null);
 assert.equal(exports.discoverTurbo({sku:'x',name:'Turbosprężarka Pulsar PSR 3582 Compact 900HP .63 T3 Wlot 3" V-Band Wylot Łożyska kulkowe'},360),null);
 assert.equal(exports.discoverTurbo({sku:'x',name:'Turbosprężarka 250HP .64 T3 Wlot 3" V-Band Wylot'},360),null);
 assert.equal(exports.discoverTurbo({sku:'x',name:'Turbocharger TurboSystems HTX2754B1V air outlet 90 degrees'},360),null);
 const unknown=exports.turboCatalogueData('Turbosprężarka Pulsar PSR 3067 GEN2 565HP .63 T3 Wlot 3" V-Band Wylot Łożyska kulkowe');
 assert.equal(unknown.wg,null);
 const ambiguous=exports.turboCatalogueData('Turbosprężarka Pulsar PSR 5455G 660KM 0.70A/R Dual V-Band 1.01A/R');
 assert.equal(ambiguous.ar,null);
});


test('piston discovery distinguishes engine versions and exposes dimensions without guessing',()=>{
 const wiseco={sku:'USA-WIS-KE325M84',name:'Kute tłoki silnika Wiseco KE325M84 BMW E46 M54B30 Double Vanos 3.0L (84.00mm) STD, 9.0:1 CR'};
 const p=exports.discoverPiston(wiseco,'m54b30').piston;
 assert.equal(p.application,'exact');
 assert.equal(p.boreMm,84);
 assert.equal(p.compressionRatio,9);
 assert.equal(p.pinMm,null);
 assert.equal(p.packSize,null);
 assert.equal(exports.discoverPiston(wiseco,'m54b25'),null);
 const m52={sku:'USA-WIS-KE118M845',name:'Kute tłoki silnika Wiseco BMW M52B25 84.50mm Bore - 32.70mm CH -5.00 CC'};
 const q=exports.discoverPiston(m52,'m52b25').piston;
 assert.equal(q.boreMm,84.5);
 assert.equal(q.compressionHeightMm,32.7);
 assert.equal(q.crownVolumeCc,-5);
 assert.equal(exports.discoverPiston(m52,'m52b25tu'),null);
 const ge={sku:'X',name:'Piston Set Toyota 2JZ-GE 86.5mm Bore 1.180 In. CH -16.00 CC'};
 assert.equal(exports.discoverPiston(ge,'2jz-ge').piston.compressionHeightMm,29.97);
 assert.equal(exports.discoverPiston(ge,'2jz-gte'),null);
 assert.equal(exports.discoverPiston({sku:'X',name:'Kute tłoki Wiseco + korbowody Manley Toyota 2JZGTE 86mm'},'2jz-gte'),null);
 assert.equal(exports.discoverPiston({sku:'X',name:'Kute tłoki JE Toyota 2JZGTE Stroker 94mm 86.00mm'},'2jz-gte'),null);
 assert.equal(exports.discoverPiston({sku:'X',name:'Kute tłoki ZRP BMW 2.8L M50 / M52 / M54 84.00mm 8.7:1'},'m52b28').piston.application,'review');
 assert.equal(exports.discoverPiston({sku:'X',name:'Kute tłoki Toyota 2JZ 86.50mm 9:1'},'2jz-ge').piston.application,'review');
});


test('engine catalogue keeps rods, bearing types and valvetrain applications separate',()=>{
 const rod=exports.enginePartData('Korbowody H-Beam Billet K1, BMW M50B25Tu / M52B25Tu Dł. 140 Pin 22mm','m52b25tu','rods');
 assert.equal(rod.application,'exact');assert.equal(rod.lengthMm,140);assert.equal(rod.pinMm,22);assert.equal(rod.beam,'H');assert.equal(rod.packSize,null);
 assert.equal(exports.enginePartData('Korbowody ZRP BMW M52B25 Single Vanos','m52b25tu','rods'),null);
 const main='Panewki główne ACL Race STD BMW M20 / M50 / M52 / S52 / S54';
 assert.equal(exports.enginePartData(main,'m52b25tu','bearings-main').sizeLabel,'STD');
 assert.equal(exports.enginePartData(main,'m52b25tu','bearings-rod'),null);
 const v='Zawór wydechowy Inconel SuperTech Toyota Supra 2JZGE / GTE 3.0l DOHC 1994-1998 (+1mm)';
 assert.equal(exports.enginePartData(v,'2jz-ge','exhaust-valves').kind,'exhaust-valve');
 assert.equal(exports.enginePartData(v,'2jz-ge','intake-valves'),null);
 assert.equal(exports.enginePartData('Śruby korbowodów ARP 203-6005 Toyota 2JZGTE','2jz-gte','fasteners'),null);
 assert.equal(exports.enginePartData('Wałki rozrządu BC Toyota 2JZ-GTE non-VVTi','2jz-gte','camshafts').camTiming,'non-VVT-i');
});
test('head gasket bore and pin conflicts are detected; unknown dimensions are not guessed',()=>{
 const gasket=exports.enginePartData('Uszczelka głowicy Cometic BMW M54B25/M54B30 .120" MLS 85mm','m54b30','gasket');
 assert.equal(gasket.boreMm,85);assert.equal(gasket.thicknessMm,3.05);
 const x=exports.engineGeometryConflicts({pinMm:22,boreMm:86},{pinMm:21},gasket);
 assert.equal(x.pin,true);assert.equal(x.gasket,true);
 const y=exports.engineGeometryConflicts({pinMm:null,boreMm:null},{pinMm:21},gasket);
 assert.equal(y.pin,false);assert.equal(y.gasket,false);
});


test('full-category materials use explicit dimensions and leave quantity to the user',()=>{
 const category=['Układ dolotowy','Łączniki silikonowe','Proste łączniki silikonowe'];
 const item=exports.discoverExtraPart({sku:'009500-R-76',name:'Łącznik silikonowy prosty 95mm Czerwony 7,6cm'},category,'charge-couplers');
 assert.equal(item.material.diameterMm,95);assert.equal(item.material.lengthMm,76);assert.equal(item.material.color,'red');assert.equal(item.quantityRequired,true);
 const bends=['Układ dolotowy','Kolanka i rury aluminiowe','Kolanka aluminiowe'];
 const bend={sku:'AL9030028-JR',name:"Kolanko aluminiowe JRspec 90' 28mm 30cm"};
 assert.equal(exports.discoverExtraPart(bend,bends,'charge-bend-90').material.angleDeg,90);
 assert.equal(exports.discoverExtraPart(bend,bends,'charge-bend-45'),null);
 const gates=['Układ wydechowy','Wastegate','Zawory Wastegate'];
 assert.equal(exports.discoverExtraPart({sku:'X',name:'Wastegate Turbosmart Hyper-Gate45 45mm'},gates,'wastegate').slot,'wastegate');
 assert.equal(exports.discoverExtraPart({sku:'X',name:'Wastegate JR.Spec V-Band 50mm'},gates,'wastegate'),null);
});


test('rod sales units require explicit package evidence, not Single VANOS',()=>{
 const rod=(name)=>exports.enginePartData(name,'m52b25','rods');
 const name='Kute korbowody BMW M52B25 Single Vanos 140mm';
 assert.equal(rod(name).packSize,null);
 assert.equal(rod(name+' 1 szt').packSize,1);
 assert.equal(rod(name+' 6 szt').packSize,6);
 assert.equal(rod(name+' 1 szt / set of 6').packSize,null);
 assert.equal(rod('Kuty korbowód BMW M52B25 140mm').packSize,null);
});
test('stock-stroke 2JZ profiles exclude explicit stroker rotating assemblies',()=>{
 for(const version of ['2jz-ge','2jz-gte']){
  const code=version==='2jz-ge'?'2JZ-GE':'2JZ-GTE';
  assert.equal(exports.enginePartData('Connecting rods '+code+' Stroker 94mm',version,'rods'),null);
  assert.equal(exports.enginePartData('Piston rings '+code+' stroker',version,'rings'),null);
  assert.ok(exports.enginePartData('Connecting rods '+code+' 142mm',version,'rods'));
 }
});
