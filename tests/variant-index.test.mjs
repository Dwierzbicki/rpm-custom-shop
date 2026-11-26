import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const m={exports:{}};
new Function('exports','module',ts.transpileModule(read('app/lib/listing-variants.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
test('indexed and fallback listing share exact conflict guard',()=>{
 const {listingVariantCtes:a,indexedListingVariantCtes:b}=m.exports;
 const tail=s=>s.slice(s.indexOf('variant_overlap AS'));
 assert.equal(tail(a),tail(b));assert.ok(b.includes('rpm_variant_members_v1'));assert.ok(!b.includes('jsonb_array_elements'));assert.ok(b.includes('=m.identity'));
});
test('migration stores identity, not price/stock; rollback does not touch catalog',()=>{
 const sql=read('scripts/sql/variant-members-v1.sql'),rollback=read('scripts/sql/variant-members-v1-rollback.sql');
 assert.match(sql,/PRIMARY KEY\(family_id,sku\)/);assert.match(sql,/ON DELETE CASCADE/);assert.match(sql,/CREATE TRIGGER/);assert.doesNotMatch(sql,/proposed_gross|available/);
 assert.doesNotMatch(rollback,/DROP TABLE IF EXISTS rpm_fmic_catalog/);
});

test('overlap guard computes conflicted family IDs once, without per-family correlated subquery',()=>{
 for(const sql of [m.exports.listingVariantCtes,m.exports.indexedListingVariantCtes]){
  assert.match(sql,/variant_conflicted_families AS MATERIALIZED/);
  assert.match(sql,/SELECT DISTINCT vc.family_id FROM variant_checked vc JOIN variant_overlap/);
  assert.match(sql,/LEFT JOIN variant_conflicted_families bad ON bad.family_id=vc.family_id/);
  assert.match(sql,/WHERE bad.family_id IS NULL/);
  assert.doesNotMatch(sql,/NOT EXISTS \(SELECT 1 FROM variant_checked/);
 }
});
