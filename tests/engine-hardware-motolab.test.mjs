import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('MotoLab preview link and route share opt-in flag',()=>{
 const page=read('app/motolab/page.tsx'),hub=read('app/motolab/MotoLabHub.tsx'),hardware=read('app/engine-hardware/page.tsx');
 assert.ok(page.includes("hardwareActive={process.env.ENGINE_HARDWARE_PREVIEW==='1'}"));
 assert.ok(hardware.includes("process.env.ENGINE_HARDWARE_PREVIEW!=='1'"));
 assert.ok(hub.includes("href:'/engine-hardware',active:hardwareActive"));
 assert.ok(hub.includes('04 / MODULES'));
 assert.ok(hub.includes('tool.active?<a'));
 assert.ok(hub.includes('W przygotowaniu'));
});
