import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import pg from 'pg';

// Run the same SQL generators as production, against temporary fixture tables only.
const cache=new Map();
function load(name){
 if(cache.has(name))return cache.get(name).exports;
 const m={exports:{}};cache.set(name,m);
 const compiled=ts.transpileModule(fs.readFileSync(new URL('../../app/lib/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('exports','module','require',compiled)(m.exports,m,spec=>{assert.match(spec,/^\.\/[a-z-]+$/);return load(spec.slice(2))});
 return m.exports;
}
const {variantCandidateSql}=load('variant-sql');
const {variantBatchValidationSql}=load('variant-batch-sql');
test('silicone SQL: 100 families, technical separation, stale snapshots and overlapping membership',{skip:!process.env.DATABASE_URL},async()=>{
 const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
 try{
  await c.query('BEGIN');
  await c.query(`
   CREATE TEMP TABLE rpm_fmic_catalog(sku text PRIMARY KEY,name text,target_category text[],data jsonb,proposed_gross numeric,available boolean,mapping_status text) ON COMMIT DROP;
   CREATE TEMP TABLE rpm_variant_families(id text PRIMARY KEY,scope text,fingerprint text,present boolean,decision text) ON COMMIT DROP;
   CREATE TEMP TABLE rpm_variant_members_v1(sku text PRIMARY KEY,family_id text) ON COMMIT DROP;
  `);
  const category=['Układ dolotowy','Łączniki silikonowe','Kolanka silikonowe'];
  const insert=async(sku,name,brand='RPM Fixture',cat=category,status='exact')=>c.query('INSERT INTO rpm_fmic_catalog VALUES($1,$2,$3,$4,42,true,$5)',[sku,name,cat,{brand,mpn:sku,ean:''},status]);
  for(let i=0;i<100;i++){
   const diameter=30+i;
   await insert('B-'+i,'Kolanko silikonowe 45° '+diameter+' mm Czarny');
   await insert('R-'+i,'Kolanko silikonowe 45° '+diameter+' mm Czerwony');
   await insert('N-'+i,'Kolanko silikonowe 45° '+diameter+' mm Niebieski');
  }
  // Near matches must not become members of the original family.
  await insert('ANGLE','Kolanko silikonowe 90° 30 mm Niebieski');
  await insert('REDUCER','Kolanko silikonowe 45° 30/40 mm Niebieski');
  await insert('BRAND','Kolanko silikonowe 45° 30 mm Zielony','Other');
  await insert('CATEGORY','Kolanko silikonowe 45° 30 mm Zielony','RPM Fixture',['Układ chłodzenia','Silikony']);
  await insert('UNMAPPED','Kolanko silikonowe 45° 30 mm Zielony','RPM Fixture',category,'unmapped');
  await insert('SUFFIX','Kolanko silikonowe 45° Czarny 30 mm');
  // Ambiguous duplicate colors must exclude the entire family.
  await insert('D1','Łącznik silikonowy 50 mm Czarny');
  await insert('D2','Łącznik silikonowy 50 mm Black');
  await insert('D3','Łącznik silikonowy 50 mm Czerwony');
  const candidates=async()=>(await c.query(variantCandidateSql('colors'))).rows;
  const families=await candidates();
  assert.equal(families.length,100);
  assert.equal(new Set(families.flatMap(f=>f.members.map(m=>m.sku))).size,300);
  assert.ok(families.every(f=>f.members.length===3));
  const first=families.find(f=>f.members.some(m=>m.sku==='B-0'));
  assert.deepEqual(first.members.map(m=>m.sku),['B-0','N-0','R-0']);
  for(const f of families)await c.query("INSERT INTO rpm_variant_families VALUES($1,'colors',$2,true,'pending')",[f.id,f.fingerprint]);
  const selected=families.map(({id,fingerprint})=>({id,fingerprint}));
  const validate=async(items=selected)=>(await c.query(variantBatchValidationSql('colors'),[JSON.stringify(items),'colors'])).rows;
  const all=await validate();assert.equal(all.length,100);assert.equal(all.reduce((n,r)=>n+r.skus,0),300);
  // Price/availability changes alone should not invalidate reviewed identity.
  await c.query("UPDATE rpm_fmic_catalog SET proposed_gross=60,available=false WHERE sku='B-0'");
  assert.equal((await validate()).length,100);
  // A newly discovered color changes membership and invalidates the old snapshot.
  await insert('G-0','Kolanko silikonowe 45° 30 mm Zielony');
  const stale=await validate();assert.equal(stale.length,99);assert.ok(!stale.some(r=>r.id===first.id));
  await c.query("DELETE FROM rpm_fmic_catalog WHERE sku='G-0'");
  assert.equal((await validate()).length,100);
  // Existing membership in another approved group blocks the affected family.
  await c.query("INSERT INTO rpm_variant_members_v1 VALUES('B-0','other-family')");
  const overlap=await validate();assert.equal(overlap.length,99);assert.ok(!overlap.some(r=>r.id===first.id));
  await c.query("DELETE FROM rpm_variant_members_v1 WHERE sku='B-0'");
  await c.query("UPDATE rpm_fmic_catalog SET name='Kolanko silikonowe 90° 30 mm Czarny' WHERE sku='B-0'");
  assert.ok(!(await validate()).some(r=>r.id===first.id));
 }finally{await c.query('ROLLBACK').catch(()=>{});await c.end()}
});
