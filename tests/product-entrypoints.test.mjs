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
const {productPath}=load('app/lib/product-path.ts',{'../category-routing':routing});
test('manual and supplier canonical URL share the same path generator',()=>{
 assert.equal(productPath('Kute korbowody PRISM BMW M50 / M52 / M54 135 mm','RPM-00031'),'/produkt/kute-korbowody-prism-bmw-m50-m52-m54-135-mm/RPM-00031');
 assert.equal(productPath('Część turbo','ABC/123'),'/produkt/czesc-turbo/ABC%2F123');
});
test('featured product tile renders a real canonical link and gross price',()=>{
 const jsx=(type,props)=>({type,props});
 const Card=load('app/components/storefront/ProductCard.tsx',{'react/jsx-runtime':{jsx,jsxs:jsx},'./ProductImage':{},'lucide-react':{ChevronRight:()=>null},'../../data':{money:p=>p+' zł'},'../../lib/product-path':{productPath}}).default;
 const element=Card({product:{id:31,sku:'RPM-00031',name:'Kute korbowody PRISM',category:'Korbowody',brand:'PRISM',price:2100,images:[]},translate:x=>x});
 assert.equal(element.type,'a');assert.equal(element.props.href,'/produkt/kute-korbowody-prism/RPM-00031');assert.ok(!element.props.onClick);assert.match(JSON.stringify(element),/brutto/);assert.doesNotMatch(JSON.stringify(element),/DEMO/);
});
