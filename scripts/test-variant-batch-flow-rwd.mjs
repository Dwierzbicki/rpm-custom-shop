// Mock API: never write production decisions. Requires an authorized admin session.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
const base=process.env.RPM_BASE_URL??'http://localhost:3000';
const family=(i,status='pending')=>({id:String(i).padStart(32,'0'),fingerprint:'a'.repeat(32),scope:'colors',rule:'suffix-color-v1',title:'Test family '+i,category:['Układ chłodzenia'],members:[{sku:'TEST-'+i+'-B',name:'Test black',color:'Czarny',price:21,available:true},{sku:'TEST-'+i+'-N',name:'Test blue',color:'Niebieski',price:21,available:true}],status,present:true,scanned_at:'2026-11-26T10:00:00Z'});
try{
 for(const [width,height] of [[360,800],[390,844],[768,1024],[1024,768],[1280,800],[1920,1080]]){
  const context=await browser.newContext({viewport:{width,height},...(process.env.RPM_STORAGE_STATE?{storageState:process.env.RPM_STORAGE_STATE}:{})});
  const page=await context.newPage();let approved=0;
  await page.route('**/api/admin/variants**',async route=>{
   const req=route.request();
   if(req.method()==='POST'){
    const body=req.postDataJSON();assert.equal(body.action,'approve-batch');assert.equal(body.items.length,1);
    assert.equal(body.items[0].id,String(approved+1).padStart(32,'0'));approved++;
    return route.fulfill({json:{saved:true,groups:1,skus:2}});
   }
   const filter=new URL(req.url()).searchParams.get('filter');
   const families=filter==='approved'?Array.from({length:approved},(_,i)=>family(i+1,'approved')):approved<2?[family(approved+1)]:[];
   return route.fulfill({json:{families,summary:[],total:families.length,page:1}});
  });
  await page.goto(base+'/admin/variants');
  await page.getByLabel('Status',{exact:true}).selectOption('pending');
  page.on('dialog',d=>d.accept());
  for(let i=1;i<=2;i++){
   await page.getByRole('button',{name:new RegExp('Test family '+i)}).waitFor();
   await page.getByRole('checkbox',{name:/Zaznacz oczekujące/}).check();
   await page.getByRole('button',{name:'Zatwierdź zaznaczone (1)'}).click();
   await page.getByRole('status').filter({hasText:'Zatwierdzono 1 rodzin'}).waitFor();
  }
  await page.getByText(/Brak oczekujących rodzin na tej stronie/).waitFor();
  assert.equal(await page.getByRole('button',{name:'Zatwierdź zaznaczone (0)'}).isDisabled(),true);
  assert.equal(await page.getByLabel('Status',{exact:true}).inputValue(),'pending');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false);
  await context.close();console.log('PASS',width,height);
 }
}finally{await browser.close()}
