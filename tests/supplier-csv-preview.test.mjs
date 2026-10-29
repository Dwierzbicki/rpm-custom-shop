import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Compile the pure TS parser in memory; no Next.js runtime or database needed.
const source = await readFile(new URL('../src/lib/supplier-csv-preview.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
}).outputText;
const { previewSupplierCsv } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

test('parses Polish semicolon CSV, BOM, decimal commas and quoted delimiters', () => {
  const csv = '\uFEFFsku;nazwa;cena;stan\r\nA1;"Kolektor; turbo";123,45;4\r\n';
  const result = previewSupplierCsv(csv);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].name, 'Kolektor; turbo');
  assert.equal(result.rows[0].price, '123,45');
  assert.deepEqual(result.errors, []);
});
test('flags duplicate SKU without importing second row', () => {
  const result = previewSupplierCsv('sku,name,price\nA,Turbo,100\nA,Turbo 2,110');
  assert.equal(result.rows.length, 1);
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.duplicates[0].firstLine, 2);
});
test('rejects invalid prices and negative stock', () => {
  const result = previewSupplierCsv('sku;name;price;stock\nA;Turbo;abc;2\nB;Wastegate;10;-1');
  assert.equal(result.rows.length, 0);
  assert.equal(result.errors.length, 2);
});
test('rejects missing columns and unclosed quoted fields', () => {
  assert.throws(() => previewSupplierCsv('name;price\nTurbo;20'), /identyfikatora/);
  assert.throws(() => previewSupplierCsv('sku;name;price\nA;"Turbo;20'), /Niezamknięte/);
});
test('does not write to a database or publish products', () => {
  const result = previewSupplierCsv('sku;name;price\nA;Turbo;100');
  assert.deepEqual(Object.keys(result).sort(), ['duplicates','errors','headers','rows']);
});
