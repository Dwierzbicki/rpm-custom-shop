import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/social-metadata.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {productSocialMetadata,siteSocialMetadata,socialFallback}=m.exports;
const p={name:'Kolektor turbo BMW',sku:'RPM-00032',brand:'RPM Custom'};
test('missing product photo uses branded fallback without removing privacy flags',()=>{
 const data=productSocialMetadata(p,'/produkt/kolektor/RPM-00032');
 assert.equal(data.openGraph.url,'https://rpmcustom.pl/produkt/kolektor/RPM-00032');
 assert.equal(data.openGraph.images[0].url,socialFallback);
 assert.equal(data.openGraph.images[0].width,1200);
 assert.equal(data.twitter.card,'summary_large_image');
 assert.equal(data.robots.index,false);
 assert.equal(siteSocialMetadata().openGraph.images[0].url,socialFallback);
});
test('actual Cloudinary product photo is padded, not cropped; duplicate intro falls back to description',()=>{
 const url='https://res.cloudinary.com/if1bnaya/image/upload/v123/part.jpg';
 const data=productSocialMetadata({...p,images:[url],technical:{intro:p.name},description:'Stal AISI 316. Wykonanie na zamówienie.'},'/produkt/kolektor/RPM-00032');
 assert.match(data.openGraph.images[0].url,/c_pad,w_1200,h_630,b_white,f_jpg,q_auto/);
 assert.match(data.description,/AISI 316/);
 assert.equal(data.twitter.images[0],data.openGraph.images[0].url);
});
test('supplier image remains unchanged and unknown dimensions are not invented',()=>{
 const url='https://example.com/actual-product.jpg';
 const data=productSocialMetadata({...p,images:['http://example.com/bad.jpg',url]},'/produkt/kolektor/RPM-00032');
 assert.equal(data.openGraph.images[0].url,url);
 assert.equal(data.openGraph.images[0].width,undefined);
});
test('long descriptions are shortened and whitespace/markup is normalized',()=>{
 const data=productSocialMetadata({...p,description:'<p>Stal&nbsp;316</p> '+('parametr '.repeat(60))},'/produkt/kolektor/RPM-00032');
 assert.ok(data.description.length<=170);
 assert.match(data.description,/^Stal 316/);
 assert.ok(!data.description.includes('<p>'));
});
