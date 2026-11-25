'use client';
import {useEffect,useMemo,useState,type Dispatch,type SetStateAction} from 'react';
import type {Product} from '../../../data';
import type {ShopSubcategory} from '../../../shop-departments';
import {buildCatalogFilters} from '../../../lib/catalog-filters';
import {productsInCategory,catalogValues,filterCatalogProducts} from '../../../lib/catalog-selection';
type Options={products:Product[];category:string;shopSubcategory:ShopSubcategory|null;engineFilter:string;setEngineFilter:Dispatch<SetStateAction<string>>;query:string;sort:string};
export function useCatalogFiltering({products,category,shopSubcategory,engineFilter,setEngineFilter,query,sort}:Options){
 const [technicalFilters,setTechnicalFilters]=useState<Record<string,string>>({});
 const catalogCategories=useMemo(()=>catalogValues(products.map(p=>p.category)),[products]);
 const activeCategoryProducts=useMemo(()=>productsInCategory(products,category,shopSubcategory),[products,category,shopSubcategory]);
 const technicalFilterOptions=useMemo(()=>buildCatalogFilters(activeCategoryProducts,category),[activeCategoryProducts,category]);
 useEffect(()=>setTechnicalFilters({}),[category,shopSubcategory]);
 const catalogEngines=useMemo(()=>catalogValues(productsInCategory(products,category,null).map(p=>p.engine)),[products,category]);
 useEffect(()=>{if(!catalogEngines.includes(engineFilter))setEngineFilter('Wszystkie')},[catalogEngines,engineFilter,setEngineFilter]);
 const filtered=useMemo(()=>filterCatalogProducts(activeCategoryProducts,query,engineFilter,technicalFilters,sort),[activeCategoryProducts,query,engineFilter,technicalFilters,sort]);
 return {technicalFilters,setTechnicalFilters,catalogCategories,catalogEngines,technicalFilterOptions,filtered};
}
