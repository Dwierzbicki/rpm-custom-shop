import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function load(path,deps={}){
 const code=ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const m={exports:{}};new Function('exports','module','require',code)(m.exports,m,p=>{if(!(p in deps))throw Error('Unexpected dependency '+p);return deps[p]});return m.exports;
}
const tree=load('app/fmic-categories.ts');
const routing=load('app/category-routing.ts',{'./fmic-categories':tree});
const {productPath,productRouteSku,isCanonicalProductRoute}=load('app/lib/product-path.ts',{'../category-routing':routing});
test('manual and supplier canonical URL share the same path generator',()=>{
 assert.equal(productPath('Kute korbowody PRISM BMW M50 / M52 / M54 135 mm','RPM-00031'),'/produkt/kute-korbowody-prism-bmw-m50-m52-m54-135-mm/RPM-00031');
 assert.equal(productPath('Część turbo','ABC/123'),'/produkt/czesc-turbo?sku=ABC%2F123');
});
test('featured product tile renders a real canonical link and gross price',()=>{
 const jsx=(type,props)=>({type,props});
 const Card=load('app/components/storefront/ProductCard.tsx',{'react/jsx-runtime':{jsx,jsxs:jsx},'./ProductImage':{},'lucide-react':{ChevronRight:()=>null},'../../data':{money:p=>p+' zł'},'../../lib/product-path':{productPath}}).default;
 const element=Card({product:{id:31,sku:'RPM-00031',name:'Kute korbowody PRISM',category:'Korbowody',brand:'PRISM',price:2100,images:[]},translate:x=>x});
 assert.equal(element.type,'a');assert.equal(element.props.href,'/produkt/kute-korbowody-prism/RPM-00031');assert.ok(!element.props.onClick);assert.match(JSON.stringify(element),/brutto/);assert.doesNotMatch(JSON.stringify(element),/DEMO/);
});

test('reserved SKU characters survive URL query roundtrip and remain distinct',()=>{
 for(const sku of ['004548/70-G','A%2FB','A/B','A+B','A B','A#B','A?B','A\\B','.', '..','Ł-123']){
  const url=new URL(productPath('Część turbo',sku),'https://rpmcustom.pl');
  assert.equal(url.pathname,'/produkt/czesc-turbo');
  assert.equal(url.searchParams.get('sku'),sku);
  assert.equal(productRouteSku(undefined,url.searchParams.get('sku')),sku);
  assert.equal(isCanonicalProductRoute('Część turbo',sku,'czesc-turbo',undefined),true);
 }
 assert.equal(productPath('Część turbo','ABC-123.1'),'/produkt/czesc-turbo/ABC-123.1');
});
test('legacy encoded and split path resolve to exact SKU without double decoding',()=>{
 assert.equal(productRouteSku(['004548/70-G'],undefined),'004548/70-G');
 assert.equal(productRouteSku(['004548','70-G'],undefined),'004548/70-G');
 assert.equal(productRouteSku(['A%2FB'],undefined),'A%2FB');
 assert.equal(isCanonicalProductRoute('Część turbo','004548/70-G','czesc-turbo',['004548','70-G']),false);
 assert.equal(isCanonicalProductRoute('Część turbo','ABC-123','czesc-turbo',undefined),false);
 for(const args of [[undefined,undefined],[undefined,['A','B']],[['A'],'B'],[undefined,''],[undefined,'A'.repeat(121)]])assert.equal(productRouteSku(...args),null);
});
