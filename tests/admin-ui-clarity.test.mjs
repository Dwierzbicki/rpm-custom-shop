import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('admin contrast is scoped to shell; power guides separates list and editor',()=>{
 const css=read('app/styles/admin-workspace.css');assert.ok(css.includes('--bo-nav:#0e131b'));assert.ok(css.includes('--bo-panel:#232b37'));
 for(const path of ['app/admin/settings/power-guides/KnowledgeEditor.tsx','app/admin/motolab-dyno/DynoAdmin.tsx']){const s=read(path);assert.ok(s.includes('{!draft&&'));assert.ok(s.includes('Wróć do listy'));assert.ok(/useUnsavedChanges\(dirty(?:\|\|[^)]*)?\)/.test(s));assert.ok(s.includes('Porzucić niezapisane zmiany?'));}
});
test('tab navigation remains mounted and updates deep link',()=>{const s=read('app/admin/settings/power-guides/PowerGuidesWorkspace.tsx');assert.ok(s.includes('window.history.replaceState'));assert.ok(s.includes("hidden={active!=='engines'}"));});
