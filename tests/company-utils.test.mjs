import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNip,validNip,parsePolishAddress} from '../app/company-utils.mjs';

test('NIP: poprawna suma kontrolna',()=>{
 assert.equal(validNip('5250001009'),true);
 assert.equal(validNip('5250001008'),false);
 assert.equal(validNip('123'),false);
 assert.equal(validNip('abcdefghij'),false);
});
test('NIP: usuwa separatory i litery przed walidacją',()=>{
 assert.equal(normalizeNip('PL 525-000-10-09'),'5250001009');
});
for(const [input,street,postalCode,city] of [
 ['SŁOWIAŃSKA 157, 05-180 KOSEWKO','SŁOWIAŃSKA 157','05-180','KOSEWKO'],
 ['ul. Warszawska 15 05-180 Pomiechówek','ul. Warszawska 15','05-180','Pomiechówek'],
 ['Warsztatowa 12/3, 00 001 Warszawa','Warsztatowa 12/3','00-001','Warszawa'],
 ['ul. Krótka 2, 01-234 Nowy Dwór Mazowiecki','ul. Krótka 2','01-234','Nowy Dwór Mazowiecki'],
])test('Adres: '+input,()=>{
 assert.deepEqual(parsePolishAddress(input),{street,postalCode,city,complete:true});
});
test('Adres: bez kodu zachowuje dane do ręcznej edycji',()=>{
 assert.deepEqual(parsePolishAddress('ul. Leśna 3, Warszawa'),{street:'ul. Leśna 3, Warszawa',postalCode:'',city:'',complete:false});
});
test('Adres: częściowy kod i brak miasta',()=>{
 const result=parsePolishAddress('ul. Leśna 3, 00-001');
 assert.equal(result.street,'ul. Leśna 3');assert.equal(result.postalCode,'00-001');assert.equal(result.complete,false);
});
