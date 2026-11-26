import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/listing-variants.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {listingCount,listingRepresentatives,representativeOrder}=m.exports;
test('family count subtracts duplicate matched variants while retaining singleton and manual rows',()=>{
 assert.equal(listingCount(false),'count(*)::int');
 assert.equal(listingCount(true),'(count(*)-count(family_id)+count(DISTINCT family_id))::int');
});
test('filter before representative selection; exact SKU takes precedence',()=>{
 const sql=listingRepresentatives('sku,available,proposed_gross,family_id,variant_count',' WHERE color=$6','priceAsc');
 assert.ok(sql.indexOf('WHERE color=$6')<sql.indexOf('DISTINCT ON (family_id)'));
 assert.match(sql,/WHERE family_id IS NULL UNION ALL/);
 assert.ok(sql.includes('ORDER BY family_id, (lower(sku)=lower($2::text)) DESC, proposed_gross ASC NULLS LAST, sku ASC'));
 assert.ok(representativeOrder('priceDesc').includes('proposed_gross DESC'));
});
