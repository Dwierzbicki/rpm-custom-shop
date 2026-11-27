import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const exports={};vm.runInNewContext(ts.transpileModule(read('app/lib/admin-navigation.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {ADMIN_GROUPS,ADMIN_LINKS,activeAdminLink,adminPageLabel}=exports;
test('all 16 operational destinations survive regrouping and each has one active link',()=>{
 const expected=['/admin','/admin/orders','/admin/quote-requests','/admin/products','/admin/suppliers/fmic','/admin/variants','/admin/product-descriptions','/admin/suppliers','/admin/settings/fmic-commercial','/admin/b2b-monitor','/admin/settings/power-guides','/admin/community','/admin/settings','/admin/emails','/admin/link-audit','/admin/image-audit'];
 assert.equal(ADMIN_LINKS.length,16);assert.equal(new Set(ADMIN_LINKS.map(l=>l.href)).size,16);
 for(const href of expected){assert.ok(ADMIN_LINKS.some(l=>l.href===href));assert.equal(activeAdminLink(href)?.href,href)}
 assert.equal(activeAdminLink('/admin/overview').href,'/admin');assert.equal(activeAdminLink('/admin/settings/company').href,'/admin/settings');assert.equal(activeAdminLink('/admin/settings/power-guides/detail').href,'/admin/settings/power-guides');assert.equal(activeAdminLink('/admin/suppliers/fmic/detail').href,'/admin/suppliers/fmic');assert.equal(activeAdminLink('/admin/variants-extra'),undefined);assert.equal(adminPageLabel('/admin/settings/appearance'),'Wygląd sklepu');
});
test('audits are grouped, active tool remains accessible, only one store shortcut',()=>{
 assert.equal(ADMIN_GROUPS.find(g=>g.id==='tools').links.length,2);
 const s=read('app/admin/layout.tsx');assert.ok(s.includes('toolsOpen||onTool'));assert.ok(s.includes('aria-current'));assert.ok(s.includes("e.key==='Escape'"));assert.equal((s.match(/href="\/" /g)||[]).length,1);assert.ok(s.includes('aria-expanded={expanded}'));
});
