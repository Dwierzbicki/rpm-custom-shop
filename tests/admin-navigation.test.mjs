import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const exports={};vm.runInNewContext(ts.transpileModule(read('app/lib/admin-navigation.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {ADMIN_GROUPS,ADMIN_LINKS,activeAdminLink,activeAdminGroup,adminPageLabel,workspaceTabs,detailTabs}=exports;
test('six business modules preserve all former routes',()=>{
 const expected=['/admin','/admin/orders','/admin/quote-requests','/admin/products','/admin/engine-hardware','/admin/suppliers/fmic','/admin/variants','/admin/product-descriptions','/admin/suppliers','/admin/settings/fmic-commercial','/admin/b2b-monitor','/admin/settings/power-guides','/admin/community','/admin/settings','/admin/emails','/admin/link-audit','/admin/image-audit'];
 assert.equal(ADMIN_GROUPS.length,6);assert.equal(new Set(ADMIN_LINKS.map(l=>l.href)).size,ADMIN_LINKS.length);
 for(const href of expected){assert.ok(ADMIN_LINKS.some(l=>l.href===href));assert.equal(activeAdminLink(href)?.href,href);assert.ok(activeAdminGroup(href))}
 assert.equal(activeAdminLink('/admin/overview').href,'/admin');assert.equal(activeAdminLink('/admin/settings/company').href,'/admin/settings/company');assert.equal(activeAdminLink('/admin/settings/power-guides/detail').href,'/admin/settings/power-guides');assert.equal(activeAdminLink('/admin/suppliers/fmic/detail').href,'/admin/suppliers/fmic');assert.equal(activeAdminLink('/admin/variants-extra'),undefined);assert.equal(adminPageLabel('/admin/settings/appearance'),'Wygląd');
 assert.equal(activeAdminGroup('/admin/emails').id,'sales');assert.equal(activeAdminGroup('/admin/community').id,'settings');assert.equal(activeAdminGroup('/admin/settings/fmic-commercial').id,'suppliers');
});
test('quality center and content tabs group old screens; no extra sidebar links',()=>{
 assert.equal(workspaceTabs(activeAdminGroup('/admin/image-audit')).length,5);assert.equal(activeAdminGroup('/admin/engine-hardware').id,'catalog');assert.ok(workspaceTabs(activeAdminGroup('/admin/engine-hardware')).some(t=>t.href==='/admin/engine-hardware'));assert.equal(detailTabs('/admin/image-audit').length,3);assert.equal(detailTabs('/admin/community').length,2);assert.equal(workspaceTabs(activeAdminGroup('/admin/emails')).length,2);
 const s=read('app/admin/layout.tsx');assert.ok(s.includes('ADMIN_GROUPS.map(g=>'));assert.ok(s.includes('aria-current'));assert.ok(s.includes("e.key==='Escape'"));assert.equal((s.match(/href="\/" /g)||[]).length,1);
});
test('email preview is tied to selected order, pricing hub is informational, legacy simulation cannot write after failed read',()=>{
 assert.ok(read('app/admin/orders/page.tsx').includes('/admin/emails?orderId='));
 assert.ok(read('app/admin/emails/page.tsx').includes("get('orderId')"));
 const p=read('app/admin/suppliers/pricing/page.tsx');assert.ok(p.includes('Symulacje — nie publikują cen'));assert.ok(!p.includes('fetch('));
 assert.ok(read('app/admin/settings/fmic-commercial/page.tsx').includes('if(!ready||'));
});
