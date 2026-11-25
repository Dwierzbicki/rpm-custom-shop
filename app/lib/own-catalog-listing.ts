import {manualCategoryPath,validCategoryPath} from '../category-routing';
import {matchesSearch} from './header-search';
import type {Product} from '../data';
export type OwnCatalogItem=Product&{stockStatus?:string;visible?:boolean};
export function ownCategoryPath(category:string,targetCategory?:string[]):string[]{
 if(['__proto__','constructor','prototype'].includes(category))return [];
 const path=manualCategoryPath({category,targetCategory});
 return validCategoryPath(path)?path:[];
}
export function ownMatches(p:OwnCatalogItem,q:string){return !q||matchesSearch(q,[p.name,p.sku,p.brand,p.engine,p.category,...ownCategoryPath(p.category,p.targetCategory),...Object.values(p.attributes??{})])}
export function ownProductHref(id:number){return '/?product='+id}
export function ownInPath(category:string[],path:string[]){return path.every((v,i)=>category[i]===v)}
export function ownListingRows(products:OwnCatalogItem[],q:string,stock:string,min:number|null,max:number|null){
 return products.filter(p=>p.id>30&&p.visible!==false&&Number.isFinite(p.price)&&p.price>=0&&ownMatches(p,q)&&(stock==='all'||(stock==='available')===(p.stockStatus!=='unavailable'))&&(min===null||p.price>=min)&&(max===null||p.price<=max)).map(p=>({sku:p.sku,name:p.name,proposed_gross:p.price,available:p.stockStatus!=='unavailable',data:{brand:p.brand,images:p.images??[]},target_category:ownCategoryPath(p.category,p.targetCategory),own_id:p.id,stock_status:p.stockStatus??'available'}))
}
