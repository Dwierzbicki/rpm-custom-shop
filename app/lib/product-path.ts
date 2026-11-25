import {categorySlug} from '../category-routing';
export function productPath(name:string,sku:string){
 const slug=(categorySlug(name).slice(0,100).replace(/-$/,'')||'czesc');
 return '/produkt/'+slug+'/'+encodeURIComponent(sku);
}
