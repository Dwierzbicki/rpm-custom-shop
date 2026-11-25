'use client';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
import ProductBrandLogo from './ProductBrandLogo';
import ProductImage from './ProductImage';
import {useEffect,useState,type MouseEvent} from 'react';
import {Search,SlidersHorizontal,ChevronLeft,ChevronRight,ArrowRight,Package,Grid2X2,List} from 'lucide-react';
import '../../styles/fmic-listing.css';
import FmicProductPreview from './FmicProductPreview';
import {productPath} from '../../lib/product-path';
import {matchesSearch} from '../../lib/header-search';
import type {CatalogItem} from '../../lib/catalog-db';
import {categoryPath,resolveCategoryPath,manualCategoryPath} from '../../category-routing';
import {buildSearchTree,searchCategoryHref,visibleCategories,type CategoryCount,type CategoryNode} from '../../lib/search-category-tree';
type BranchProps={current:string;query:string;onSelect:(event:MouseEvent<HTMLAnchorElement>,path:string)=>void};
function SearchBranches({nodes,current,query,onSelect,limit=5}:{nodes:CategoryNode[];limit?:number}&BranchProps){
 const {t}=useStorefrontLanguage();
 const [showAll,setShowAll]=useState(false);
 const shown=visibleCategories(nodes,resolveCategoryPath(current)??[],limit,showAll);
 return <>{shown.map(node=><SearchBranch key={node.name} node={node} current={current} query={query} onSelect={onSelect}/>)}{nodes.length>limit&&<button className="fplp-more-categories" type="button" aria-expanded={showAll} onClick={()=>setShowAll(v=>!v)}>{showAll?t('Pokaż mniej'):t('Pokaż więcej (')+(nodes.length-limit)+')'}</button>}</>
}
function SearchBranch({node,current,query,onSelect}:{node:CategoryNode}&BranchProps){
 const {t}=useStorefrontLanguage();
 const href=categoryPath(node.path);
 const active=current===href||current.startsWith(href+'/');
 const [manual,setManual]=useState<boolean|null>(null);
 useEffect(()=>{setManual(null)},[current]);
 const expanded=manual??active;
 return <div className="fplp-category-branch"><div className="fplp-category-row">{node.children.length>0?<button type="button" aria-label={(expanded?t('Zwiń '):t('Rozwiń '))+t(node.name)} aria-expanded={expanded} onClick={()=>setManual(!expanded)}><ChevronRight size={14} style={{transform:expanded?'rotate(90deg)':'none'}}/></button>:<span className="fplp-category-spacer"/>}<a aria-current={current===href?'page':undefined} href={searchCategoryHref(href,query)} onClick={e=>{if(node.children.length&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&e.button===0)setManual(true);onSelect(e,href)}}><span>{t(node.name)}</span><small>{node.count.toLocaleString('pl-PL')}</small></a></div>{expanded&&node.children.length>0&&<div className="fplp-category-children"><SearchBranches nodes={node.children} current={current} query={query} onSelect={onSelect}/></div>}</div>
}
type Facet={key:string;label:string;options:{value:string;count:number}[]};
function ProducerFilter({facet,value,onChange}:{facet:Facet;value:string;onChange:(value:string)=>void}){
 const {t}=useStorefrontLanguage();
 const [query,setQuery]=useState(''),[expanded,setExpanded]=useState(false);
 const options=facet.options.filter(o=>o.value.toLocaleLowerCase('pl').includes(query.toLocaleLowerCase('pl')));
 const shown=expanded||query?options:options.slice(0,6);
 return <details className="fplp-filter-section" open><summary>{t("Producent")}</summary><div className="fplp-brand-search"><Search size={15}/><input aria-label={t("Szukaj producenta")} placeholder={t("Szukaj producenta…")} value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="fplp-brand-options"><label className="fplp-brand-option"><input type="radio" name="fplp-producer" checked={!value} onChange={()=>onChange('')}/>{t("Wszyscy producenci")}</label>{value&&!shown.some(o=>o.value===value)&&<label className="fplp-brand-option"><input type="radio" name="fplp-producer" checked readOnly/>{value}<small>{facet.options.find(o=>o.value===value)?.count??0}</small></label>}{shown.map(o=><label className="fplp-brand-option" key={o.value}><input type="radio" name="fplp-producer" checked={value===o.value} onChange={()=>onChange(o.value)}/><span>{o.value}</span><small>{o.count.toLocaleString('pl-PL')}</small></label>)}{!options.length&&<small>{t("Brak pasujących producentów")}</small>}</div>{!query&&options.length>6&&<button className="fplp-more-categories" type="button" onClick={()=>setExpanded(v=>!v)}>{expanded?t('Pokaż mniej'):t('Pokaż więcej (')+(options.length-6)+')'}</button>}</details>
}
const ownCategory=manualCategoryPath;
const ownHref=(p:CatalogItem)=>'/?product='+encodeURIComponent(String(p.id));
type Result={includesManual?:boolean;categories?:CategoryCount[];facets?:Facet[];items:{sku:string;name:string;proposed_gross:string;available:boolean;image:string|null;brand?:string|null;manual_id?:number|null;manual_stock_status?:string|null}[];total:number;page:number;size:number;path:string[]};
export default function FmicPreview({pathname,lang,sort,globalQuery='',onCategorySelect}:{pathname:string;lang:'pl'|'en';sort:string;globalQuery?:string;onCategorySelect:(path:string,query:string)=>void}){
 const {t}=useStorefrontLanguage();
 const [data,setData]=useState<Result|null>(null),[page,setPage]=useState(1),[q,setQ]=useState(globalQuery),[search,setSearch]=useState(globalQuery),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [stock,setStock]=useState('all'),[order,setOrder]=useState(sort),[filtersOpen,setFiltersOpen]=useState(false),[layout,setLayout]=useState('grid');
 const [facets,setFacets]=useState<Facet[]>([]),[selected,setSelected]=useState<Record<string,string>>({}),[min,setMin]=useState(''),[max,setMax]=useState(''),[price,setPrice]=useState({min:'',max:''});
 const [categories,setCategories]=useState<CategoryCount[]>([]),[treeOpen,setTreeOpen]=useState(true);
 const [sku,setSku]=useState('');
 const [ownProducts,setOwnProducts]=useState<CatalogItem[]>([]);
 const [ownError,setOwnError]=useState(false);
 useEffect(()=>{const controller=new AbortController();fetch('/api/catalog',{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('Own catalog unavailable');return r.json()}).then(d=>{if(!controller.signal.aborted)setOwnProducts(Array.isArray(d.products)?d.products.filter((p:CatalogItem)=>p.visible!==false):[])}).catch(()=>{if(!controller.signal.aborted)setOwnError(true)});return()=>controller.abort()},[]);
 useEffect(()=>{const sync=()=>setSku(new URLSearchParams(window.location.search).get('sku')??'');sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[pathname]);
 function openProduct(next:string,name?:string){const item=data?.items.find(p=>p.sku===next);window.location.assign(item?.manual_id?'/?product='+item.manual_id:productPath(name??item?.name??'czesc',next))}
 function closeProduct(){const url=new URL(window.location.href);url.searchParams.delete('sku');window.history.pushState({},'',url.pathname+url.search);setSku('');window.scrollTo({top:0})}
 const path=resolveCategoryPath(pathname);
 useEffect(()=>{setPage(1);setSelected({});setFacets([]);setSku(new URLSearchParams(window.location.search).get('sku')??'')},[pathname]);
 useEffect(()=>{setPage(1);setQ(globalQuery);setSearch(globalQuery);setSelected({});setFacets([]);setCategories([]);setStock('all');setMin('');setMax('');setPrice({min:'',max:''})},[globalQuery]);
 function selectCategory(e:MouseEvent<HTMLAnchorElement>,next:string){if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();if(next===pathname)return;setPage(1);setSelected({});setFacets([]);setData(null);setBusy(true);onCategorySelect(next,search)}
 useEffect(()=>{
 if(sku||new URLSearchParams(window.location.search).has('sku')||!resolveCategoryPath(pathname))return;
 const controller=new AbortController();setBusy(true);setError('');setData(null);
 const params=new URLSearchParams({category:pathname,page:String(page),q:search,sort:order,stock,...selected,...price});
 fetch('/api/catalog/fmic?'+params,{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw Error(r.status===401?'Zaloguj się do sklepu.':'Nie udało się pobrać produktów FMIC.');return r.json()}).then(d=>{if(!controller.signal.aborted){setData(d);setFacets(d.facets??[]);setCategories(d.categories??[])}}).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setBusy(false)});
 return()=>controller.abort();
 },[pathname,page,search,order,stock,selected,price,sku]);
 if(sku&&path)return <FmicProductPreview key={sku} sku={sku} onBack={closeProduct} onOpen={openProduct}/>;
 if(!path)return <p>{t("Wybierz kategorię z menu, aby zobaczyć produkty FMIC.")}</p>;
 const pages=Math.max(1,Math.ceil((data?.total??0)/(data?.size??24)));
 const title=search?'Wyniki wyszukiwania: '+search+(path.length?' · '+path.at(-1):''):(path.at(-1)??'Wyszukiwarka produktów');
 const ownBase=(data?.includesManual?[]:ownProducts).filter(p=>{const available=p.stockStatus==='available';return (!search||matchesSearch(search,[p.name,p.sku,p.brand,p.category,p.engine,p.description,...ownCategory(p),...Object.values(p.attributes??{})]))&&(stock==='all'||(stock==='available'?available:!available))&&(!price.min||p.price>=Number(price.min))&&(!price.max||p.price<=Number(price.max))});
 const ownInCategory=ownBase.filter(p=>path.every((name,i)=>ownCategory(p)[i]===name));
 const ownMatches=ownInCategory.filter(p=>Object.entries(selected).every(([key,value])=>!value||(key==='producer'&&p.brand.toLocaleLowerCase('pl')===value.toLocaleLowerCase('pl')))).sort((a,b)=>order==='priceAsc'?a.price-b.price:order==='priceDesc'?b.price-a.price:a.id-b.id);
 const ownCategoryCounts=ownBase.map(p=>({path:ownCategory(p),count:1}));
 const tree=buildSearchTree([...categories,...ownCategoryCounts]);
 const producer=facets.find(f=>f.key==='producer');
 const producerOptions=new Map((producer?.options??[]).map(o=>[o.value,o.count]));
 for(const p of ownInCategory){if(p.brand){const key=[...producerOptions.keys()].find(k=>k.toLocaleLowerCase('pl')===p.brand.toLocaleLowerCase('pl'))??p.brand;producerOptions.set(key,(producerOptions.get(key)??0)+1)}}
 const mergedFacets=producerOptions.size? [...facets.filter(f=>f.key!=='producer'),{key:'producer',label:'Producent',options:[...producerOptions].map(([value,count])=>({value,count})).sort((a,b)=>a.value.localeCompare(b.value,'pl'))}]:facets;
 const go=(next:number)=>{setPage(next);window.scrollTo({top:0,behavior:'smooth'})};
 const reset=()=>{setQ(globalQuery);setSearch(globalQuery);setStock('all');setPage(1);setOrder('featured');setSelected({});setMin('');setMax('');setPrice({min:'',max:''})};
 const pageNumbers=Array.from(new Set([1,...Array.from({length:5},(_,i)=>page+i-2).filter(n=>n>1&&n<pages),pages])).sort((a,b)=>a-b);
 return <section className="fmic-plp">
 <nav className="fplp-crumbs" aria-label={t("Ścieżka kategorii")}><a href="/sklep">{t("Sklep")}</a>{path.map((name,i)=><span key={i}><ChevronRight size={13}/>{i===path.length-1?<strong>{t(name)}</strong>:<a href={searchCategoryHref(categoryPath(path.slice(0,i+1)),search)} onClick={e=>selectCategory(e,categoryPath(path.slice(0,i+1)))}>{t(name)}</a>}</span>)}</nav>
 <header className="fplp-heading"><div><span className="eyebrow">{search?t('WYNIKI WYSZUKIWANIA'):t('KATALOG PRODUKTÓW')}</span><h1>{search?<>{t("Wyniki wyszukiwania: ")}<em>„{search}”</em>{path.length>0&&<span className="fplp-title-category"> / {t(path.at(-1)??'')}</span>}</>:t(title)}</h1></div>{data&&<span className="fplp-heading-count">{(data.total+ownMatches.length).toLocaleString('pl-PL')} {lang==='en'?'products':'produktów'}</span>}</header>
 {search&&tree.length>0&&<nav className="fplp-quick-categories" aria-label={t("Szybkie kategorie")}><a aria-current={!path.length?'page':undefined} href={searchCategoryHref('/sklep',search)} onClick={e=>selectCategory(e,'/sklep')}><Grid2X2 size={17}/> {t("Wszystkie")} <small>{tree.reduce((n,c)=>n+c.count,0).toLocaleString('pl-PL')}</small></a>{tree.map(node=>{const href=categoryPath(node.path);return <a key={href} aria-current={pathname===href||pathname.startsWith(href+'/')?'page':undefined} href={searchCategoryHref(href,search)} onClick={e=>selectCategory(e,href)}><Package size={16}/>{t(node.name)}<small>{node.count.toLocaleString('pl-PL')}</small></a>})}</nav>}
 <div className="fplp-layout"><aside className={'fplp-filters '+(filtersOpen?'is-open':'')}><div className="fplp-filter-heading"><strong><SlidersHorizontal size={17}/> {t("Filtry")}</strong><button type="button" onClick={reset}>{t("Wyczyść wszystko")}</button></div>
 <form onSubmit={e=>{e.preventDefault();setPage(1);setSelected({});setFacets([]);setSearch(q.trim());setFiltersOpen(false)}}><label htmlFor="fplp-search">{t("Szukaj produktów")}</label><div className="fplp-search"><input id="fplp-search" placeholder={t("Nazwa, SKU, EAN")} value={q} onChange={e=>setQ(e.target.value)} maxLength={120}/><button aria-label={t("Szukaj")} type="submit"><Search size={17}/></button></div></form>
 {search&&tree.length>0&&<nav className="fplp-search-tree" aria-label={t("Kategorie wyników")}><button type="button" className="fplp-tree-toggle" aria-expanded={treeOpen} onClick={()=>setTreeOpen(v=>!v)}>{t("Pasujące kategorie")} <ChevronRight size={15} style={{transform:treeOpen?'rotate(90deg)':'none'}}/></button>{treeOpen&&<><a className="fplp-all-categories" aria-current={!path.length?'page':undefined} href={searchCategoryHref('/sklep',search)} onClick={e=>selectCategory(e,'/sklep')}>{t("Wszystkie kategorie")} <small>{tree.reduce((n,c)=>n+c.count,0).toLocaleString('pl-PL')}</small></a><SearchBranches nodes={tree} current={pathname} query={search} onSelect={selectCategory} limit={6}/></>}</nav>}
 <fieldset><legend>{t("Dostępność")}</legend>{[['all','Wszystkie produkty'],['available','Dostępne'],['unavailable','Niedostępne']].map(([v,label])=><label className="fplp-radio" key={v}><input type="radio" name="stock" checked={stock===v} onChange={()=>{setStock(v);setPage(1)}}/>{t(label)}</label>)}</fieldset>
 <form className="fplp-price" onSubmit={e=>{e.preventDefault();if(min&&max&&Number(min)>Number(max))return;setPrice({min,max});setPage(1)}}><label>{t("Cena brutto (zł)")}</label><div><input aria-label={t("Cena od")} placeholder={t("Od")} type="number" min="0" step="0.01" value={min} onChange={e=>setMin(e.target.value)}/><input aria-label={t("Cena do")} placeholder={t("Do")} type="number" min="0" step="0.01" value={max} onChange={e=>setMax(e.target.value)}/></div><button className="outline" type="submit">{t("Zastosuj")}</button></form>
 {mergedFacets.map(f=>f.key==='producer'?<ProducerFilter key={f.key} facet={f} value={selected[f.key]??''} onChange={value=>{setSelected(old=>({...old,[f.key]:value}));setPage(1)}}/>:<label key={f.key} className="fplp-facet"><span>{t(f.label)}</span><select value={selected[f.key]??''} onChange={e=>{setSelected(old=>({...old,[f.key]:e.target.value}));setPage(1)}}><option value="">{t("Wszystkie")}</option>{selected[f.key]&&!f.options.some(o=>o.value===selected[f.key])&&<option value={selected[f.key]}>{selected[f.key]} (0)</option>}{f.options.map(o=><option key={o.value} value={o.value}>{o.value} ({o.count})</option>)}</select></label>)}
 </aside>
 <div className="fplp-main"><div className="fplp-toolbar"><button className="fplp-mobile-filter" onClick={()=>setFiltersOpen(v=>!v)}><SlidersHorizontal size={16}/> {t("Filtry")}</button><span className="fplp-count" aria-live="polite">{data?<><strong>{data.total.toLocaleString('pl-PL')}</strong> {data.includesManual?(lang==='en'?'products':'produktów'):(lang==='en'?'supplier products':'produktów dostawcy')}{ownMatches.length>0&&<> + <strong>{ownMatches.length}</strong> RPM</>}</>:busy?t('Ładowanie…'):''}</span><label className="fplp-sort"><span>{t("Sortuj:")}</span><select value={order} onChange={e=>{setOrder(e.target.value);setPage(1)}}><option value="featured">{t("Domyślnie")}</option><option value="priceAsc">{t("Cena rosnąco")}</option><option value="priceDesc">{t("Cena malejąco")}</option></select></label><div className="fplp-view"><button aria-label={t("Widok siatki")} aria-pressed={layout==='grid'} onClick={()=>setLayout('grid')}><Grid2X2 size={17}/></button><button aria-label={t("Widok listy")} aria-pressed={layout==='list'} onClick={()=>setLayout('list')}><List size={17}/></button></div></div>
 <div className="fplp-active-filters">{(search||stock!=='all'||price.min||price.max||Object.values(selected).some(Boolean))&&<span>{t("Aktywne filtry:")}</span>}
 {search&&<button className="fplp-chip" onClick={()=>{setQ('');setSearch('');setSelected({});setFacets([]);setPage(1)}}>{search} ×</button>}
 {Object.entries(selected).filter(([,value])=>value).map(([key,value])=><button key={key} type="button" className="fplp-chip" onClick={()=>{setSelected(old=>{const next={...old};delete next[key];return next});setPage(1)}}>{facets.find(f=>f.key===key)?.label??key}: {value} ×</button>)}
 {stock!=='all'&&<button className="fplp-chip" onClick={()=>{setStock('all');setPage(1)}}>{stock==='available'?t('Dostępne'):t('Niedostępne')} ×</button>}{(price.min||price.max)&&<button className="fplp-chip" onClick={()=>{setMin('');setMax('');setPrice({min:'',max:''});setPage(1)}}>{t('Cena: ')}{price.min||'0'} – {price.max||t('bez limitu')} zł ×</button>}</div>
 {ownError&&!data?.includesManual&&<p role="status">{lang==='en'?'Manual catalog temporarily unavailable.':'Produkty własne chwilowo niedostępne.'}</p>}
 {page===1&&ownMatches.length>0&&<section aria-label={lang==='en'?'RPM Custom offers':'Oferty RPM Custom'}><h2>{lang==='en'?'RPM Custom offers':'Oferty RPM Custom'} ({ownMatches.length})</h2><div className={'fplp-grid '+(layout==='list'?'fplp-list':'')}>{ownMatches.map(p=><article key={'own-'+p.id} className="fplp-card"><a className="fplp-image" href={ownHref(p)}><ProductImage src={p.images?.[0]??null} alt={p.name}/></a><div className="fplp-card-info"><div className="fplp-card-meta"><small className="fplp-sku">{p.sku}</small><ProductBrandLogo brand={p.brand} name={p.name}/></div><a className="fplp-name" href={ownHref(p)} title={p.name}>{p.name}</a><span className={'fplp-stock '+(p.stockStatus==='available'?'':'out')}><i/>{p.stockStatus==='available'?t('Dostępny'):p.stockStatus==='order'?t('Na zamówienie'):t('Niedostępny')}</span><div className="fplp-card-bottom"><div><strong>{p.price.toLocaleString('pl-PL',{style:'currency',currency:'PLN'})}</strong><small>{t('brutto')}</small></div><button onClick={()=>window.location.assign(ownHref(p))} aria-label={t('Zobacz ')+p.name}><span>{t('Zobacz produkt')}</span><ArrowRight size={17}/></button></div></div></article>)}</div></section>}
 {error&&<p role="alert">{t(error)}</p>}
 {busy&&<div className="fplp-grid" aria-label={t("Ładowanie produktów")}>{Array.from({length:8},(_,i)=><div key={i} className="fplp-skeleton"/>)}</div>}
 {data&&<><div className={'fplp-grid '+(layout==='list'?'fplp-list':'')}>{data.items.map(p=>{const href=p.manual_id?'/?product='+p.manual_id:productPath(p.name,p.sku);return <article key={p.sku} className="fplp-card"><a href={href} className="fplp-image" onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();openProduct(p.sku,p.name)}}><ProductImage src={p.image} alt={p.name}/></a><div className="fplp-card-info"><div className="fplp-card-meta"><small className="fplp-sku">{p.sku}</small><ProductBrandLogo brand={p.brand} name={p.name}/></div><a className="fplp-name" href={href} title={p.name} onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();openProduct(p.sku,p.name)}}>{p.name}</a><span className={'fplp-stock '+(p.available?'':'out')}><i/>{p.available?t('Dostępny'):p.manual_stock_status==='order'?t('Na zamówienie'):t('Niedostępny')}</span><div className="fplp-card-bottom"><div><strong>{Number(p.proposed_gross).toLocaleString('pl-PL',{style:'currency',currency:'PLN'})}</strong><small>{t("brutto")}</small></div><button onClick={()=>openProduct(p.sku,p.name)} aria-label={t('Zobacz ')+p.name}><span>{t("Zobacz produkt")}</span><ArrowRight size={17}/></button></div></div></article>})}</div>
 {!data.items.length&&!ownMatches.length&&<div className="fplp-empty"><Package size={32}/><h2>{t("Brak produktów")}</h2><p>{t("Zmień kryteria wyszukiwania.")}</p><button className="outline" onClick={reset}>{t("Wyczyść filtry")}</button></div>}
 {pages>1&&<nav className="fplp-pagination" aria-label={t("Paginacja")}><button aria-label={t("Poprzednia strona")} disabled={page<=1||busy} onClick={()=>go(page-1)}><ChevronLeft size={18}/></button>{pageNumbers.map((n,i)=><span key={n}>{i>0&&n-pageNumbers[i-1]>1&&<small>…</small>}<button aria-current={n===page?'page':undefined} disabled={busy} onClick={()=>go(n)}>{n}</button></span>)}<button aria-label={t("Następna strona")} disabled={page>=pages||busy} onClick={()=>go(page+1)}><ChevronRight size={18}/></button></nav>}</>}
 </div></div></section>
}
