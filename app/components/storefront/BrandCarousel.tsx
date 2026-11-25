'use client';

import {useState} from 'react';
import brands from './brand-assets.json';
import './brand-carousel.css';


export default function BrandCarousel({lang}:{lang:'pl'|'en'}){
 const [failed,setFailed]=useState<string[]>([]);
 const [fallback,setFallback]=useState<string[]>([]);
 const visible=brands.filter(brand=>!failed.includes(brand.name));
 const animated=visible.length>=9;
 if(!visible.length)return null;
 return <section className="rpm-brand-carousel" aria-labelledby="rpm-brand-carousel-title">
  <div className="rpm-brand-carousel-head">
   <h2 id="rpm-brand-carousel-title">{lang==='en'?'BRANDS IN OUR RANGE':'MARKI W NASZEJ OFERCIE'}</h2>
  </div>
  <div className={'rpm-brand-carousel-window'+(animated?' is-animated':'')}>
   <div className="rpm-brand-carousel-track">
    {(animated?[0,1]:[0]).map(copy=><div className={'rpm-brand-carousel-group'+(copy?' is-copy':'')} key={copy} aria-hidden={copy?true:undefined}>
     {visible.map(brand=><a key={brand.name} href={'/sklep?'+new URLSearchParams({q:brand.name})} tabIndex={copy?-1:undefined} title={brand.name} aria-label={(lang==='en'?'Search products: ':'Szukaj produktów: ')+brand.name}>
      <img className={fallback.includes(brand.name)?'is-original':'is-normalized'} src={fallback.includes(brand.name)?brand.url:'/optimized/brands/'+brand.slug+'.webp'} alt={brand.name} width={140} height={55} decoding="async" referrerPolicy="no-referrer" onError={()=>{if(!fallback.includes(brand.name))setFallback(old=>old.includes(brand.name)?old:[...old,brand.name]);else setFailed(old=>old.includes(brand.name)?old:[...old,brand.name])}}/>
     </a>)}
    </div>)}
   </div>
  </div>
 </section>;
}
