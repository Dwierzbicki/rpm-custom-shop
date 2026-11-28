import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('legacy MotoLab route redirects to home and hardware keeps release gate',()=>{
 const page=read('app/motolab/page.tsx'),tools=read('app/lib/motolab-tools.ts'),hardware=read('app/engine-hardware/page.tsx');
 assert.ok(page.includes('redirect(MOTOLAB_HOME)'));
 assert.ok(tools.includes("MOTOLAB_HOME='/#rpm-motolab'"));
 assert.ok(hardware.includes("!release&&process.env.ENGINE_HARDWARE_PREVIEW!=='1'"));
 assert.ok(tools.includes("href:'/engine-hardware'"));
});
test('all four tools are directly reachable from header and shared navigation',()=>{
 const tools=read('app/lib/motolab-tools.ts'),menu=read('app/components/storefront/MotoLabMenu.tsx'),nav=read('app/components/storefront/MotoLabNavigation.tsx'),home=read('app/components/storefront/HomeSections.tsx');
 for(const path of ['/power-guides','/cr-calculator','/itb-designer','/engine-hardware']){assert.ok(tools.includes("href:'"+path+"'"));assert.ok(home.includes('href="'+path+'"'))}
 assert.ok(menu.includes('MOTOLAB_TOOLS.map'));
 assert.ok(menu.includes('aria-expanded={open}'));
 assert.ok(menu.includes("e.key==='Escape'"));
 assert.ok(nav.includes("aria-current={active===tool.id?'page':undefined}"));
 assert.ok(!home.includes('PRZEJDŹ DO MOTOLAB'));
 assert.ok(read('app/components/storefront/StorefrontHeader.tsx').includes('<MotoLabMenu lang={lang}/>'));
 assert.ok(read('app/components/storefront/PowerGuidesView.tsx').includes('<MotoLabNavigation active="power"/>'));
 assert.ok(read('app/cr-calculator/page.tsx').includes('<MotoLabNavigation active="cr"/>'));
 assert.ok(read('app/engine-hardware/HardwareCatalog.tsx').includes('<MotoLabNavigation active="hardware"/>'));
});
