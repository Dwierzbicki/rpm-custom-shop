import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/lib/site-lock.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {isRoadAssistance,isAdminPath,authorizedBasic,isPublicSocialArtwork}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const basic=(s)=>'Basic '+Buffer.from(s).toString('base64');
test('site gate rejects missing, malformed and incorrect credentials',async()=>{
 for(const header of [null,'Bearer abc','Basic !!!',basic('user:wrong'),basic('other:pass')])assert.equal(await authorizedBasic(header,'user','pass'),false);
 assert.equal(await authorizedBasic(basic('user:pass'),'user','pass'),true);
});
test('only exact road service prefix is excluded',()=>{
 assert.equal(isRoadAssistance('/autopomoc'),true);assert.equal(isRoadAssistance('/autopomoc/api/orders'),true);assert.equal(isRoadAssistance('/autopomoc-other'),false);assert.equal(isRoadAssistance('/api/catalog'),false);
});
test('admin paths retain their own authentication',()=>{
 for(const path of ['/admin','/admin/login','/api/admin','/api/admin/orders'])assert.equal(isAdminPath(path),true);
 for(const path of ['/','/sklep','/api/catalog','/admin-other'])assert.equal(isAdminPath(path),false);
});

test('only exact branded social image can be requested without a storefront session',()=>{for(const method of ['GET','HEAD'])assert.equal(isPublicSocialArtwork('/optimized/social-card.jpg',method),true);for(const path of ['/','/sklep','/produkt/x/RPM-00032','/api/catalog','/admin','/optimized/logo.webp','/optimized/social-card.jpg/','/optimized/social-card.jpg/other'])assert.equal(isPublicSocialArtwork(path,'GET'),false);assert.equal(isPublicSocialArtwork('/optimized/social-card.jpg','POST'),false)});
