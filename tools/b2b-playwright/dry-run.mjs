import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {chromium} from 'playwright';
import {validateFixtureJob} from './validate.mjs';
import {exampleJob} from './example-job.mjs';

// Offline Playwright proof of concept: only about:blank + page.setContent.
// It NEVER opens any vendor portal, authenticates, submits, sends email,
// accesses real customer data or persists a checkout session.
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
}[char]));
function fixtureHtml(job){
 const rows=job.lines.map((line,i)=>`
 <section class="row">
  <strong data-testid="label-${i}">${escapeHtml(line.name)}</strong>
  <label>SKU dostawcy <input data-testid="sku-${i}" aria-label="SKU ${i+1}"></label>
  <label>Ilość <input data-testid="qty-${i}" aria-label="Ilość ${i+1}"></label>
  <p>Netto/szt: ${escapeHtml(line.expectedPurchaseNetPLN.toFixed(2))} PLN,
     dostawa/szt: ${escapeHtml(line.expectedShippingNetPLN.toFixed(2))} PLN</p>
  <p>Warianty: ${escapeHtml(JSON.stringify(line.options))}</p>
  <p>${line.requiresVariantReview?'KONIECZNA KONTROLA WARIANTU':'Do weryfikacji'}</p>
 </section>`).join('');
 return `<!doctype html><html lang="pl"><head>
 <meta charset="utf-8">
 <meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'; connect-src 'none'">
 <style>body{font:16px system-ui;max-width:960px;margin:40px auto;background:#17191e;color:#fff}
 .row{border:1px solid #575d69;padding:16px;margin:10px 0;border-radius:12px}
 input{background:#292e35;border:1px solid #5f6874;color:#fff;padding:8px;display:block;width:80%}
 .warning{color:#ff9c80}label{display:block;margin:8px 0}small{color:#bbb}</style>
 </head><body><h1>RPM CUSTOM — Playwright B2B offline demo</h1>
 <h2 data-testid="supplier">${escapeHtml(job.supplier.toUpperCase())}</h2>
 <p>RPM #${escapeHtml(job.orderId)} | Job ${escapeHtml(job.jobId.slice(0,16))}</p>
 <p class="warning">SYMULACJA. To nie jest panel dostawcy. Nie można tutaj kupować.</p>
 <main data-testid="lines">${rows}</main>
 <p>Szacowany koszt netto: ${escapeHtml(job.estimatedNetTotalPLN.toFixed(2))} PLN</p>
 <p>Nie ma przycisku kupowania ani formularza zamówienia.</p></body></html>`;
}
export async function runFixture(job,options={}){
 validateFixtureJob(job); // reject corrupted, stale-formatted or injected jobs before browser startup
 const browser=await chromium.launch({headless:true});
 let blockedRequests=0;
 try{
  const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:false,javaScriptEnabled:false});
  const page=await context.newPage();
  await page.route('**/*',route=>{blockedRequests++;return route.abort()});
  await page.setContent(fixtureHtml(job),{waitUntil:'domcontentloaded'});
  for(const [i,line] of job.lines.entries()){
   // Emulate selecting offers and quantities in a locally generated fixture.
   await page.getByTestId('sku-'+i).fill(line.supplierSku,{force:true});
   await page.getByTestId('qty-'+i).fill(String(line.quantity),{force:true});
   if(await page.getByTestId('sku-'+i).inputValue()!==line.supplierSku||
      await page.getByTestId('qty-'+i).inputValue()!==String(line.quantity)){
    throw Error('Offline form did not retain expected SKU / quantity');
   }
  }
  if(blockedRequests!==0||page.url()!=='about:blank'||
     await page.locator('button[type="submit"],input[type="submit"]').count()!==0){
   throw Error('Safety stop: unexpected network access or checkout control');
  }
  const dir=options.outDir??path.join(path.dirname(fileURLToPath(import.meta.url)),'artifacts');
  await mkdir(dir,{recursive:true});
  const filename='demo-'+job.orderId+'-'+job.supplier+'-'+job.jobId.slice(0,12);
  const png=path.join(dir,filename+'.png');
  const report=path.join(dir,filename+'.json');
  await page.screenshot({path:png,fullPage:true});
  const result={jobId:job.jobId,supplier:job.supplier,orderId:job.orderId,
   items:job.lines.length,blockedRequests,sentToSupplier:false,orderPlaced:false,
   status:'offline-simulation-only',image:png};
  await writeFile(report,JSON.stringify(result,null,2)+'\n','utf8');
  await context.close();
  return result;
 }finally{await browser.close()}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const file=process.argv[2];
  const job=file?JSON.parse(await readFile(path.resolve(file),'utf8')):exampleJob();
  const result=await runFixture(job);
  console.log('OFFLINE PLAYWRIGHT DEMO OK:',result);
  console.log('Nie wysłano żadnego zamówienia do dostawcy.');
 }catch(error){
  console.error('PRE-FLIGHT STOP:',error instanceof Error?error.message:'Unknown error');
  process.exitCode=1;
 }
}
