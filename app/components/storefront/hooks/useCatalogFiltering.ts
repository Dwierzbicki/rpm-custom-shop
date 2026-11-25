'use client';
import {useEffect,useMemo,useState,type Dispatch,type SetStateAction} from 'react';
import type {Product} from '../../../data';
import type {ShopSubcategory} from '../../../shop-departments';
import {buildCatalogFilters} from '../../../lib/catalog-filters';
import {productsInCategory,catalogValues,filterCatalogProducts} from '../../../lib/catalog-selection';
type Options={enabled?:boolean;products:Product[];category:string;shopSubcategory:ShopSubcategory|null;engineFilter:string;setEngineFilter:Dispatch<SetStateAction<string>>;query:string;sort:string};
export function useCatalogFiltering({enabled=true,products,category,shopSubcategory,engineFilter,setEngineFilter,query,sort}:Options){
 const [technicalFilters,setTechnicalFilters]=useState<Record<string,string>>({});
 const catalogCategories=useMemo(()=>enabled?catalogValues(products.map(p=>p.category)):[],[enabled,products]);
 const activeCategoryProducts=useMemo(()=>enabled?productsInCategory(products,category,shopSubcategory):[],[enabled,products,category,shopSubcategory]);
 const technicalFilterOptions=useMemo(()=>buildCatalogFilters(enabled?activeCategoryProducts:[],category),[enabled,activeCategoryProducts,category]);
 useEffect(()=>setTechnicalFilters({}),[category,shopSubcategory]);
 const catalogEngines=useMemo(()=>enabled?catalogValues(productsInCategory(products,category,null).map(p=>p.engine)):[],[enabled,products,category]);
 useEffect(()=>{if(enabled&&!catalogEngines.includes(engineFilter))setEngineFilter('Wszystkie')},[enabled,catalogEngines,engineFilter,setEngineFilter]);
 const filtered=useMemo(()=>enabled?filterCatalogProducts(activeCategoryProducts,query,engineFilter,technicalFilters,sort):[],[enabled,activeCategoryProducts,query,engineFilter,technicalFilters,sort]);
 return {technicalFilters,setTechnicalFilters,catalogCategories,catalogEngines,technicalFilterOptions,filtered};
}
