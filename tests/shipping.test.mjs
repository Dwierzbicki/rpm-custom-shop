import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const source=await readFile(new URL('../app/lib/shipping.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}
}).outputText;
const {shippingQuote,isShippingMethod,validShippingSettings}
 =await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const settings={courierPrice:25,freeShippingFrom:500,pickupEnabled:true,courierEnabled:true};

test('courier shipping is charged below free-delivery threshold',()=>{
 assert.deepEqual(shippingQuote('courier',499.99,settings),{
  method:'courier',label:'Kurier — stała stawka',cost:25,requiresQuote:false,freeShipping:false
 });
});
test('courier shipping is free at and above the threshold',()=>{
 assert.equal(shippingQuote('courier',500,settings).cost,0);
 assert.equal(shippingQuote('courier',500.01,settings).freeShipping,true);
});
test('collection is always free',()=>{
 const quote=shippingQuote('pickup',250,settings);
 assert.equal(quote.cost,0);
 assert.equal(quote.method,'pickup');
});
test('shipping method guard rejects unknown values',()=>{
 assert.equal(isShippingMethod('courier'),true);
 assert.equal(isShippingMethod('pickup'),true);
 assert.equal(isShippingMethod('parcel_locker'),false);
 assert.equal(isShippingMethod(null),false);
});
test('shipping settings require at least one delivery method',()=>{
 assert.equal(validShippingSettings(settings),true);
 assert.equal(validShippingSettings({...settings,pickupEnabled:false,courierEnabled:false}),false);
 assert.equal(validShippingSettings({...settings,courierPrice:-1}),false);
 assert.equal(validShippingSettings({...settings,freeShippingFrom:1.5}),false);
});
