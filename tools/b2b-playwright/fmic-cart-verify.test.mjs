import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePlnPrice,verifyFmicCart} from './fmic-cart-verify.mjs';
const expected=[
 {sku:'F00VE35007-BOS',qty:2,cap:6},
 {sku:'FMIC-ABC',qty:1,cap:400},
];
const observed=[
 {sku:'F00VE35007-BOS',qty:2,unitGrossPLN:3.99},
 {sku:'FMIC-ABC',qty:1,unitGrossPLN:350},
];

test('parses explicitly formatted PLN unit and subtotal amounts',()=>{
 for(const [str,number] of [['3,99 zł',3.99],['1 234,50 zł',1234.5],
  ['1.234,50 PLN',1234.5],['399.50 PLN',399.5],['399',399]]){
  assert.equal(parsePlnPrice(str),number,str);
 }
 for(const str of ['','Od 3,99 zł','3,99 zł / 4,50 zł','-5,00 zł',
  'Najniższa cena: 3,99 zł','USD 3.99', '0,00 zł']){
  assert.equal(parsePlnPrice(str),null,str);
 }
});

test('accepts cart only when all SKU, quantities, unit prices and subtotal match',()=>{
 const result=verifyFmicCart(expected,observed,357.98);
 assert.equal(result.ok,true);
 assert.equal(result.verifiedLines,2);
 assert.equal(result.calculatedGrossPLN,357.98);
});

test('refuses unknown or existing items, duplicate SKU and incorrect quantities',()=>{
 for(const cart of [
  [...observed,{sku:'EXTRA',qty:1,unitGrossPLN:1}],
  [...observed,observed[0]],
  observed.slice(0,1),
  [{...observed[0],qty:3},observed[1]],
  [{...observed[0],sku:'SOMETHING'},observed[1]],
 ]){
  assert.equal(verifyFmicCart(expected,cart,357.98).ok,false);
 }
});

test('refuses prices exceeding cap, incomplete prices and inconsistent totals',()=>{
 for(const cart of [
  [{...observed[0],unitGrossPLN:15},observed[1]],
  [{...observed[0],unitGrossPLN:null},observed[1]],
  [{...observed[0],unitGrossPLN:0},observed[1]],
 ]){
  assert.equal(verifyFmicCart(expected,cart,357.98).ok,false);
 }
 assert.equal(verifyFmicCart(expected,observed,400).ok,false);
 assert.equal(verifyFmicCart(expected,observed,null).ok,false);
});
