import {chromium} from 'playwright';
import {access} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {DEFAULT_FMIC_SESSION_PATH,validateLocalSessionPath} from './fmic-login.mjs';
import {FMIC_CART_URL,checkFmicCartPreflight} from './fmic-cart-preflight.mjs';
import {guardFmicRequest} from './fmic-guard.mjs';

// A fixed allowlist of structural queries, never arbitrary DOM HTML or text.
const selectors=[
 '.cart-empty','.cart-empty-wrapper','.message.info.empty',
 '[data-testid="cart-empty"]','.cart.table-wrapper',
 '.cart.table-wrapper tbody.cart.item','.cart.table-wrapper tr.item',
 '[class*="cart"]','[id*="cart"]','[class*="basket"]',
 '[id*="basket"]','[class*="empty"]','[id*="empty"]',
 'main','input[name="login[username]"]','form[action*="login"]',
 'input.qty','input[name$="[qty]"]','[class*="product-item"]',
];

export async function inspectCartStructure(page){
 return page.evaluate(selectors=>{
  const safeToken=value=>typeof value==='string'&&
   /^[A-Za-z0-9_:\/\.\-\[\]!]{1,60}$/.test(value)?value:null;
  const onScreen=node=>{
   const style=getComputedStyle(node);
   const bounds=node.getBoundingClientRect();
   return style.display!=='none'&&style.visibility!=='hidden'&&
    bounds.width>0&&bounds.height>0;
  };
  const selectorCounts=Object.fromEntries(selectors.map(selector=>[
   selector,document.querySelectorAll(selector).length,
  ]));
  const candidateSelectors=[
   '[class*="cart"]','[id*="cart"]','[class*="basket"]',
   '[id*="basket"]','[class*="empty"]','[id*="empty"]',
  ];
  const nodes=[...new Set(candidateSelectors.flatMap(selector=>[
   ...document.querySelectorAll(selector),
  ]))].filter(onScreen).slice(0,45);
  const structures=nodes.map(element=>({
   tag:element.tagName.toLowerCase(),
   id:safeToken(element.id),
   classes:[...element.classList].map(safeToken).filter(Boolean).slice(0,12),
   childCount:element.children.length,
  }));
  // Diagnostic structure around each observed quantity input. Never
  // print text, item id, SKU value, HTML, URL, email or cookies.
  const qtyNodes=[...document.querySelectorAll(
   'input[id^="cart-"][id$="-qty"][name$="[qty]"]')].slice(0,4);
  const skuNeighborhood=qtyNodes.map(node=>{
   const ancestors=[];
   let parent=node.parentElement;
   for(let depth=0;parent&&depth<7;depth++,parent=parent.parentElement){
    if(parent.matches('main,body,html'))break;
    ancestors.push({
     depth,tag:parent.tagName.toLowerCase(),
     classes:[...parent.classList].map(safeToken).filter(Boolean).slice(0,10),
     quantityFields:parent.querySelectorAll(
      'input[id^="cart-"][id$="-qty"][name$="[qty]"]').length,
     skuMarkers:parent.querySelectorAll(
      '.product-item-sku,.sku,[itemprop="sku"],[data-sku]').length,
    });
   }
   return {ancestors};
  });
  const location=new URL(window.location.href);
  const pageLocation=location.origin==='https://fmic.pl'||location.origin==='https://www.fmic.pl'
   ?location.pathname.startsWith('/customer/account/login')?'login':
    /^\/checkout\/cart\/(?:index\/?)?$/i.test(location.pathname)?'cart':'other_fmic'
   :'offsite';
  // Only boolean recognizers for generic words: no raw UI copy, product
  // names, account IDs, inputs, tokens, email addresses or customer details.
  const areas=[...document.querySelectorAll('main,.cart-empty,.cart-empty-wrapper,.message.info.empty')];
  const visibleText=areas.filter(onScreen).map(el=>el.innerText).join(' ').slice(0,20000);
  return {
   pageLocation,
   selectors:selectorCounts,
   structures,
   skuNeighborhood,
   words:{
    koszyk:/\bkoszyk\b/i.test(visibleText),
    pusty:/\bpusty\b/i.test(visibleText),
    cart:/\bcart\b/i.test(visibleText),
    empty:/\bempty\b/i.test(visibleText),
    noProducts:/\bbrak\s+produkt[oó]w\b/i.test(visibleText),
   },
  };
 },selectors);
}

/**
 * For local diagnostics ONLY. The strict request guard forbids any cart
 * mutation. Diagnostic output is intentionally schema-bound and safe to
 * share: no screenshot, HTML, cookies, tokens, URLs with query, or user text.
 */
export async function diagnoseFmicCart(options={}){
 const session=validateLocalSessionPath(options.storageState??DEFAULT_FMIC_SESSION_PATH);
 await access(session).catch(()=>{throw Error('Brak zapisanej sesji FMIC. Najpierw npm run fmic:login');});
 const browser=await chromium.launch({headless:options.headless??true});
 try{
  const context=await browser.newContext({
   storageState:session,acceptDownloads:false,serviceWorkers:'block',
  });
  try{
   let allowed=0,blocked=0,blockedGet=0;
   await context.route('**/*',route=>{
    const request=route.request();
    if(guardFmicRequest(request.method(),request.url(),false)==='continue'){
     allowed++;
     return route.continue();
    }
    blocked++;
    if(request.method()==='GET')blockedGet++;
    return route.abort();
   });
   const page=await context.newPage();
   try{
    let preflight;
    try{
     preflight=await checkFmicCartPreflight(page);
    }catch{
     preflight={status:'unknown',itemCount:0,reason:'navigation_or_read_failure'};
    }
    // Some client-side widgets render after DOMContentLoaded. Never convert
    // "unknown" into "empty" without a recognized explicit empty message.
    await page.waitForTimeout(options.settleMs??1600);
    const structure=await inspectCartStructure(page);
    return {
     mode:'read-only-cart-diagnostics',preflightStatus:preflight.status,
     preflightReason:preflight.reason,
     ...structure,network:{allowed,blocked,blockedGet},
     cartChanged:false,orderPlaced:false,
    };
   }finally{await page.close()}
  }finally{await context.close()}
 }finally{await browser.close()}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const result=await diagnoseFmicCart();
  console.log('FMIC SAFE CART DIAGNOSTIC:',JSON.stringify(result,null,2));
  console.log('Brak zmian koszyka. Wynik nie zawiera loginu, cookies ani tekstu strony.');
 }catch(error){
  console.error('FMIC SAFE STOP:',error instanceof Error?error.message:String(error));
  process.exitCode=1;
 }
}
