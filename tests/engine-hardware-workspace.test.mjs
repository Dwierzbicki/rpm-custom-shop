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
