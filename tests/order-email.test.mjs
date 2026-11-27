import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const file=await readFile(new URL('../app/lib/order-email.ts',import.meta.url),'utf8');
// Only type imports occur in this module, so the transpiled ESM is standalone.
const compiled=ts.transpileModule(file,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {handleOrderEmail}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

const sample={
 orderId:'42',language:'pl',customerName:'Klient Testowy',
 customerEmail:'buyer@example.test',
 items:[{sku:'RPM-001',name:'Kolektor turbo',qty:1,unitPrice:500,options:{}}],
 subtotal:500,shippingCost:25,total:525,shippingMethod:'courier',
 paymentMethod:'pay_on_pickup',paymentInstructions:null,
};

function configure(t,env){
 const keys=['EMAIL_MODE','EMAIL_FROM','RESEND_API_KEY','EMAIL_TEST_RECIPIENT'];
 const old=new Map(keys.map(key=>[key,process.env[key]]));
 const originalFetch=globalThis.fetch;
 for(const key of keys)delete process.env[key];
 for(const [key,value] of Object.entries(env))process.env[key]=value;
 t.after(()=>{
  for(const key of keys){
   const value=old.get(key);
   if(value===undefined)delete process.env[key];
   else process.env[key]=value;
  }
  globalThis.fetch=originalFetch;
 });
}

test('mock mode does not make HTTP requests',async t=>{
 configure(t,{EMAIL_MODE:'mock'});
 globalThis.fetch=async()=>{throw Error('Mock mode must not send')};
 await handleOrderEmail(sample);
});

test('test mode sends only to test recipient',async t=>{
 configure(t,{EMAIL_MODE:'test',RESEND_API_KEY:'test-key',EMAIL_TEST_RECIPIENT:'qa@example.test'});
 const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,status:200}};
 await handleOrderEmail(sample);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'https://api.resend.com/emails');
 const body=JSON.parse(calls[0].options.body);
 assert.deepEqual(body.to,['qa@example.test']);
 assert.match(body.subject,/^\[TEST #42\]/);
 assert.equal(body.from,'RPM Custom Test <onboarding@resend.dev>');
});

test('production mode sends to customer only when explicitly configured',async t=>{
 configure(t,{EMAIL_MODE:'production',RESEND_API_KEY:'production-key',EMAIL_FROM:'RPM Custom <orders@example.test>'});
 const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,status:200}};
 await handleOrderEmail(sample);
 assert.equal(calls.length,1);
 const body=JSON.parse(calls[0].options.body);
 assert.deepEqual(body.to,['buyer@example.test']);
 assert.equal(body.from,'RPM Custom <orders@example.test>');
 assert.match(body.subject,/Potwierdzenie zamówienia #42/);
 assert.doesNotMatch(body.subject,/^\[TEST/);
});

test('production mode refuses to send without a configured sender',async t=>{
 configure(t,{EMAIL_MODE:'production',RESEND_API_KEY:'production-key'});
 globalThis.fetch=async()=>{throw Error('Must not reach provider')};
 await assert.rejects(handleOrderEmail(sample),/Email delivery requires valid/);
});

test('rejected provider request is reported as an error',async t=>{
 configure(t,{EMAIL_MODE:'production',RESEND_API_KEY:'production-key',EMAIL_FROM:'orders@example.test'});
 globalThis.fetch=async()=>({ok:false,status:429});
 await assert.rejects(handleOrderEmail(sample),/Email provider rejected request/);
});
