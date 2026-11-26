import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app/lib/chunk-recovery.ts',import.meta.url),'utf8');
const script=source.split('String.raw'+String.fromCharCode(96))[1].split(String.fromCharCode(96))[0];
function page(path='/sklep',storage=new Map(),{offline=false,blocked=false}={}){
 const handlers=new Map();let reloads=0;
 const window={location:{pathname:path,href:'https://rpmcustom.pl'+path,origin:'https://rpmcustom.pl',reload(){reloads++}},navigator:{onLine:!offline},
 sessionStorage:{getItem:k=>{if(blocked)throw Error('storage blocked');return storage.get(k)??null},setItem:(k,v)=>storage.set(k,v)},
 addEventListener:(name,fn)=>handlers.set(name,fn)};
 vm.runInNewContext(script,{window,URL,Date});
 return {emit:(name,event)=>handlers.get(name)?.(event),reloads:()=>reloads,storage};
}
const bad={tagName:'SCRIPT',src:'https://rpmcustom.pl/_next/static/chunks/1327.old.js'};
test('missing JS or CSS triggers one reload, even across a new document',()=>{
 const a=page();a.emit('error',{target:bad});a.emit('unhandledrejection',{reason:{name:'ChunkLoadError'}});assert.equal(a.reloads(),1);
 const b=page('/sklep',a.storage);b.emit('error',{target:bad});assert.equal(b.reloads(),0);
 const c=page();c.emit('error',{target:{tagName:'LINK',rel:'stylesheet',href:'/_next/static/css/old.css'}});assert.equal(c.reloads(),1);
});
test('React-caught chunk error is recoverable on PDP',()=>{
 const a=page('/produkt/item/SKU');a.emit('rpm:chunk-error',{detail:{message:'Loading chunk 1327 failed.'}});assert.equal(a.reloads(),1);
});
test('no reload on admin, checkout, cart, offline or inaccessible storage',()=>{
 for(const p of ['/admin/products','/koszyk','/checkout','/']){const a=page(p);a.emit('error',{target:bad});assert.equal(a.reloads(),0)}
 for(const options of [{offline:true},{blocked:true}]){const a=page('/sklep',new Map(),options);a.emit('error',{target:bad});assert.equal(a.reloads(),0)}
});
test('ignore image, favicon, ordinary errors and foreign resources',()=>{
 const a=page();for(const target of [{tagName:'IMG',src:'/_next/static/chunks/a.js'},{tagName:'LINK',rel:'icon',href:'/favicon.ico'},{tagName:'SCRIPT',src:'https://example.com/_next/static/chunks/a.js'},{tagName:'SCRIPT',src:'/other.js'}])a.emit('error',{target});
 a.emit('unhandledrejection',{reason:Error('Failed to fetch')});assert.equal(a.reloads(),0);
});
