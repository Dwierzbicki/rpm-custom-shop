import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const source=await readFile(new URL('../app/lib/b2b-agent-protocol.ts',import.meta.url),'utf8');
const transpiled=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const {createRequire}=await import('node:module');
const require=createRequire(import.meta.url);
// The production module imports node:crypto; load through a tiny isolated CJS
// wrapper so this unit test runs without adding new production dependencies.
const compiled=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},
}).outputText;
const runtime=await import('data:text/javascript;base64,'+Buffer.from(
 compiled.replace("from 'node:crypto'","from 'node:crypto'")
).toString('base64'));
const {verifyB2BAgentBearer,agentAuthConfigured,validateAgentEvent,InvalidAgentEvent}=runtime;
const token='s'.repeat(48);
const event=()=>({
 orderId:'123',supplier:'fmic',jobId:'a'.repeat(64),fingerprint:'b'.repeat(64),
 runId:'11111111-1111-4111-8111-111111111111',seq:1,mode:'inspect',
 phase:'started',stepIndex:null,
});
test('agent authentication rejects missing, short and forged secrets',()=>{
 assert.equal(agentAuthConfigured(token),true);
 assert.equal(agentAuthConfigured('short'),false);
 assert.equal(verifyB2BAgentBearer('Bearer '+token,token),true);
 assert.equal(verifyB2BAgentBearer('Bearer '+token+'x',token),false);
 assert.equal(verifyB2BAgentBearer(null,token),false);
 assert.equal(verifyB2BAgentBearer('Bearer '+token,undefined),false);
 assert.equal(verifyB2BAgentBearer('Basic '+token,token),false);
});
test('validates strictly typed read-only agent stages',()=>{
 const result=validateAgentEvent(event());
 assert.equal(result.mode,'inspect');
 assert.equal(result.phase,'started');
 assert.equal(validateAgentEvent({...event(),phase:'inspect_product',seq:2,stepIndex:0}).stepIndex,0);
});
test('disallows order submission, URLs, browser cookies or freeform messages',()=>{
 for(const addition of [
  {phase:'send_order'},{phase:'checkout'},{mode:'checkout'},
  {customer:{name:'secret'}},{token:'secret'}, {message:'Unsafe freeform data'},
  {screenshot:'C:/secret.png'}, {url:'https://fmic.pl/checkout'},
  {seq:0}, {runId:'invalid'}, {supplier:'mtuning'},
  {orderId:'0'}, {stepIndex:40}, {stepIndex:-1},
  {phase:'started',stepIndex:0},
 ]){
  assert.throws(()=>validateAgentEvent({...event(),...addition}),InvalidAgentEvent,
   JSON.stringify(addition));
 }
});
test('cart-only stage never exists in read-only mode',()=>{
 const bad={...event(),phase:'cart_add',seq:2,stepIndex:0};
 assert.throws(()=>validateAgentEvent(bad),InvalidAgentEvent);
 assert.equal(validateAgentEvent({...bad,mode:'cart-only'}).phase,'cart_add');
});
