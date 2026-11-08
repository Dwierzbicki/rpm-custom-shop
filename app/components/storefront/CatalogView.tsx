'use client';
import {Menu,Settings2,X} from 'lucide-react';
import type {Product} from '../../data';
import type {ShopSubcategory} from '../../shop-departments';
import type {CatalogFilter} from '../../lib/catalog-filters';
import ProductCard from './ProductCard';

type Props = {
 lang:'pl'|'en';
 translate:(label:string)=>string;
 shopSubcategory:ShopSubcategory|null;
 mobileFiltersOpen:boolean;
 query:string;
 category:string;
 engineFilter:string;
 technicalFilters:Record<string,string>;
 sort:string;
 catalogCategories:string[];
 catalogEngines:string[];
 technicalFilterOptions:CatalogFilter[];
 filtered:Product[];
 onShowCategories:()=>void;
 onToggleMobileFilters:()=>void;
 onQuery:(value:string)=>void;
 onCategory:(value:string)=>void;
 onEngine:(value:string)=>void;
 onTechnicalFilter:(key:string,value:string)=>void;
 onClearTechnicalFilters:()=>void;
 onResetFilters:()=>void;
 onSort:(value:string)=>void;
 onOpenProduct:(product:Product)=>void;
};

/**
 * Controlled catalog UI. Filtering and navigation remain in the existing Shop
 * controller so header search, category URLs and state persistence keep working.
 */
export default function CatalogView({
 lang,translate:t,shopSubcategory,mobileFiltersOpen,query,category,engineFilter,
 technicalFilters,sort,catalogCategories,catalogEngines,technicalFilterOptions,
 filtered,onShowCategories,onToggleMobileFilters,onQuery,onCategory,onEngine,
 onTechnicalFilter,onClearTechnicalFilters,onResetFilters,onSort,onOpenProduct
}:Props){
 return (
<main className="page rpm-shop-page"><><button className="rpm-shop-back-categories" onClick={onShowCategories}><Menu size={17}/>{lang==='en'?'Browse categories':'Przeglądaj kategorie'}</button><div className="page-heading"><span className="eyebrow">RPM CUSTOM / SHOP</span><h1>{shopSubcategory?.name??t("KATALOG PRODUKTÓW")}</h1><p>{t("28 produktów demonstracyjnych. Ceny i opisy są testowe — nie stanowią oferty handlowej.")}</p></div><button className="rpm-mobile-filter-toggle" type="button" onClick={onToggleMobileFilters}><Settings2 size={18}/>{lang==='en'?'Filters':'Filtry produktów'}</button><div className="catalog-layout"><aside className={"filters rpm-catalog-filters"+(mobileFiltersOpen?" is-open":"")}><label>{t("WYSZUKIWARKA")}<input value={query} onChange={e=>onQuery(e.target.value)} placeholder={t("Nazwa, marka, SKU...")}/></label><label>{t("KATEGORIA")}<select value={category} onChange={e=>onCategory(e.target.value)}>{catalogCategories.map(c=><option key={c} value={c}>{t(c)}</option>)}</select></label><label>{t("SILNIK / ZASTOSOWANIE")}<select value={engineFilter} onChange={e=>onEngine(e.target.value)}>{catalogEngines.map(c=><option key={c} value={c}>{c==='Uniwersalne'?(lang==='en'?'Universal':'Uniwersalne'):t(c)}</option>)}</select></label><div className="rpm-technical-filters">{technicalFilterOptions.map(f=><label key={f.key}>{f.label}<select value={technicalFilters[f.key]??''} onChange={e=>onTechnicalFilter(f.key,e.target.value)}><option value="">{lang==='en'?'All':'Wszystkie'}</option>{f.values.map(v=><option key={v} value={v}>{v}</option>)}</select></label>)}{Object.values(technicalFilters).some(Boolean)&&<button type="button" className="rpm-technical-clear" onClick={onClearTechnicalFilters}>{lang==='en'?'Clear technical filters':'Wyczyść parametry'} <X size={14}/></button>}</div><button className="reset" onClick={onResetFilters}>{t("Wyczyść filtry")}</button></aside><div><div className="catalog-toolbar"><span>{t("Znaleziono: ")}<strong>{filtered.length}</strong></span><select value={sort} onChange={e=>onSort(e.target.value)}><option value="featured">{t("Domyślne")}</option><option value="priceAsc">{t("Cena: rosnąco")}</option><option value="priceDesc">{t("Cena: malejąco")}</option></select></div><div className="products-grid rpm-products-modern">{filtered.map(p=><ProductCard key={p.id} product={p} onOpen={onOpenProduct} translate={t}/>)}</div>{filtered.length===0&&<div className="empty">{t("Brak produktów. Zmień filtry.")}</div>}</div></div></></main>
 );
}
