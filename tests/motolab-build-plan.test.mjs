import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function load(file,deps={}){
 const source=readFileSync(new URL('../app/lib/'+file+'.ts',import.meta.url),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(js,{exports,URL,require(name){assert.ok(name in deps,'Unexpected dependency '+name);return deps[name]}});return exports;
}
const config=load('storefront-config');
const plan=load('motolab-build-plan',{'./storefront-config':config});
const dyno=load('motolab-dyno',{'./storefront-config':config});
test('each supported engine has its own ordered range; approved ceilings are preserved',()=>{
 for(const family of config.POWER_ENGINES)for(const v of family.versions){
  const ranges=config.powerRangesFor(v.id);assert.ok(ranges.length);
  for(let i=0;i<ranges.length;i++){assert.ok(ranges[i].max>ranges[i].min);if(i)assert.equal(ranges[i].min,ranges[i-1].max)}
 }
 assert.equal(config.powerRangesFor('m54b30').at(-1).max,700);
 assert.equal(config.powerRangesFor('2jz-ge').at(-1).max,1000);
 assert.equal(config.powerRangesFor('2jz-gte').at(-1).max,1000);
 assert.equal(config.powerRangesFor('__proto__').length,0);
});
test('fuel demand uses engine-specific upper target and higher ethanol assumption',()=>{
 assert.equal(plan.estimateFuel('m54b30',1,'unknown'),null);
 const p=plan.estimateFuel('m54b30',1,'petrol'),e=plan.estimateFuel('m54b30',1,'ethanol');
 assert.equal(p.powerPs,550);assert.ok(e.injectorCc>p.injectorCc);assert.ok(e.pumpLph>p.pumpLph);
 assert.equal(plan.estimateFuel('2jz-gte',4,'petrol').powerPs,1000);
 assert.equal(plan.estimateFuel('m54b30',4,'petrol'),null);
});
test('candidate SKU pilot stays scoped to M54B30 400–550 PS drift recommended',()=>{
 const keys=plan.buildPlan('m54b30',1,'drift','recommended','petrol').flatMap(t=>t.candidates??[]);
 assert.equal(new Set(keys).size,7);for(const k of keys)assert.ok(plan.candidates[k].sku);
 assert.equal(plan.buildPlan('2jz-gte',4,'drift','recommended','ethanol').flatMap(t=>t.candidates??[]).length,0);
 assert.equal(plan.buildPlan('m54b30',4,'drift','recommended','petrol').length,0);
 assert.ok(!plan.candidates.pistons.verification&&!plan.candidates.turbo.verification&&!plan.candidates.intercooler.verification);
});
test('dyno publication requires evidence and explicit operator attestation',()=>{
 const b={id:'12345678-1234-1234-1234-123456789012',title:'Test fixture',version:'m54b30',powerPs:516,torqueNm:690,basis:'crank',fuel:'E50',usage:'drift',chartUrl:'',notes:'',parts:[{sku:'',name:'Test component',qty:1,note:''}],published:false,attested:false};
 assert.equal(dyno.validDynoBuild(b),true);assert.equal(dyno.validDynoBuild({...b,published:true}),false);
 const chartUrl='https://res.cloudinary.com/example/image/upload/chart.png';
 assert.equal(dyno.validDynoBuild({...b,chartUrl,published:true,attested:true}),true);
 assert.equal(dyno.validDynoBuild({...b,chartUrl:'https://example.org/chart.png',published:true,attested:true}),false);
 assert.equal(dyno.validDynoBuild({...b,chartUrl,published:true,attested:true,parts:[]}),false);
});

test('stroker is distinct, has a geometry task and no borrowed M54 candidates',()=>{const tasks=plan.buildPlan('m50b30-stroker',1,'drift','recommended','petrol');assert.ok(tasks.some(t=>t.id==='hybrid'));assert.equal(tasks.flatMap(t=>t.candidates??[]).length,0);assert.equal(config.approvedPowerRange('m50b30-stroker'),false);assert.equal(dyno.displacementCc({boreMm:84,strokeMm:89.6}),2979)});

test('parts list includes unresolved slots but no workshop tasks',()=>{
 const slots=plan.buildParts('m54b30',1,'drift','recommended','petrol');
 assert.equal(slots.filter(s=>s.candidate).length,8);
 assert.equal(slots.find(s=>s.id==='injectors').qty,1);
 assert.ok(slots.some(s=>s.id==='manifold'&&!s.candidate));
 assert.ok(!slots.some(s=>['health','hybrid','diagnostics'].includes(s.id)));
 assert.equal(new Set(slots.map(s=>s.id)).size,slots.length);
 const stroker=plan.buildParts('m50b30-stroker',1,'drift','recommended','petrol');
 assert.ok(stroker.some(s=>s.id==='crank'));assert.equal(stroker.filter(s=>s.candidate).length,0);
 assert.equal(plan.buildParts('m54b30',4,'drift','recommended','petrol').length,0);
});

test('alternative selection is scoped to slot and engine; choosing own part removes it from purchase selection',()=>{
 const slots=plan.buildParts('m54b30',1,'drift','recommended','petrol'),ic=slots.find(s=>s.id==='intercooler'),inj=slots.find(s=>s.id==='injectors');
 assert.equal(plan.partOptions(ic).length,4);
 assert.equal(plan.selectedPart(ic,{}),'intercooler');
 assert.equal(plan.selectedPart(ic,{intercooler:'intercoolerJr'}),'intercoolerJr');
 assert.equal(plan.selectedPart(ic,{intercooler:'injectors1500'}),'intercooler');
 assert.equal(plan.selectedPart(ic,{intercooler:'own'}),undefined);
 assert.equal(plan.partOptions(inj).length,2);
 assert.equal(plan.selectedPart(inj,{injectors:'injectors1500'}),'injectors1500');
 for(const s of plan.buildParts('m50b30-stroker',1,'drift','recommended','petrol'))assert.equal(plan.partOptions(s).length,0);
 assert.equal(plan.alternatives.injectors1500.verification,undefined);
});

test('GE and GTE use distinct engine-specific catalog pools',()=>{
 const ge=plan.buildParts('2jz-ge',1,'drift','recommended','petrol'),gte=plan.buildParts('2jz-gte',1,'street','budget','petrol');
 assert.equal(ge.find(s=>s.id==='manifold').candidate,'geManifold');
 assert.equal(gte.find(s=>s.id==='manifold').candidate,'gteManifold');
 assert.equal(ge.find(s=>s.id==='rods').candidate,undefined);
 assert.equal(gte.find(s=>s.id==='injectors').candidate,undefined);
 assert.equal(plan.partOptions(gte.find(s=>s.id==='rods')).join(','),'gteRods,gteRodsFmic');
 assert.equal(plan.buildParts('2jz-gte',4,'drift','premium','ethanol').filter(s=>s.candidate).length,0);
});
test('flange mismatch changes immediately when turbo is switched',()=>{
 const s=plan.buildParts('2jz-gte',1,'street','recommended','petrol');
 assert.ok(!plan.assessBuild(s,{},'2jz-gte',1,'petrol').some(i=>i.level==='conflict'));
 assert.ok(plan.assessBuild(s,{turbo:'turboVband'},'2jz-gte',1,'petrol').some(i=>i.id==='flange'&&i.level==='conflict'));
 assert.ok(!plan.assessBuild(s,{turbo:'turboVband',manifold:'own'},'2jz-gte',1,'petrol').some(i=>i.level==='conflict'));
});

test('brand filters only contain assigned candidate manufacturers',()=>{
 const slots=plan.buildParts('m54b30',1,'drift','recommended','petrol');
 const pump=slots.find(s=>s.id==='pump');
 assert.equal(plan.brandsForOptions(plan.partOptions(pump)).length,3);
 assert.ok(plan.brandsForOptions(plan.partOptions(pump)).includes('AEM'));
 const turbo=slots.find(s=>s.id==='turbo');
 assert.ok(plan.brandsForOptions(plan.partOptions(turbo)).includes('Garrett'));
});
test('Garrett supercore requires only the missing hot side and prevents incomplete purchase',()=>{
 const slots=plan.buildParts('2jz-gte',1,'drift','recommended','petrol');
 assert.equal(plan.turboAssemblySlots(slots,{}).length,0);
 const selection={turbo:'garrett3076'};
 const extra=plan.turboAssemblySlots(slots,selection);
 assert.equal(extra.length,1);assert.equal(extra[0].id,'turbo-hot');assert.equal(extra[0].candidate,undefined);
 assert.ok(plan.assessBuild(slots,selection,'2jz-gte',1,'petrol').some(i=>i.id==='turbo-incomplete'&&i.level==='conflict'));
 assert.ok(!plan.assessBuild(slots,selection,'2jz-gte',1,'petrol').some(i=>i.id==='flange-review'));
 assert.equal(plan.turboAssemblySlots(slots,{turbo:'turboVband'}).length,0);
});

const rpmParts=load('motolab-rpm-parts',{'./storefront-config':config});
test('manual catalog part is eligible only for explicitly assigned versions and full power band',()=>{
 const product={id:31,sku:'RPM-00031',name:'Test fixture rods',brand:'Test fixture',visible:true,stockStatus:'order',price:100,configurable:false,motolab:{slot:'rods',versions:['m54b30','m50b25'],maxPowerPs:700,note:'Fixture',noteEn:'Fixture',enabled:true}};
 assert.equal(rpmParts.eligibleRpmParts([product],'m54b30',2).length,1);
 assert.equal(rpmParts.eligibleRpmParts([product],'m50b30-stroker',2).length,0);
 assert.equal(rpmParts.eligibleRpmParts([product],'2jz-gte',2).length,0);
 assert.equal(rpmParts.eligibleRpmParts([{...product,motolab:{...product.motolab,maxPowerPs:650}}],'m54b30',2).length,0);
 for(const patch of [{visible:false},{price:0},{stockStatus:'unavailable'},{id:2},{configurable:true},{optionGroups:[{}]},{motolab:{...product.motolab,enabled:false}}])assert.equal(rpmParts.eligibleRpmParts([{...product,...patch}],'m54b30',1).length,0);
 const slot={...plan.buildParts('m54b30',1,'drift','recommended','petrol').find(s=>s.id==='rods'),rpmOptions:['rpm:31']};
 assert.ok(plan.partOptions(slot).includes('rpm:31'));
 assert.equal(plan.selectedPart(slot,{rods:'rpm:31'}),'rpm:31');
 assert.equal(plan.selectedPart({...slot,rpmOptions:[]},{rods:'rpm:31'}),'rods');
});


test('build cards and alternative products link to exact catalog SKU, and purchase exclusion is explicit',()=>{
 const view=readFileSync(new URL('../app/components/storefront/MotoLabBuildPlan.tsx',import.meta.url),'utf8');
 assert.ok(view.includes('href={productPath(q.name,q.sku)}'));
 assert.ok(view.includes('href={productPath(p.name,p.sku)}'));
 assert.ok(view.includes("choose(slot.id,'own')"));
 assert.ok(view.includes('Usuń z zestawu'));
 assert.ok(view.includes('Przywróć'));
});

test('dyno CSV uses explicit units and rejects duplicate, unordered or invalid samples',()=>{
 const m=dyno.parseDynoCsv('rpm,power_ps,torque_nm\n3000,213.6,500\n3500,299,600\n4000,341.7,600');
 assert.equal(dyno.validDynoMeasurement(m),true);
 assert.equal(dyno.analyseDyno(m).powerPeak.rpm,4000);
 assert.equal(dyno.analyseDyno(m).torquePeak.rpm,3500);
 assert.equal(dyno.analyseDyno(m).torqueAt3000.torqueNm,500);
 assert.equal(dyno.analyseDyno(m).inconsistentPoints,0);
 assert.equal(dyno.parseDynoCsv('rpm;power_ps;torque_nm\n3000;213,6;500\n4000;341,7;600').points[0].powerPs,213.6);
 for(const csv of ['rpm,hp,nm\n3000,1,2\n4000,2,3','rpm,power_ps,torque_nm\n3000,1,2\n3000,2,3','rpm,power_ps,torque_nm\n4000,1,2\n3000,2,3','rpm,power_ps,torque_nm\n3000,,2\n4000,2,3'])assert.throws(()=>dyno.parseDynoCsv(csv));
});
test('dyno interpolation is bounded and does not extrapolate or fill wide gaps',()=>{
 const m=dyno.parseDynoCsv('rpm,power_ps,torque_nm\n2800,100,200\n3200,120,400\n4800,200,600','manual-transcription');
 const a=dyno.analyseDyno(m);
 assert.equal(a.torqueAt3000.torqueNm,300);assert.equal(a.torqueAt3000.interpolated,true);
 assert.equal(a.torqueAt4000,null);assert.ok(a.inconsistentPoints>0);
 assert.equal(m.source,'manual-transcription');
 assert.equal(dyno.validDynoConditions({...dyno.emptyDynoConditions,boostBar:1.2,compressionRatio:9}),true);
 assert.equal(dyno.validDynoConditions({...dyno.emptyDynoConditions,boostBar:-1}),false);
});

test('M52B25TU pilot is distinct, scoped to PB98 350–400 PS drift or track; tiers reuse cost-effective turbo where appropriate and differ in pump and ECU',()=>{const p={fuel:'pb98',internals:'auto',rods:'auto',priority:'response'};const get=(tier)=>plan.buildParts('m52b25tu',1,'drift',tier,'petrol',p);assert.equal(config.powerRangesFor('m52b25tu')[1].min,350);assert.equal(config.powerRangesFor('m52b25tu')[1].max,400);assert.equal(get('budget').find(s=>s.id==='turbo').candidate,'tuTurboSmart');assert.equal(get('recommended').find(s=>s.id==='turbo').candidate,'tuTurboSmart');assert.equal(get('premium').find(s=>s.id==='turbo').candidate,'tuTurboPremium');assert.equal(get('budget').find(s=>s.id==='pump').candidate,'tuPumpBudget');assert.equal(get('recommended').find(s=>s.id==='rods').candidate,'tuRods');assert.ok(plan.buildParts('m52b25tu',1,'drift','recommended','petrol',{...p,fuel:'pb95'}).some(s=>s.candidate));assert.ok(plan.buildParts('m52b25',0,'drift','recommended','petrol',p).some(s=>s.candidate));assert.notEqual(plan.buildParts('m52b25',0,'drift','recommended','petrol',p).find(s=>s.id==='rods').candidate,'tuRods');assert.equal(plan.buildParts('m52b25tu',1,'drift','premium','petrol',{...p,rods:'stock'}).find(s=>s.id==='rods').candidate,undefined);});
test('switching turbo derives manifold flange, outlet and WG and removes external WG from IWG configurations',()=>{const p={fuel:'pb98',internals:'auto',rods:'auto',priority:'response'},s=plan.buildParts('m52b25tu',1,'track','premium','petrol',p);assert.equal(plan.resolveTuDependencies(s,{}).find(x=>x.id==='wastegate').candidate,'tuWastegate');for(const turbo of ['tuTurboSmart']){assert.ok(!plan.resolveTuDependencies(s,{turbo,wastegate:'tuWastegate'}).some(x=>x.id==='wastegate'));assert.equal(plan.tuManifoldSpec(s,{turbo},'premium').options['rpm-wg-diameter'],'internal');}assert.equal(plan.tuManifoldSpec(s,{turbo:'tuTurboT3'},'premium').options['rpm-flange'],'t3-single');assert.equal(plan.tuManifoldSpec(s,{turbo:'tuTurboT3'},'premium').options['rpm-wg-diameter'],'wg-45');assert.equal(plan.resolveTuDependencies(s,{turbo:'tuTurboT3'}).find(x=>x.id==='wastegate').candidate,'tuWastegate');assert.ok(plan.partOptions(s.find(x=>x.id==='turbo')).includes('tuTurboT3'));assert.ok(!plan.partOptions(s.find(x=>x.id==='turbo')).some(k=>plan.tuTurboSpec(k)?.flangeLabel==='T25'));assert.equal(plan.tuManifoldSpec(s,{},'premium').options['rpm-wg-diameter'],'wg-45');assert.equal(plan.tuManifoldSpec(s,{turbo:'own'},'premium'),null);assert.equal(plan.resolveTuDependencies(s,{turbo:'own'}).find(x=>x.id==='wastegate').candidate,undefined);});
test('manifold estimate validates actual catalog options, omits unspecified chassis and never claims complete fitment',()=>{const p={fuel:'pb98',internals:'auto',rods:'auto',priority:'response'},s=plan.buildParts('m52b25tu',1,'drift','premium','petrol',p),spec=plan.tuManifoldSpec(s,{},'premium');const product={sku:'RPM-00032',id:32,name:'Fixture',price:3000,visible:true,stockStatus:'order',configurable:true,optionGroups:[...Object.entries(spec.options).map(([id,value])=>({id,required:true,options:[{id:value,price:id==='rpm-egt'?2450:id==='rpm-thermal-insulation'?1600:0}]})),{id:'rpm-chassis',required:true,options:[{id:'e46',price:0}]}]};assert.equal(plan.tuManifoldEstimate([product],spec).price,7050);assert.equal(plan.tuManifoldEstimate([{...product,visible:false}],spec),null);assert.equal(plan.tuManifoldEstimate([{...product,optionGroups:product.optionGroups.slice(1)}],spec),null);});

test('unpriced base MS43 stays unresolved until the customer explicitly selects EMU Black; all tier choices remain independently editable',()=>{const p={fuel:'pb98',internals:'auto',rods:'auto',priority:'response'},s=plan.buildParts('m52b25tu',1,'drift','budget','petrol',p);const ecu=s.find(x=>x.id==='ecu');assert.equal(plan.selectedPart(ecu,{}),undefined);assert.equal(plan.partOptions(ecu).join(','),'ecu');assert.equal(plan.selectedPart(ecu,{ecu:'ecu'}),'ecu');const rods=s.find(x=>x.id==='rods');assert.equal(plan.selectedPart(rods,{}),undefined);assert.equal(plan.selectedPart(rods,{rods:'tuRods'}),'tuRods');const view=readFileSync(new URL('../app/components/storefront/MotoLabBuildPlan.tsx',import.meta.url),'utf8');assert.ok(view.includes('selections[tier]'));assert.ok(view.includes(".sort().join('|')"));});
test('exact power slider keeps original range IDs and explicit TU pilot boundaries',()=>{assert.equal(config.rangeForPower('m52b25tu',350),1);assert.equal(config.rangeForPower('m52b25tu',380),1);assert.equal(config.rangeForPower('m52b25tu',400),1);assert.equal(config.rangeForPower('m52b25tu',410),2);assert.equal(config.rangeForPower('m52b25tu',340),0);assert.equal(config.rangeForPower('m54b30',510),1);assert.equal(config.rangeForPower('m54b30',400),0);for(const n of [NaN,249,381,510])assert.equal(config.rangeForPower('m52b25tu',n),-1);assert.equal(config.rangeForPower('unknown',350),-1);});
test('target fuel estimate uses exact power while the default assessment retains band maximum',()=>{const exact=plan.estimateFuel('m52b25tu',1,'petrol',380),max=plan.estimateFuel('m52b25tu',1,'petrol');assert.equal(exact.powerPs,380);assert.equal(max.powerPs,400);assert.ok(exact.injectorCc<max.injectorCc);assert.ok(exact.pumpLph<max.pumpLph);assert.equal(plan.estimateFuel('m52b25tu',1,'petrol',410),null);assert.equal(plan.estimateFuel('m52b25tu',1,'petrol',NaN),null);const s=readFileSync(new URL('../app/components/storefront/PowerGuideSteps.tsx',import.meta.url),'utf8');assert.ok(s.includes('type="range"'));assert.ok(s.includes('step={10}'));assert.ok(s.includes('onConfirm(power,index)'));});

test('PB100 is a distinct valid fuel choice but does not silently activate the PB98 curated scenario',()=>{const p={fuel:'pb100',internals:'auto',rods:'auto',priority:'response'};assert.equal(plan.isTuPilot('m52b25tu',1,'drift','petrol',p),false);assert.ok(plan.buildParts('m52b25tu',1,'drift','recommended','petrol',p).some(s=>s.candidate));});

test('fuel estimate changes with final ethanol percentage and retains E85 default for flex',()=>{const p=plan.estimateFuel('m52b25tu',1,'petrol',350),e30=plan.estimateFuel('m52b25tu',1,'ethanol',350,30),e50=plan.estimateFuel('m52b25tu',1,'ethanol',350,50),e85=plan.estimateFuel('m52b25tu',1,'ethanol',350,85);assert.ok(p.injectorCc<e30.injectorCc&&e30.injectorCc<e50.injectorCc&&e50.injectorCc<e85.injectorCc);assert.ok(e30.pumpLph<e85.pumpLph);assert.equal(plan.estimateFuel('m52b25tu',1,'ethanol',350).injectorCc,e85.injectorCc);assert.equal(plan.estimateFuel('m52b25tu',1,'ethanol',350,101),null);});

test('all TU tiers include EGT; Premium uses a single priced seven-point manifold option and separately quotes hardware',()=>{const p={fuel:'pb98',internals:'auto',rods:'auto',priority:'response'};for(const tier of ['budget','recommended','premium']){const slots=plan.buildParts('m52b25tu',1,'drift',tier,'petrol',p),spec=plan.tuManifoldSpec(slots,{},tier);assert.equal(spec.options['rpm-egt'],tier==='premium'?'seven':'yes');assert.equal(spec.egtPoints,tier==='premium'?7:1);assert.equal(slots.some(s=>s.id==='egt-expansion'),tier==='premium');if(tier==='premium')assert.equal(slots.find(s=>s.id==='egt-expansion').candidate,undefined);}});

test('global catalogue selection covers all engines, bands, uses, fuels and tiers without borrowing engine internals',()=>{for(const family of config.POWER_ENGINES)for(const v of family.versions)for(const [range] of config.powerRangesFor(v.id).entries())for(const usage of ['street','drift','track'])for(const tier of ['budget','recommended','premium'])for(const [fuel,choice] of [['petrol','pb98'],['petrol','pb100'],['ethanol','ethanol'],['ethanol','flex']]){const p={fuel:choice,internals:'stock',rods:'stock',priority:'balanced',...(choice==='ethanol'?{ethanolPercent:50}:{})};const slots=plan.buildParts(v.id,range,usage,tier,fuel,p);assert.ok(slots.find(s=>s.id==='turbo').candidate);assert.equal(slots.find(s=>s.id==='rods').candidate,undefined);assert.equal(slots.find(s=>s.id==='pistons').candidate,undefined);for(const s of slots)for(const key of plan.partOptions(s))assert.ok(plan.allCandidates[key],key);const spec=plan.tuManifoldSpec(slots,{},tier);if(v.id==='2jz-gte')assert.equal(spec,null);else {assert.equal(spec.options['rpm-egt'],tier==='premium'?'seven':'yes');assert.equal(spec.sku,v.id==='2jz-ge'?'RPM-00033':'RPM-00032');if(v.id.startsWith('m'))assert.equal(spec.options['rpm-engine'],family.id);}}});
test('M54B25 customer receives a live candidate pool without forged parts forced on stock preference',()=>{const p={fuel:'pb98',internals:'stock',rods:'stock',priority:'balanced'},s=plan.buildParts('m54b25',0,'drift','recommended','petrol',p);assert.equal(s.find(x=>x.id==='turbo').candidate,'tuTurboSmart');assert.equal(s.find(x=>x.id==='injectors').candidate,'tuInjectors');assert.equal(s.find(x=>x.id==='ecu').candidate,'ecu');assert.equal(plan.tuManifoldSpec(s,{},'recommended').options['rpm-engine'],'m54');assert.ok(!plan.resolveTuDependencies(s,{}).some(x=>x.id==='wastegate'));assert.equal(plan.tuManifoldSpec(s,{turbo:'tuTurboT3'},'recommended').options['rpm-flange'],'t3-single');assert.equal(plan.buildParts('m54b25',0,'drift','recommended','petrol',{...p,rods:'forged'}).find(x=>x.id==='rods').candidate,'m54b25Rods');});

test('intake manifold is visible and engine-specific in every Power Builder scenario',()=>{
 const profile={fuel:'pb98',internals:'auto',rods:'auto',priority:'balanced'};
 for(const family of config.POWER_ENGINES)for(const v of family.versions)for(const tier of ['budget','recommended','premium']){
  for(const [range] of config.powerRangesFor(v.id).entries()){
   const slots=plan.buildParts(v.id,range,'drift',tier,'petrol',profile);
   const intake=slots.find(s=>s.id==='intake-manifold');
   assert.ok(intake?.planNote);
   assert.ok(slots.some(s=>s.id==='manifold'));
   assert.equal(plan.selectedPart(intake,{}),undefined);
   const options=plan.partOptions(intake);
   if(v.id==='m52b25tu'||family.id==='m54')assert.equal(options.length,0);
   else if(v.id==='2jz-ge')assert.equal(options.join(','),'intakeGE');
   else if(v.id==='2jz-gte')assert.equal(options.join(','),'intakeGTE');
   else assert.equal(options.join(','),'intakeM50');
   if(options.length)assert.equal(plan.selectedPart(intake,{'intake-manifold':options[0]}),options[0]);
   assert.equal(plan.selectedPart(intake,{'intake-manifold':'own'}),undefined);
  }
 }
});
