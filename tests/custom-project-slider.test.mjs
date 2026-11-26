import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('custom fabrication features only the original red Nissan S14 photograph',()=>{
 const photos=JSON.parse(read('app/components/storefront/custom-project-photos.json'));
 assert.deepEqual(photos,['730530241_18619318870050885_5051883887820111309_n.jpg']);
 assert.ok(existsSync(new URL('../public/cars/'+photos[0],import.meta.url)));
 const photo=read('app/components/storefront/CustomProjectSlider.tsx');
 assert.match(photo,/\/optimized\/cars\//);
 assert.match(photo,/Nissan S14/);
 assert.doesNotMatch(photo,/setTimeout|setInterval|rpm-project-controls/);
 assert.match(read('app/components/storefront/HomeSections.tsx'),/<CustomProjectPhoto lang=\{lang\}\/>/);
 assert.match(read('scripts/optimize-storefront-images.mjs'),/public\/optimized\/cars/);
 assert.match(read('app/styles/homepage-v2.css'),/rpm-project-photo-grade/);
});
