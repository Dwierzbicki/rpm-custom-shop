import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Power Guides contains both existing editors and knowledge panels without duplicate data stores',()=>{
 const workspace=read('app/admin/settings/power-guides/PowerGuidesWorkspace.tsx');
 for(const name of ['GuideRecommendations','DynoAdmin','EngineDatabasePanel','TechnicalResearchPanel','PowerBuilderPanel'])assert.ok(workspace.includes('<'+name));
 assert.ok(workspace.includes("visited.includes('dyno')"));
 assert.ok(workspace.includes("hidden={active!=='dyno'}"));
 assert.ok(read('app/admin/motolab-dyno/page.tsx').includes("redirect('/admin/settings/power-guides?tab=dyno')"));
 assert.ok(!read('app/admin/layout.tsx').includes("href:'/admin/motolab-dyno'"));
 assert.ok(read('app/admin/settings/power-guides/GuideRecommendations.tsx').includes('/api/admin/power-guides'));
 assert.ok(read('app/admin/motolab-dyno/DynoAdmin.tsx').includes('/api/admin/motolab-dyno'));
});
