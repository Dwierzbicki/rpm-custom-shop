import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/cart-readiness.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {cartReadiness}=m.exports;
const manual={key:'manual',productId:32,qty:1};
const supplier={key:'fmic:123',productId:0,qty:2,fmicSku:'123',fmicAvailable:true,unitPrice:3270};
const products=[{id:32,stockStatus:'order',visible:true}];
test('manual checkout needs loaded current visible catalog',()=>{
 assert.equal(cartReadiness([manual],products,'ready','idle').canCheckout,true);
 for(const state of ['loading','error'])assert.equal(cartReadiness([manual],products,state,'idle').canCheckout,false);
 for(const data of [[],[{id:32,visible:false}],[{id:32,stockStatus:'unavailable'}]])assert.equal(cartReadiness([manual],data,'ready','idle').canCheckout,false);
});
test('supplier quote only with ready positive available price',()=>{
 assert.equal(cartReadiness([supplier],[],'error','ready').canQuote,true);
 for(const state of ['idle','loading','error'])assert.equal(cartReadiness([supplier],[],'ready',state).canQuote,false);
 for(const change of [{fmicAvailable:false},{unitPrice:0},{unitPrice:NaN}])assert.equal(cartReadiness([{...supplier,...change}],[],'ready','ready').canQuote,false);
});
test('mixed and empty carts cannot submit via either current flow',()=>{
 for(const lines of [[manual,supplier],[]]){
 const r=cartReadiness(lines,products,'ready','ready');assert.equal(r.canCheckout,false);assert.equal(r.canQuote,false);
 }
 assert.equal(cartReadiness([manual,supplier],products,'ready','ready').mode,'mixed');
});
