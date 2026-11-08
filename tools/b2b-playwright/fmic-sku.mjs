/**
 * Read the SKU from FMIC's product page. Newer product cards use a plain
 * Tailwind-styled element with class="... sku", not Magento's old ".value"
 * child. Never infer SKU from a URL or title: an ambiguous or missing SKU
 * must block a cart write when an expected SKU was provided.
 */
export const fmicSkuSelectors=[
 '.product.attribute.sku .value',
 '[itemprop="sku"]',
 '.product-info-main .sku .value',
 '.product-info-main .sku',
 '.sku',
];

export function normalizeFmicSku(value){
 if(typeof value!=='string')return null;
 const normalized=value.replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim()
  .replace(/^(?:sku|symbol|kod produktu|indeks)\s*[:#-]?\s*/i,'').trim();
 return /^[A-Za-z0-9][A-Za-z0-9_.\/-]{1,119}$/.test(normalized)
  ?normalized:null;
}

export async function readFmicSku(page){
 for(const selector of fmicSkuSelectors){
  const locators=page.locator(selector);
  const count=await locators.count();
  if(count===0||count>12)continue;
  const found=new Map();
  for(let i=0;i<count;i++){
   const item=locators.nth(i);
   try{
    if(!await item.isVisible())continue;
    const parsed=normalizeFmicSku(await item.innerText({timeout:1500}));
    if(parsed)found.set(parsed.toUpperCase(),parsed);
   }catch{/* A missing or detached element cannot verify a SKU. */}
  }
  if(found.size>1)return null; // Multiple different visible SKUs: fail closed.
  if(found.size===1)return {selector,value:[...found.values()][0]};
 }
 return null;
}
