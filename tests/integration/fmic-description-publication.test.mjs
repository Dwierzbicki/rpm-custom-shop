import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import pg from 'pg';

function load(file){
 const compiled=ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 new Function('exports','module',compiled)(mod.exports,mod);
 return mod.exports;
}
const {verifiedSupplierIdentitySql,publishLegacyWorkerDrafts}=load('../../app/lib/fmic-description-publication.ts');
const {fmicWorkerMemoryBudget}=load('../../app/lib/fmic-worker-mode.ts');
test('worker RSS cap reserves memory for storefront',()=>{
 assert.equal(fmicWorkerMemoryBudget(2*1024**3),768*1024**2);
 assert.equal(fmicWorkerMemoryBudget(512*1024**2),256*1024**2);
 assert.equal(fmicWorkerMemoryBudget(0),320*1024**2);
});
test('verified supplier legacy drafts only; bounded, idempotent and manual-safe',{skip:!process.env.DATABASE_URL},async()=>{
 const client=new pg.Client({connectionString:process.env.DATABASE_URL});
 await client.connect();
 try{
  await client.query('BEGIN');
  await client.query(`
   CREATE TEMP TABLE rpm_fmic_catalog(sku text PRIMARY KEY,name text,data jsonb) ON COMMIT DROP;
   CREATE TEMP TABLE rpm_fmic_enrichment(sku text PRIMARY KEY,source_url text,data jsonb,fetched_at timestamptz) ON COMMIT DROP;
   CREATE TEMP TABLE rpm_fmic_product_descriptions(sku text PRIMARY KEY,description text,brand text,published boolean,technical jsonb,publication_origin text,updated_at timestamptz) ON COMMIT DROP;
   CREATE TEMP TABLE rpm_fmic_description_queue(sku text PRIMARY KEY,status text,updated_at timestamptz) ON COMMIT DROP;
  `);
  async function seed(sku,opt={}){
   const name='Exact product '+sku,url='https://fmic.pl/product/'+sku,description='Verified source description '+sku,brand='Brand';
   const feed={url,mpn:sku,brand:opt.feedBrand??''};
   const source={sku,name,mpn:sku,brand,description,...opt.source};
   await client.query('INSERT INTO rpm_fmic_catalog VALUES($1,$2,$3)',[sku,name,feed]);
   await client.query("INSERT INTO rpm_fmic_enrichment VALUES($1,$2,$3,NOW()-interval '2 seconds')",[sku,opt.url??url,source]);
   await client.query("INSERT INTO rpm_fmic_product_descriptions VALUES($1,$2,$3,$4,$5,$6,NOW()+($7::int*interval '1 second'))",[sku,opt.description??description,brand,opt.published??false,opt.technical??{intro:description,fields:[],warranty:''},opt.origin??null,opt.late?5:-1]);
   await client.query('INSERT INTO rpm_fmic_description_queue VALUES($1,$2,NOW())',[sku,opt.status??'done']);
  }
  await seed('A-01');await seed('A-02',{feedBrand:'brand'});
  await seed('B-01',{source:{mpn:'wrong'}});await seed('B-02',{source:{sku:'wrong'}});await seed('B-03',{source:{name:'wrong'}});
  await seed('B-04',{feedBrand:'Other'});await seed('B-05',{url:'https://fmic.pl.evil.example/a'});await seed('B-06',{source:{brand:''}});
  await seed('B-07',{origin:'manual'});await seed('B-08',{late:true});await seed('B-09',{status:'review'});
  await seed('B-10',{description:'manual edit'});await seed('B-11',{technical:{intro:'manual',fields:[],warranty:''}});
  await seed('B-12',{source:{description:''}});await seed('B-13',{origin:'supplier-worker'});
  const identities=(await client.query('SELECT c.sku,'+verifiedSupplierIdentitySql+' AS eligible FROM rpm_fmic_catalog c JOIN rpm_fmic_enrichment e USING(sku) ORDER BY c.sku')).rows;
  assert.equal(identities.find(x=>x.sku==='B-04').eligible,false);
  assert.equal(identities.find(x=>x.sku==='A-01').eligible,true);
  assert.equal(await publishLegacyWorkerDrafts(client,1),1);
  assert.equal(await publishLegacyWorkerDrafts(client,10),1);
  assert.equal(await publishLegacyWorkerDrafts(client,10),0);
  assert.deepEqual((await client.query('SELECT sku FROM rpm_fmic_product_descriptions WHERE published ORDER BY sku')).rows.map(x=>x.sku),['A-01','A-02']);
  await assert.rejects(publishLegacyWorkerDrafts(client,11),/batch/);
 }finally{await client.query('ROLLBACK').catch(()=>{});await client.end()}
});
