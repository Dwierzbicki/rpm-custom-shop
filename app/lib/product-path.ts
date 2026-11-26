import {categorySlug} from '../category-routing';
// Keep ordinary SKU URLs unchanged. Reserved characters must not pass through
// an encoded path segment: some proxies decode %2F before route matching.
export function isPathSafeSku(sku:string){
 return /^[A-Za-z0-9_.-]+$/.test(sku)&&sku!=='.'&&sku!=='..';
}
export function productPath(name:string,sku:string){
 const slug=(categorySlug(name).slice(0,100).replace(/-$/,'')||'czesc');
 return '/produkt/'+slug+(isPathSafeSku(sku)?'/'+sku:'?'+new URLSearchParams({sku}).toString());
}
/** Next already decodes params and searchParams; do not decode a second time. */
export function productRouteSku(parts:string[]|undefined,query:string|string[]|undefined){
 if(parts?.length&&query!==undefined)return null;
 const sku=parts?.length?parts.join('/'):typeof query==='string'?query:null;
 return sku&&sku.length<=120?sku:null;
}
export function isCanonicalProductRoute(name:string,sku:string,slug:string,parts:string[]|undefined){
 const expectedSlug=categorySlug(name).slice(0,100).replace(/-$/,'')||'czesc';
 return slug===expectedSlug&&(isPathSafeSku(sku)?parts?.length===1&&parts[0]===sku:!parts?.length);
}
