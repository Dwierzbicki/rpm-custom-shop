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
