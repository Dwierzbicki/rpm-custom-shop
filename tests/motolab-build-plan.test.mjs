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
