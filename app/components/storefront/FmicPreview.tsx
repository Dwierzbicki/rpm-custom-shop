'use client';
import {useEffect,useState} from 'react';
import {Search,SlidersHorizontal,ChevronLeft,ChevronRight,ArrowRight,Package,Grid2X2,List} from 'lucide-react';
import '../../styles/fmic-listing.css';
import FmicProductPreview from './FmicProductPreview';
import {categoryPath,resolveCategoryPath} from '../../category-routing';
type Facet={key:string;label:string;options:{value:string;count:number}[]};
type Result={facets?:Facet[];items:{sku:string;name:string;proposed_gross:string;available:boolean;image:string|null}[];total:number;page:number;size:number;path:string[]};
export default function FmicPreview({pathname,lang,sort,globalQuery=''}:{pathname:string;lang:'pl'|'en';sort:string;globalQuery?:string}){
 const [data,setData]=useState<Result|null>(null),[page,setPage]=useState(1),[q,setQ]=useState(''),[search,setSearch]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [stock,setStock]=useState('all'),[order,setOrder]=useState(sort),[filtersOpen,setFiltersOpen]=useState(false),[layout,setLayout]=useState('grid');
 const [facets,setFacets]=useState<Facet[]>([]),[selected,setSelected]=useState<Record<string,string>>({}),[min,setMin]=useState(''),[max,setMax]=useState(''),[price,setPrice]=useState({min:'',max:''});
 const [sku,setSku]=useState('');
 useEffect(()=>{const sync=()=>setSku(new URLSearchParams(window.location.search).get('sku')??'');sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[pathname]);
 function openProduct(next:string){const url=new URL(window.location.href);url.searchParams.set('fmicPreview','1');url.searchParams.set('sku',next);window.history.pushState({},'',url.pathname+url.search);setSku(next);window.scrollTo({top:0})}
 function closeProduct(){const url=new URL(window.location.href);url.searchParams.delete('sku');window.history.pushState({},'',url.pathname+url.search);setSku('');window.scrollTo({top:0})}
 const path=resolveCategoryPath(pathname);
 useEffect(()=>{setPage(1);setQ(globalQuery);setSearch(globalQuery);setSku(new URLSearchParams(window.location.search).get('sku')??'');setStock('all');setSelected({});setFacets([]);setMin('');setMax('');setPrice({min:'',max:''})},[pathname,globalQuery]);
 useEffect(()=>{
 if(!resolveCategoryPath(pathname))return;
 const controller=new AbortController();setBusy(true);setError('');setData(null);
 const params=new URLSearchParams({category:pathname,page:String(page),q:search,sort:order,stock,...selected,...price});
 fetch('/api/admin/fmic-preview?'+params,{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw Error(r.status===401?'Zaloguj się do panelu administratora.':'Nie udało się pobrać produktów FMIC.');return r.json()}).then(d=>{if(!controller.signal.aborted){setData(d);setFacets(d.facets??[])}}).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setBusy(false)});
 return()=>controller.abort();
 },[pathname,page,search,order,stock,selected,price]);
 if(sku&&path)return <FmicProductPreview key={sku} sku={sku} onBack={closeProduct} onOpen={openProduct}/>;
 if(!path)return <p>Wybierz kategorię z menu, aby zobaczyć produkty FMIC.</p>;
 const pages=Math.max(1,Math.ceil((data?.total??0)/(data?.size??24)));
 const title=path[path.length-1]??(search?'Wyniki wyszukiwania: '+search:'Wyszukiwarka produktów');
 const go=(next:number)=>{setPage(next);window.scrollTo({top:0,behavior:'smooth'})};
 const reset=()=>{setQ('');setSearch('');setStock('all');setPage(1);setOrder('featured');setSelected({});setMin('');setMax('');setPrice({min:'',max:''})};
 const pageNumbers=Array.from(new Set([1,...Array.from({length:5},(_,i)=>page+i-2).filter(n=>n>1&&n<pages),pages])).sort((a,b)=>a-b);
 return <section className="fmic-plp">
 <nav className="fplp-crumbs" aria-label="Ścieżka kategorii"><a href="/sklep?fmicPreview=1">Sklep</a>{path.map((name,i)=><span key={i}><ChevronRight size={13}/>{i===path.length-1?<strong>{name}</strong>:<a href={categoryPath(path.slice(0,i+1))+'?fmicPreview=1'}>{name}</a>}</span>)}</nav>
 <header className="fplp-heading"><div><span className="eyebrow">RPM CUSTOM / MOTO LAB</span><h1>{title}</h1></div><small>Podgląd administratora · sprzedaż wyłączona</small></header>
 <div className="fplp-layout"><aside className={'fplp-filters '+(filtersOpen?'is-open':'')}><div className="fplp-filter-heading"><strong><SlidersHorizontal size={17}/> Filtry</strong><button type="button" onClick={reset}>Wyczyść</button></div>
 <form onSubmit={e=>{e.preventDefault();setPage(1);setSearch(q);setFiltersOpen(false)}}><label htmlFor="fplp-search">Szukaj produktów</label><div className="fplp-search"><input id="fplp-search" placeholder="Nazwa, SKU, EAN" value={q} onChange={e=>setQ(e.target.value)} maxLength={120}/><button aria-label="Szukaj" type="submit"><Search size={17}/></button></div></form>
 <fieldset><legend>Dostępność</legend>{[['all','Wszystkie produkty'],['available','Dostępne'],['unavailable','Niedostępne']].map(([v,label])=><label className="fplp-radio" key={v}><input type="radio" name="stock" checked={stock===v} onChange={()=>{setStock(v);setPage(1)}}/>{label}</label>)}</fieldset>
 <form className="fplp-price" onSubmit={e=>{e.preventDefault();if(min&&max&&Number(min)>Number(max))return;setPrice({min,max});setPage(1)}}><label>Cena brutto (zł)</label><div><input aria-label="Cena od" placeholder="Od" type="number" min="0" step="0.01" value={min} onChange={e=>setMin(e.target.value)}/><input aria-label="Cena do" placeholder="Do" type="number" min="0" step="0.01" value={max} onChange={e=>setMax(e.target.value)}/></div><button className="outline" type="submit">Zastosuj</button></form>
 {facets.map(f=><label key={f.key} className="fplp-facet"><span>{f.label}</span><select value={selected[f.key]??''} onChange={e=>{setSelected(old=>({...old,[f.key]:e.target.value}));setPage(1)}}><option value="">Wszystkie</option>{selected[f.key]&&!f.options.some(o=>o.value===selected[f.key])&&<option value={selected[f.key]}>{selected[f.key]} (0)</option>}{f.options.map(o=><option key={o.value} value={o.value}>{o.value} ({o.count})</option>)}</select></label>)}
 <div className="fplp-filter-note">Dane pochodzą z aktualnego katalogu dostawcy. Cena jest proponowaną ceną brutto.</div></aside>
 <div className="fplp-main"><div className="fplp-toolbar"><button className="fplp-mobile-filter" onClick={()=>setFiltersOpen(v=>!v)}><SlidersHorizontal size={16}/> Filtry</button><span className="fplp-count">{data?<><strong>{data.total.toLocaleString('pl-PL')}</strong> produktów</>:busy?'Ładowanie…':''}</span><label className="fplp-sort"><span>Sortuj:</span><select value={order} onChange={e=>{setOrder(e.target.value);setPage(1)}}><option value="featured">Domyślnie</option><option value="priceAsc">Cena rosnąco</option><option value="priceDesc">Cena malejąco</option></select></label><div className="fplp-view"><button aria-label="Widok siatki" aria-pressed={layout==='grid'} onClick={()=>setLayout('grid')}><Grid2X2 size={17}/></button><button aria-label="Widok listy" aria-pressed={layout==='list'} onClick={()=>setLayout('list')}><List size={17}/></button></div></div>
 {search&&<button className="fplp-chip" onClick={()=>{setQ('');setSearch('');setPage(1)}}>{search} ×</button>}
 {error&&<p role="alert">{error}</p>}
 {busy&&<div className="fplp-grid" aria-label="Ładowanie produktów">{Array.from({length:8},(_,i)=><div key={i} className="fplp-skeleton"/>)}</div>}
 {data&&<><div className={'fplp-grid '+(layout==='list'?'fplp-list':'')}>{data.items.map(p=>{const href=pathname+'?'+new URLSearchParams({fmicPreview:'1',sku:p.sku});return <article key={p.sku} className="fplp-card"><a href={href} className="fplp-image" onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();openProduct(p.sku)}}>{p.image?.startsWith('https://')?<img src={p.image} loading="lazy" alt={p.name} referrerPolicy="no-referrer"/>:<span><Package size={34}/> Brak zdjęcia</span>}</a><div className="fplp-card-info"><small className="fplp-sku">{p.sku}</small><a className="fplp-name" href={href} title={p.name} onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();openProduct(p.sku)}}>{p.name}</a><span className={'fplp-stock '+(p.available?'':'out')}><i/>{p.available?'Dostępny':'Niedostępny'}</span><div className="fplp-card-bottom"><div><strong>{Number(p.proposed_gross).toLocaleString('pl-PL',{style:'currency',currency:'PLN'})}</strong><small>brutto</small></div><button onClick={()=>openProduct(p.sku)} aria-label={'Zobacz '+p.name}><ArrowRight size={18}/></button></div></div></article>})}</div>
 {!data.items.length&&<div className="fplp-empty"><Package size={32}/><h2>Brak produktów</h2><p>Zmień kryteria wyszukiwania.</p><button className="outline" onClick={reset}>Wyczyść filtry</button></div>}
 {data.total>0&&<nav className="fplp-pagination" aria-label="Paginacja"><button aria-label="Poprzednia strona" disabled={page<=1||busy} onClick={()=>go(page-1)}><ChevronLeft size={18}/></button>{pageNumbers.map((n,i)=><span key={n}>{i>0&&n-pageNumbers[i-1]>1&&<small>…</small>}<button aria-current={n===page?'page':undefined} disabled={busy} onClick={()=>go(n)}>{n}</button></span>)}<button aria-label="Następna strona" disabled={page>=pages||busy} onClick={()=>go(page+1)}><ChevronRight size={18}/></button></nav>}</>}
 </div></div></section>
}
