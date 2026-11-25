import {resolveCategoryPath} from '../category-routing';
import type {View} from './storefront-config';
const viewPaths:Partial<Record<View,string>>={home:'/',catalog:'/sklep',guides:'/power-guides',cart:'/koszyk',garage:'/garage'};
export function storefrontPath(view:View){return viewPaths[view]??null}
export function storefrontLocation(pathname:string,search:string){
 const category=resolveCategoryPath(pathname);
 if(category!==null)return {view:'catalog' as const,query:new URLSearchParams(search).get('q')??'',category};
 const view=(Object.keys(viewPaths) as View[]).find(key=>viewPaths[key]===pathname)??null;
 return {view,query:'',category:null};
}
export function pushStorefrontPath(path:string){
 if(window.location.pathname+window.location.search!==path)window.history.pushState({},'',path);
}
