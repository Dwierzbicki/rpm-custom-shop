import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const globals=await readFile(new URL('../app/globals.css',import.meta.url),'utf8');
const base=await readFile(new URL('../app/styles/base.css',import.meta.url),'utf8');
const brand=await readFile(new URL('../app/styles/brand.css',import.meta.url),'utf8');
const admin=await readFile(new URL('../app/styles/admin-foundation.css',import.meta.url),'utf8');
const orderedImports=[
 "@import './styles/base.css';",
 "@import './styles/brand.css';",
 "@import './styles/admin-foundation.css';",
].join('\n')+'\n';
assert.equal(globals.startsWith(orderedImports),true,'CSS imports must stay in original cascade order');
assert.ok(brand.startsWith('/* RPM Custom identity'),'brand CSS must preserve the original first section');
assert.ok(admin.startsWith('/* Local-only admin prototype */'),'admin CSS must preserve the original next section');
assert.ok(globals.slice(orderedImports.length).startsWith('/* Product galleries */'),'remaining styles must follow the admin section');
for(const [name,source] of [['brand',brand],['admin',admin]]){
 assert.ok(!source.includes('@import'),'nested CSS imports not expected in '+name);
 assert.ok(!source.includes('url('),'relative asset URLs require path review before moving CSS');
}
const css=base+brand+admin+globals.slice(orderedImports.length);


/**
 * Parse only root-level CSS blocks. The test intentionally does not flag
 * repeated selectors with DIFFERENT declarations: they can be meaningful
 * responsive/cascade overrides and should not be deleted automatically.
 */
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
 const rules=rootRules(css),seen=new Set();
 assert.ok(rules.length>100,'should find the actual storefront stylesheet');
 for(const rule of rules){
  const key=rule.heading+'\\u0000'+rule.body;
  assert.ok(!seen.has(key),'duplicate CSS rule: '+rule.heading);
  seen.add(key);
 }
});
test('critical storefront sections retain their CSS selectors',()=>{
 for(const selector of [
  '.rpm-header-v2','.rpm-desktop-root','.rpm-category-drawer',
  '.rpm-guide-page','.rpm-hp-hero','.rpm-products-modern',
  '.rpm-checkout-page'
 ])assert.ok(css.includes(selector),'missing stylesheet section: '+selector);
});
