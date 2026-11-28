import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('compact workspace retains accessible selection, original source, and honest preview state',()=>{
 const ui=read('app/engine-hardware/HardwareCatalog.tsx'),tree=read('app/engine-hardware/M54Breakdown.tsx');
 assert.ok(ui.includes('eh-table-head'));
 assert.ok(ui.includes('eh-part-identity'));
 assert.ok(ui.includes('eh-detail-section'));
 assert.ok(ui.includes('eh-preview-note'));
 assert.ok(ui.includes('const offer=revision&&'));
 assert.ok(ui.includes("showDetailsOnMobile"));
 assert.ok(tree.includes('setOnlyKnown(false)'));
 assert.ok(tree.includes('aria-expanded={open}'));
 assert.ok(tree.includes('aria-pressed={selected===c.id}'));
 assert.ok(tree.includes('[selected]);'));
});

test('initial catalogue state never implicitly selects an assembly or a part',()=>{
 const ui=read('app/engine-hardware/HardwareCatalog.tsx'),tree=read('app/engine-hardware/M54Breakdown.tsx');
 assert.ok(ui.includes('[connectionId,setConnectionId]=useState<string|null>(null)'));
 assert.ok(ui.includes("[diagramId,setDiagramId]=useState(''),[position,setPosition]=useState('')"));
 assert.ok(tree.includes('useState<string[]>([])'));
 assert.ok(!ui.includes('??diagrams[0]'));
 assert.ok(!ui.includes('??rows[0]'));
 assert.ok(ui.includes("const u=rows.find(x=>x.position===position)"));
 assert.ok(ui.includes("setDiagramId(diagram?.id??'');setPosition('');setQty(1)"));
 assert.ok(ui.includes("setDiagramId(next);setCopyStatus('');setPosition('');setQty(1)"));
 assert.ok(ui.includes('!connection&&!d&&'));
});

test('engine header reflects active engine and selected vehicle profile',()=>{const ui=read('app/engine-hardware/HardwareCatalog.tsx');assert.ok(ui.includes('<span>{engine}</span></h1>'));assert.ok(ui.includes("engine.startsWith('2JZ')?'Toyota':'BMW'"));assert.ok(ui.includes('effectiveProfile.vehicle,effectiveProfile.market,effectiveProfile.production'));assert.ok(!ui.includes('<h1>Engine <span>Hardware.'));});

test('whole engine set is primary action and independent of browsing filters',()=>{const ui=read('app/engine-hardware/HardwareCatalog.tsx');assert.ok(!ui.includes('eh-engine-search'));assert.ok(!ui.includes('globalQuery'));assert.ok(!ui.includes('Pełny indeks dokumentacji OEM'));assert.ok(ui.includes('eh-kit-summary'));assert.ok(ui.includes('Zobacz zestaw'));assert.ok(ui.includes('buildHardwareReport({engine,profileId:effectiveProfile?.id'));assert.ok(ui.includes('Zakup kompletu po weryfikacji'));});
