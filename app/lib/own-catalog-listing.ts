import {FMIC_CATEGORY_TREE,type SupplierCategory} from '../fmic-categories';
import {matchesSearch} from './header-search';
import type {Product} from '../data';
export type OwnCatalogItem=Product&{stockStatus?:string;visible?:boolean};
const categoryAliases:Record<string,string[]>={
 'Korbowody':['Silnik i turbo','Kute korbowody'],
 'Tłoki':['Silnik i turbo','Kute tłoki'],
 'Panewki':['Silnik i turbo','Panewki'],
 'Pierścienie':['Silnik i turbo','Tuleje i pierścienie tłokowe','Pierścienie tłokowe'],
 'Uszczelki głowicy':['Silnik i turbo','Uszczelki głowicy i silnika'],
 'Kolektory':['Układ wydechowy','Kolektory wydechowe'],
 'Turbo':['Silnik i turbo','Turbosprężarki','Turbosprężarki tuningowe'],
 'Intercoolery':['Układ chłodzenia','Intercoolery'],
 'Wastegate':['Układ wydechowy','Wastegate'],
 'Paliwo':['Układ paliwowy'],
 'Elektronika':['Elektronika'],
 'Mocowania głowicy':['Silnik i turbo'],
 'Wały korbowe':['Silnik i turbo']
};
export function ownCategoryPath(category:string):string[]{
 const alias=Object.prototype.hasOwnProperty.call(categoryAliases,category)?categoryAliases[category]:undefined;if(alias)return alias;
 const found:string[][]=[];
 function visit(nodes:SupplierCategory[],prefix:string[]){for(const n of nodes){const path=[...prefix,n.name];if(n.name===category)found.push(path);visit(n.children,path)}}
 visit(FMIC_CATEGORY_TREE,[]);
 return found.length===1?found[0]:[];
}
export function ownMatches(p:OwnCatalogItem,q:string){return !q||matchesSearch(q,[p.name,p.sku,p.brand,p.engine,p.category,...Object.values(p.attributes??{})])}
export function ownProductHref(id:number){return '/?product='+id}
export function ownInPath(category:string[],path:string[]){return path.every((v,i)=>category[i]===v)}
export function ownListingRows(products:OwnCatalogItem[],q:string,stock:string,min:number|null,max:number|null){
 return products.filter(p=>p.id>30&&p.visible!==false&&Number.isFinite(p.price)&&p.price>=0&&ownMatches(p,q)&&(stock==='all'||(stock==='available')===(p.stockStatus!=='unavailable'))&&(min===null||p.price>=min)&&(max===null||p.price<=max)).map(p=>({sku:p.sku,name:p.name,proposed_gross:p.price,available:p.stockStatus!=='unavailable',data:{brand:p.brand,images:p.images??[]},target_category:ownCategoryPath(p.category),own_id:p.id,stock_status:p.stockStatus??'available'}))
}
