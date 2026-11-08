import {normalizeFmicSku} from './fmic-sku.mjs';

// The cart quantity input is the only verified item anchor in FMIC's
// Tailwind cart. Other SKU selectors are hypotheses: verify within the
// same isolated row, never scrape the whole cart or infer from a title.
const qtySelector='input[id^="cart-"][id$="-qty"][name$="[qty]"]';
const skuSelectors=['.product-item-sku','.sku','[itemprop="sku"]','[data-sku]'];

/**
 * Returns exactly one visible SKU in a small isolated DOM ancestry around
 * a specific quantity input. Missing/ambiguous SKU => null (fail closed).
 * Never returns product names, URLs, HTML, cookies or account information.
 */
export async function readFmicCartItemSku(qtyInput){
 let raw;
 try{
  raw=await qtyInput.evaluate((input,{qtySelector,skuSelectors})=>{
   let parent=input.parentElement;
   for(let depth=0;parent&&depth<7;depth++,parent=parent.parentElement){
    if(parent.matches('main,body,html,form[action*="checkout"],.cart-summary,#cart-totals'))break;
    // Stop at an ancestor shared by more than one cart line:
    // its .sku could belong to another product.
    if(parent.querySelectorAll(qtySelector).length!==1)break;
    const values=new Set();
    for(const selector of skuSelectors){
     const nodes=parent.querySelectorAll(selector);
     if(nodes.length>10)return null;
     for(const node of nodes){
      const style=getComputedStyle(node);
      const rect=node.getBoundingClientRect();
      if(style.display==='none'||style.visibility==='hidden'||rect.width<=0||rect.height<=0)continue;
      const text=selector==='[data-sku]'?node.getAttribute('data-sku'):
       node.innerText??node.textContent;
      const trimmed=typeof text==='string'?text.trim():'';
      if(trimmed)values.add(trimmed);
     }
    }
    if(values.size>1)return null;
    if(values.size===1)return [...values][0];
   }
   return null;
  },{qtySelector,skuSelectors});
 }catch{return null}
 return normalizeFmicSku(raw);
}
