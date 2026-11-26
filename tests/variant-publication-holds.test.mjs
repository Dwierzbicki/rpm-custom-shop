import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(new URL('../app/lib/variant-publication-holds.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);
const {heldVariantSkus,excludeHeldVariantFamilies,heldVariantSql}=m.exports;
test('CLM exception is based on supplier SKU, not transient family identity',()=>{
 const normal={id:'normal',members:[{sku:'WIL-120-13289-BK'},{sku:'WIL-120-13289-RD'}]};
 for(const sku of heldVariantSkus){
  const held={id:'new-family',members:[{sku},{sku:'other'}]};
  assert.deepEqual(excludeHeldVariantFamilies([normal,held]),[normal]);
 }
 assert.match(heldVariantSql('$3'),/jsonb_array_elements\(members\)/);
 assert.ok(heldVariantSql('$3').includes("=ANY($3::text[])"));
});
