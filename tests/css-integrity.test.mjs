import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

/**
 * The import list is deliberately ordered like the original single CSS file.
 * Reordering imports can change specificity/cascade results even if all rules
 * individually remain unchanged.
 */
const styleFiles=[
  "base.css",
  "brand.css",
  "admin-foundation.css",
  "product-gallery.css",
  "admin-operations.css",
  "product-cart.css",
  "admin-chart.css",
  "checkout-primary.css",
  "admin-settings-security.css",
  "checkout-details.css",
  "product-detail-final.css",
  "legacy-home-catalog.css",
  "power-guides.css",
  "settings-home.css",
  "header-navigation-legacy.css",
  "motolab.css",
  "catalog-modern.css",
  "header-navigation-responsive.css",
  "homepage-responsive.css",
  "homepage-editor.css",
  "customer-account.css"
];
const imports=styleFiles.map(name=>`@import './styles/${name}';\n`).join('');
const globals=await readFile(new URL('../app/globals.css',import.meta.url),'utf8');
const sheets=await Promise.all(styleFiles.map(name=>
 readFile(new URL('../app/styles/'+name,import.meta.url),'utf8')
));
const css=sheets.join('');

test('globals.css imports all sections in their original cascade order',()=>{
 assert.equal(globals,imports,'unexpected inline declarations or import order change');
 assert.equal(sheets.length,styleFiles.length);
 for(let i=0;i<styleFiles.length;i++){
  assert.ok(sheets[i].length>0,'empty stylesheet '+styleFiles[i]);
  assert.ok(!sheets[i].includes('@import'),'nested import in '+styleFiles[i]);
 }
});

test('CSS after splitting is byte-for-byte identical to the pre-refactor stylesheet',()=>{
 // Git blob SHA-1 of the full, original stylesheet. For intentional CSS
 // design changes, review the diff and consciously update this snapshot.
 const blobHeader='blob '+Buffer.byteLength(css,'utf8')+'\0';
 const actual=createHash('sha1').update(blobHeader).update(css,'utf8').digest('hex');
 assert.equal(actual,'e9e86e5e354c20cd3376bbd2fccb0c41c7a87543',
  'CSS snapshot changed — verify stylesheet changes and update the baseline deliberately');
});

function rootRules(source){
 const rules=[];
 let depth=0,quote='',comment=false,start=0,open=0;
 for(let i=0;i<source.length;i++){
  const char=source[i],next=source[i+1];
  if(comment){if(char==='*'&&next==='/'){comment=false;i++}continue}
  if(quote){if(char==='\\'){i++;continue}if(char===quote)quote='';continue}
  if(char==='/'&&next==='*'){comment=true;i++;continue}
  if(char==='"'||char==="'"){quote=char;continue}
  if(char==='{'){if(depth===0)open=i;depth++;continue}
  if(char==='}'){
   depth--;
   assert.ok(depth>=0,'unexpected closing CSS brace');
   if(depth===0){
    const heading=source.slice(start,open).replace(/\/\*[\s\S]*?\*\//g,'').trim();
    assert.ok(heading,'empty stylesheet rule heading');
    rules.push({heading,body:source.slice(open,i+1)});
    start=i+1;
   }
  }
 }
 assert.equal(depth,0,'unclosed CSS block');
 assert.equal(quote,'','unclosed CSS string');
 assert.equal(comment,false,'unclosed CSS comment');
 return rules;
}

test('CSS has no exact duplicate top-level blocks',()=>{
 const seen=new Set();
 const rules=rootRules(css);
 assert.ok(rules.length>100,'expected all storefront CSS rules');
 for(const rule of rules){
  const key=rule.heading+'\u0000'+rule.body;
  assert.ok(!seen.has(key),'duplicate CSS rule: '+rule.heading);
  seen.add(key);
 }
});

test('critical storefront sections retain their CSS selectors',()=>{
 for(const selector of [
  '.rpm-header-v2','.rpm-desktop-root','.rpm-category-drawer',
  '.rpm-guide-page','.rpm-hp-hero','.rpm-products-modern',
  '.rpm-checkout-page','.rpm-cart-layout','.admin-page'
 ])assert.ok(css.includes(selector),'missing CSS selector '+selector);
});
