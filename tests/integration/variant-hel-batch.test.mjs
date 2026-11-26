import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import pg from 'pg';
const cache=new Map();
function load(name){
 if(cache.has(name))return cache.get(name).exports;
 const m={exports:{}};cache.set(name,m);
 const code=ts.transpileModule(fs.readFileSync(new URL('../../app/lib/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('exports','module','require',code)(m.exports,m,spec=>{assert.match(spec,/^\.\/[a-z-]+$/);return load(spec.slice(2))});
 return m.exports;
}
const {variantCandidateSql}=load('variant-sql');
const {variantBatchValidationSql}=load('variant-batch-sql');
test('HEL targeted batch validates full identity including newly added colours and active overlaps',{skip:!process.env.DATABASE_URL},async()=>{
 const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
 try{
  await c.query('BEGIN');
  await c.query(`CREATE TEMP TABLE rpm_fmic_catalog(sku text PRIMARY KEY,name text,target_category text[],data jsonb,proposed_gross numeric,available boolean,mapping_status text) ON COMMIT DROP;
  CREATE TEMP TABLE rpm_variant_families(id text PRIMARY KEY,scope text,fingerprint text,present boolean,decision text,members jsonb) ON COMMIT DROP;
  CREATE TEMP TABLE rpm_variant_members_v1(sku text PRIMARY KEY,family_id text) ON COMMIT DROP;`);
  const cat=['Hamulce i koła','Przewody hamulcowe HEL'];
  const insert=async(base,suffix,color,vehicle='BMW E46',category=cat)=>c.query("INSERT INTO rpm_fmic_catalog VALUES($1,$2,$3,$4,100,true,'exact')",[base+'-'+suffix,vehicle+' '+color+' przewody hamulcowe HEL przód',category,{brand:'HEL',mpn:base+'-'+suffix,ean:''}]);
  for(let i=0;i<110;i++){await insert('HEL-'+i,'B','czarne');await insert('HEL-'+i,'N','niebieskie');}
  await insert('HEL-0','R','czerwone','BMW E90'); // same base, different technical name
  const full=async()=>(await c.query(variantCandidateSql('hel'))).rows;
  const rows=await full();assert.equal(rows.length,110);
  for(const f of rows)await c.query("INSERT INTO rpm_variant_families VALUES($1,'hel',$2,true,'pending',$3)",[f.id,f.fingerprint,JSON.stringify(f.members)]);
  const selected=rows.filter(f=>!f.members.some(m=>m.sku.startsWith('HEL-10')&&m.sku.split('-')[1].length===3)).slice(0,100);
  const items=selected.map(({id,fingerprint})=>({id,fingerprint}));
  const target=rows.find(f=>f.members.some(m=>m.sku==='HEL-0-B'));
  assert.ok(items.length===100);
  const validate=async(input=items)=>(await c.query(variantBatchValidationSql('hel'),[JSON.stringify(input),'hel'])).rows;
  assert.equal((await validate()).length,100);
  const targetItem=[{id:target.id,fingerprint:target.fingerprint}];
  assert.equal((await validate(targetItem)).length,1);
  // A supported suffix not in the stored snapshot must invalidate it.
  await insert('HEL-0','NTR','niebieskie przezroczyste');
  assert.equal((await validate(targetItem)).length,0);
  await c.query("DELETE FROM rpm_fmic_catalog WHERE sku='HEL-0-NTR'");
  await c.query("UPDATE rpm_fmic_catalog SET proposed_gross=125,available=false WHERE sku='HEL-0-B'");
  assert.equal((await validate(targetItem)).length,1);
  await c.query("INSERT INTO rpm_variant_members_v1 VALUES('HEL-0-N','other-family')");
  assert.equal((await validate(targetItem)).length,0);
  await c.query("DELETE FROM rpm_variant_members_v1");
  await c.query("UPDATE rpm_fmic_catalog SET name='Other technical identity' WHERE sku='HEL-0-B'");
  assert.equal((await validate(targetItem)).length,0);
 }finally{await c.query('ROLLBACK').catch(()=>{});await c.end()}
});
