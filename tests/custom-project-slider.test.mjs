import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('workshop slider uses the six local original photos and optimized build paths',()=>{
 const photos=JSON.parse(read('app/components/storefront/custom-project-photos.json'));
 assert.equal(photos.length,6);
 assert.equal(new Set(photos).size,6);
 for(const photo of photos){
  assert.match(photo,/^[0-9_]+n\.jpg$/);
  assert.ok(existsSync(new URL('../public/cars/'+photo,import.meta.url)),photo);
 }
 const slider=read('app/components/storefront/CustomProjectSlider.tsx');
 assert.match(slider,/\/optimized\/cars\//);
 assert.match(slider,/5000/);
 assert.match(slider,/prefers-reduced-motion/);
 assert.match(slider,/onTouchEnd/);
 assert.match(read('app/components/storefront/HomeSections.tsx'),/<CustomProjectSlider lang=\{lang\}\/>/);
 assert.match(read('scripts/optimize-storefront-images.mjs'),/public\/optimized\/cars/);
});
