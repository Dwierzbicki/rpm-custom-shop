import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('homepage MotoLab promotes all four tools including the engine hardware set',()=>{
 const ui=read('app/components/storefront/HomeSections.tsx');
 const tools=ui.split('<div className="rpm-motolab-tools">')[1].split('</div>')[0];
 assert.equal((tools.match(/<a href=/g)||[]).length,4);
 assert.ok(tools.includes('href="/engine-hardware"'));
 assert.ok(tools.includes('<strong>Engine Hardware</strong>'));
 assert.ok(tools.includes('Zestawy montażowe silnika'));
 const css=read('app/styles/motolab.css');
 assert.ok(css.includes('@container (min-width:700px){.rpm-motolab-tools{grid-template-columns:repeat(4,minmax(0,1fr))}}'));
 assert.ok(css.includes('.rpm-motolab-tools{grid-template-columns:1fr}'));
});
