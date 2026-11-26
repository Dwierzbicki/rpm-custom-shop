import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import pg from 'pg';
const mod={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../../app/lib/listing-variants.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports,mod);
const {listingVariantCtes,indexedListingVariantCtes,listingVariantLookupCtes,indexedListingVariantLookupCtes,listingRepresentatives,listingCount}=mod.exports;
test('actual listing SQL: grouped pagination, filter-specific SKU, price, stock and invalidated families',{skip:!process.env.DATABASE_URL},async()=>{
 const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
 try{
  await c.query('BEGIN');
  await c.query(`CREATE TEMP TABLE rpm_fmic_catalog(sku text PRIMARY KEY,name text,data jsonb,target_category text[],mapping_status text,proposed_gross numeric,available boolean) ON COMMIT DROP;
  CREATE TEMP TABLE rpm_variant_families(id text PRIMARY KEY,scope text,decision text,present boolean,fingerprint text,reviewed_fingerprint text,reviewed_members jsonb) ON COMMIT DROP;
  CREATE TEMP TABLE rpm_variant_members_v1(family_id text,sku text,color text,identity jsonb,PRIMARY KEY(family_id,sku)) ON COMMIT DROP;`);
  const cat=['Układ dolotowy','Łączniki silikonowe','Kolanka silikonowe 45°'];
  const member=(sku,color,price,available)=>({sku,color,price,available,name:'Kolanko '+sku,brand:'Fixture',mpn:sku,ean:'',category:cat});
  const a=[member('A-B','Czarny',40,true),member('A-N','Niebieski',20,false),member('A-R','Czerwony',60,true)],b=[member('B-B','Czarny',30,true),member('B-N','Niebieski',50,true)],solo=member('SOLO','Czarny',25,true);
  for(const x of [...a,...b,solo])await c.query("INSERT INTO rpm_fmic_catalog VALUES($1,$2,$3,$4,'exact',$5,$6)",[x.sku,x.name,{brand:x.brand,mpn:x.mpn,ean:x.ean},cat,x.price,x.available]);
  for(const [id,rows] of [['family-a',a],['family-b',b]]){
   await c.query("INSERT INTO rpm_variant_families VALUES($1,'colors','approved',true,'same','same',$2)",[id,JSON.stringify(rows)]);
   for(const x of rows)await c.query('INSERT INTO rpm_variant_members_v1 VALUES($1,$2,$3,$4)',[id,x.sku,x.color,JSON.stringify([x.name,x.brand,x.mpn,x.ean,x.category])]);
  }
  const columns='sku,available,proposed_gross,family_id,variant_count,variant_color';
  for(const membership of [listingVariantCtes,indexedListingVariantCtes,listingVariantLookupCtes,indexedListingVariantLookupCtes]){
   const source='WITH '+membership+', catalog AS (SELECT '+columns+' FROM rpm_fmic_catalog LEFT JOIN variant_members ON sku=variant_sku WHERE ($1::text IS NULL OR variant_color=$1) AND ($2::text IS NOT NULL) AND ($3::numeric IS NULL OR proposed_gross >= $3) AND ($4::boolean IS NULL OR available=$4))';
   const run=async({color=null,exact='',min=null,stock=null,sort='priceAsc',offset=0,limit=24}={})=>{
    const args=[color,exact,min,stock];
    const count=Number((await c.query(source+' SELECT '+listingCount(true)+' AS n FROM catalog',args)).rows[0].n);
    const order=sort==='priceDesc'?'proposed_gross DESC,sku':'proposed_gross ASC,sku';
    const rows=(await c.query(source+listingRepresentatives(columns,'',sort)+' SELECT * FROM representatives ORDER BY '+order+' LIMIT $5 OFFSET $6',[...args,limit,offset])).rows;
    return {count,rows,skus:rows.map(r=>r.sku)};
   };
   assert.deepEqual((await run()).skus,['A-N','SOLO','B-B']);
   assert.equal((await run()).count,3);
   assert.deepEqual((await run({offset:1,limit:1})).skus,['SOLO']);
   assert.deepEqual((await run({color:'Niebieski'})).skus,['A-N','B-N']);
   assert.equal((await run({color:'Niebieski'})).count,2);
   assert.deepEqual((await run({stock:true})).skus,['SOLO','B-B','A-B']);
   assert.deepEqual((await run({min:45})).skus,['B-N','A-R']);
   assert.deepEqual((await run({sort:'priceDesc'})).skus,['A-R','B-N','SOLO']);
   const exact=await run({exact:'A-R'});assert.ok(exact.skus.includes('A-R'));assert.ok(!exact.skus.includes('A-N'));
   await c.query("UPDATE rpm_fmic_catalog SET proposed_gross=35,available=true WHERE sku='A-N'");
   assert.deepEqual((await run({color:'Niebieski',stock:true})).skus,['A-N','B-N']);
   await c.query("UPDATE rpm_fmic_catalog SET name='Changed technical identity' WHERE sku='A-B'");
   assert.equal((await run()).count,5);
   await c.query("UPDATE rpm_fmic_catalog SET name='Kolanko A-B' WHERE sku='A-B'");
   await c.query("UPDATE rpm_fmic_catalog SET proposed_gross=20,available=false WHERE sku='A-N'");
  }
  // A SKU shared by two otherwise valid families invalidates BOTH complete families.
  const overlap=[a[0],b[0]];
  await c.query("INSERT INTO rpm_variant_families VALUES('overlap','colors','approved',true,'same','same',$1)",[JSON.stringify(overlap.map((x,i)=>({...x,color:i?'Niebieski':'Czarny'})))]);
  for(const [i,x] of overlap.entries())await c.query('INSERT INTO rpm_variant_members_v1 VALUES($1,$2,$3,$4)',['overlap',x.sku,i?'Niebieski':'Czarny',JSON.stringify([x.name,x.brand,x.mpn,x.ean,x.category])]);
  for(const membership of [listingVariantLookupCtes,indexedListingVariantLookupCtes]){
   const result=await c.query('WITH '+membership+' SELECT count(*)::int AS rows,count(family_id)::int AS grouped FROM rpm_fmic_catalog LEFT JOIN variant_members ON sku=variant_sku');
   assert.deepEqual(result.rows[0],{rows:6,grouped:0});
  }
 }finally{await c.query('ROLLBACK').catch(()=>{});await c.end()}
});
