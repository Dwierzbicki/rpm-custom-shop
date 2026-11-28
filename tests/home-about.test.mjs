import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('homepage brand story links to actual custom and MotoLab sections in both languages',()=>{
 const home=read('app/components/storefront/HomeSections.tsx');
 const about=home.slice(home.indexOf('<section className="rpm-hp-about"'));
 assert.match(about,/aria-labelledby="rpm-about-title"/);
 assert.match(about,/href="\/#rpm-motolab"/);
 assert.match(home,/id="rpm-motolab"/);
 assert.match(about,/href="#rpm-custom-home"/);
 assert.match(home,/id="rpm-custom-home"/);
 assert.doesNotMatch(about,/onOpenGarage/);
 assert.match(about,/WIĘCEJ NIŻ SKLEP Z CZĘŚCIAMI/);
 assert.match(about,/MORE THAN A PARTS SHOP/);
 assert.equal((about.match(/\{Icon:/g)??[]).length,4);
});
test('cascade panel has neutral border while category underline animation remains',()=>{
 const css=read('app/styles/header-motorsport.css');
 const panel=css.match(/\.rpm-header-v2 \.rpm-cascade-groups,\.rpm-header-v2 \.rpm-cascade-leaves\{([^}]+)\}/)?.[1];
 assert.ok(panel);
 assert.doesNotMatch(panel,/border-top:2px solid #f12748/);
 assert.match(panel,/border:1px solid #3b414c/);
 assert.match(css,/transform:scaleX\(0\)/);
 assert.match(css,/transform:scaleX\(1\)/);
});
