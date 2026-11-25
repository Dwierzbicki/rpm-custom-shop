'use client';
import {useEffect,useState} from 'react';
import FmicProductPreview from './FmicProductPreview';
import {resolveCategoryPath} from '../../category-routing';
type Result={items:{sku:string;name:string;proposed_gross:string;available:boolean;image:string|null}[];total:number;page:number;size:number;path:string[]};
export default function FmicPreview({pathname,lang,sort}:{pathname:string;lang:'pl'|'en';sort:string}){
 const [data,setData]=useState<Result|null>(null),[page,setPage]=useState(1),[q,setQ]=useState(''),[search,setSearch]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [sku,setSku]=useState('');
 useEffect(()=>{const sync=()=>setSku(new URLSearchParams(window.location.search).get('sku')??'');sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[pathname]);
 function openProduct(next:string){const url=new URL(window.location.href);url.searchParams.set('fmicPreview','1');url.searchParams.set('sku',next);window.history.pushState({},'',url.pathname+url.search);setSku(next);window.scrollTo({top:0})}
 function closeProduct(){const url=new URL(window.location.href);url.searchParams.delete('sku');window.history.pushState({},'',url.pathname+url.search);setSku('');window.scrollTo({top:0})}
 const path=resolveCategoryPath(pathname);
 useEffect(()=>{setPage(1);setQ('');setSearch('')},[pathname]);
 useEffect(()=>{
 if(!resolveCategoryPath(pathname)?.length)return;
 const controller=new AbortController();setBusy(true);setError('');setData(null);
 const params=new URLSearchParams({category:pathname,page:String(page),q:search,sort});
 fetch('/api/admin/fmic-preview?'+params,{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw Error(r.status===401?'Zaloguj się do panelu administratora.':'Nie udało się pobrać produktów FMIC.');return r.json()}).then(d=>{if(!controller.signal.aborted)setData(d)}).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setBusy(false)});
 return()=>controller.abort();
 },[pathname,page,search,sort]);
 if(sku&&path?.length)return <FmicProductPreview key={sku} sku={sku} onBack={closeProduct} onOpen={openProduct}/>;
 if(!path?.length)return <p>Wybierz kategorię z menu, aby zobaczyć produkty FMIC.</p>;
 const pages=Math.max(1,Math.ceil((data?.total??0)/(data?.size??24)));
 return <section style={{marginTop:24}}><div className="page-heading"><span className="eyebrow">RPM CUSTOM / FMIC · ADMIN PREVIEW</span><h2>{path.join(' / ')}</h2><p>{lang==='en'?'Private preview — orders disabled.':'Prywatny podgląd administratora — sprzedaż wyłączona.'}</p></div>
 <form className="catalog-toolbar" onSubmit={e=>{e.preventDefault();setPage(1);setSearch(q)}}><input aria-label="Szukaj produktów FMIC" placeholder="Nazwa lub SKU" value={q} onChange={e=>setQ(e.target.value)} maxLength={120}/><button className="outline" disabled={busy}>Szukaj</button></form>
 {busy&&<p role="status">Ładowanie katalogu FMIC…</p>}{error&&<p role="alert">{error}</p>}
 {data&&<><div className="catalog-toolbar"><strong>{data.total.toLocaleString('pl-PL')} produktów FMIC</strong><span>Strona {page} / {pages}</span></div><div className="products-grid rpm-products-modern">{data.items.map(p=><article key={p.sku} style={{border:'1px solid #343b45',borderRadius:12,overflow:'hidden',background:'#171b23',display:'flex',flexDirection:'column'}}>{p.image?.startsWith('https://')?<img src={p.image} loading="lazy" alt={p.name} referrerPolicy="no-referrer" style={{width:'100%',aspectRatio:'1 / 1',objectFit:'contain',background:'#fff'}}/>:<div style={{aspectRatio:'1 / 1',display:'grid',placeItems:'center',background:'#222832'}}>Brak zdjęcia</div>}<div style={{padding:14,display:'grid',gap:8,flex:1}}><small>FMIC · {p.sku}</small><a href={pathname+'?'+new URLSearchParams({fmicPreview:'1',sku:p.sku})} onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();openProduct(p.sku)}} style={{fontWeight:700,color:'inherit'}}>{p.name}</a><span style={{color:p.available?'#6ed99a':'#efa45e'}}>{p.available?'Dostępny u dostawcy':'Niedostępny'}</span><strong style={{fontSize:22,color:'#e3385b'}}>{Number(p.proposed_gross).toLocaleString('pl-PL',{style:'currency',currency:'PLN'})}</strong><button className="outline" onClick={()=>openProduct(p.sku)}>Zobacz produkt</button></div></article>)}</div>{!data.items.length&&<p>Brak dopasowanych produktów.</p>}<div className="catalog-toolbar" style={{marginTop:20}}><button className="outline" disabled={page<=1||busy} onClick={()=>setPage(p=>p-1)}>Poprzednia</button><span>{page} / {pages}</span><button className="outline" disabled={page>=pages||busy} onClick={()=>setPage(p=>p+1)}>Następna</button></div></>}
 </section>
}
