import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
function load(file){
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 vm.runInNewContext('(function(module,exports){'+js+'\n})') (module,module.exports);
 return module.exports;
}
const matching=load('app/lib/supplier-matching.ts');
const pricing=load('app/lib/supplier-pricing.ts');
function offer(p={}){return {id:1,supplier:'fmic',supplierSku:'A',brand:'Garrett',mpn:'GTX-3076',ean:'1234567890123',name:'Turbo',variant:'0.82 AR',purchaseNet:1000,shippingNet:40,currency:'PLN',available:true,leadDays:3,productId:10,matchStatus:'confirmed',...p}}
test('EAN and variant must agree',()=>{assert.equal(matching.exactMatch(offer(),offer({id:2,supplier:'mtuning',ean:'9999999999999'})),false);assert.equal(matching.exactMatch(offer(),offer({id:2,variant:'0.63 AR'})),false);assert.equal(matching.exactMatch(offer(),offer({id:2,variant:'0.82 A/R'})),true)});
test('brand and MPN match if EAN missing',()=>{assert.equal(matching.exactMatch(offer({ean:''}),offer({id:2,ean:'',brand:'GARRETT',mpn:'GTX3076'})),true)});
test('only confirmed available offers within lead time',()=>{const list=[offer({id:1,purchaseNet:900,available:false}),offer({id:2,purchaseNet:950,leadDays:10}),offer({id:3,purchaseNet:980}),offer({id:4,purchaseNet:700,matchStatus:'unmatched'})];assert.equal(matching.bestOffer(list,7).id,3)});
test('lowest landed cost beats lower unit price',()=>{const list=[offer({id:1,purchaseNet:900,shippingNet:150}),offer({id:2,purchaseNet:990,shippingNet:10})];assert.equal(matching.bestOffer(list,7).id,2)});
test('manual override below minimum is invalid',()=>{const rules={...pricing.DEFAULT_PRICING_RULES,manualPrices:{10:1050}};const q=pricing.quotePrice(1000,10,rules);assert.equal(q.valid,false);assert.equal(q.minimum,1100)});
test('target markup and rounding',()=>{const q=pricing.quotePrice(1030,10,pricing.DEFAULT_PRICING_RULES);assert.equal(q.price,1236);assert.equal(q.valid,true)});
test('pricing settings reject invalid manual prices',()=>{assert.equal(pricing.validPricingRules({...pricing.DEFAULT_PRICING_RULES,manualPrices:{10:-1}}),false)});
