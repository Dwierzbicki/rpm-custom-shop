import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('recommendations use separate draft, filterable table, single record and explicit persistence',()=>{
 const s=read('app/admin/settings/power-guides/GuideRecommendations.tsx');
 assert.ok(s.includes('useUnsavedChanges(dirty)'));assert.ok(s.includes('setDraft(d=>d?'));assert.ok(s.includes('expected:data,settings:next'));assert.ok(s.includes('!loaded||saving||!validGuideSettings(next)'));assert.ok(s.includes('Porzucić niezapisane zmiany?'));assert.ok(s.includes('Trwale usunąć'));assert.ok(s.includes('Zmienić rabat domyślny dla wszystkich'));assert.ok(s.includes('visible.map(p=><tr'));assert.ok(s.includes('enabled:false'));
});
test('recommendation editor uses atomic compare and swap, preserving existing route compatibility',()=>{const s=read('app/lib/power-guides-db.ts');assert.ok(s.includes("AND data=$2::jsonb RETURNING key"));assert.ok(s.includes('ON CONFLICT(key) DO NOTHING RETURNING key'));const r=read('app/api/admin/power-guides/route.ts');assert.ok(r.includes('saveGuideSettingsIfCurrent(data.settings,data.expected)'));assert.ok(r.includes('status:409'));assert.ok(r.includes('await saveGuideSettings(data)'));});
