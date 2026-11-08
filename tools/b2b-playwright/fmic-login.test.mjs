import test from 'node:test';
import assert from 'node:assert/strict';
import {FMIC_LOGIN_URL,DEFAULT_FMIC_SESSION_PATH} from './fmic-login.mjs';

test('manual FMIC login opens official login form directly, without credentials in the URL',()=>{
 const target=new URL(FMIC_LOGIN_URL);
 assert.equal(target.origin,'https://fmic.pl');
 assert.equal(target.pathname,'/customer/account/login/');
 assert.equal(target.search,'');
 assert.equal(target.username,'');
 assert.equal(target.password,'');
 assert.ok(DEFAULT_FMIC_SESSION_PATH.includes('.auth/'));
});
