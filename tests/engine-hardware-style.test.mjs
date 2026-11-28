import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('hardware uses shared MotoLab chrome and appearance tokens',()=>{
 const ui=read('app/engine-hardware/HardwareCatalog.tsx'),css=read('app/engine-hardware/hardware.css');
 assert.ok(ui.includes("import '../motolab/motolab.css'"));
 assert.ok(ui.includes('className="rpm-lab eh"'));
 assert.ok(ui.includes('rpm-lab-hero eh-hero'));
 for(const token of ['accent','surface','text','panel-border','muted'])assert.ok(css.includes('var(--rpm-color-'+token+')'));
 assert.ok(!css.includes('#e5a152'));
 assert.ok(css.includes('@media(max-width:760px)'));
 assert.ok(!/overflow\s*:\s*hidden|height\s*:\s*100dvh|position\s*:\s*fixed/.test(css));
});
test('admin reuses existing back-office chrome and actions',()=>{
 const ui=read('app/admin/engine-hardware/EngineHardwareAdmin.tsx');
 assert.ok(ui.includes('admin-page rpm-settings-page'));
 assert.ok(ui.includes('rpm-settings-card'));
 assert.ok(ui.includes('rpm-admin-supplier-kpis'));
 assert.ok(ui.includes('className="primary"'));
 assert.ok(!ui.includes('style={{'));
});
