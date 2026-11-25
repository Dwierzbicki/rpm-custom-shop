import type {Product} from '../data';
import type {ShopSubcategory} from '../shop-departments';
import {matchesCatalogAttributes} from './catalog-filters';
export function productsInCategory(products:Product[],category:string,subcategory:ShopSubcategory|null){
 return products.filter(p=>(category==='Wszystkie'||p.category===category)&&(!subcategory?.keywords?.length||subcategory.keywords.some(k=>[p.name,p.description??'',p.sku].join(' ').toLocaleLowerCase('pl').includes(k.toLocaleLowerCase('pl')))));
}
export function catalogValues(values:string[]){
 return ['Wszystkie',...Array.from(new Set(values.filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pl'))];
}
export function filterCatalogProducts(products:Product[],query:string,engineFilter:string,technicalFilters:Record<string,string>,sort:string){
 const needle=query.trim().toLocaleLowerCase('pl');
 const result=products.filter(p=>(engineFilter==='Wszystkie'||p.engine===engineFilter)&&matchesCatalogAttributes(p,technicalFilters)&&`${p.name} ${p.brand} ${p.sku} ${p.engine} ${p.description??''}`.toLocaleLowerCase('pl').includes(needle));
 if(sort==='priceAsc')result.sort((a,b)=>a.price-b.price);
 if(sort==='priceDesc')result.sort((a,b)=>b.price-a.price);
 return result;
}
