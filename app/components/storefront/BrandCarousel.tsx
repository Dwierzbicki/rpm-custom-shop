'use client';

import {useState} from 'react';
import {brandAssets as brands,brandLogoSrc} from './brand-library';
import './brand-carousel.css';


function BrandLogo({brand}:{brand:(typeof brands)[number]}){
 const [loaded,setLoaded]=useState(false);
 const [failed,setFailed]=useState(false);
 const src=brandLogoSrc(brand);
 return <span className={'rpm-brand-mark rpm-brand-'+brand.slug}>
  {src&&!failed&&<img src={src} alt="" aria-hidden="true" width={140} height={55} decoding="async" className={loaded?'is-ready':''} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} ref={node=>{if(node?.complete&&node.naturalWidth>0)setLoaded(true)}}/>}
  {(!src||failed||!loaded)&&<span className="rpm-brand-name">{brand.name}</span>}
 </span>;
}

export default function BrandCarousel({lang}:{lang:'pl'|'en'}){
 const visible=brands.filter(brand=>Boolean(logos[brand.slug]));
 // On builds with a temporary supplier outage, retain a useful text-based brand rail.
 const entries=visible.length>=9?visible:brands;
 const animated=entries.length>=9;
 return <section className="rpm-brand-carousel" aria-labelledby="rpm-brand-carousel-title">
  <div className="rpm-brand-carousel-head">
   <h2 id="rpm-brand-carousel-title">{lang==='en'?'BRANDS IN OUR RANGE':'MARKI W NASZEJ OFERCIE'}</h2>
  </div>
  <div className={'rpm-brand-carousel-window'+(animated?' is-animated':'')}>
   <div className="rpm-brand-carousel-track">
    {(animated?[0,1]:[0]).map(copy=><div className={'rpm-brand-carousel-group'+(copy?' is-copy':'')} key={copy} aria-hidden={copy?true:undefined}>
     {entries.map(brand=><a key={brand.name} href={'/sklep?'+new URLSearchParams({q:brand.name})} tabIndex={copy?-1:undefined} title={brand.name} aria-label={(lang==='en'?'Search products: ':'Szukaj produktów: ')+brand.name}>
      <BrandLogo brand={brand}/>
     </a>)}
    </div>)}
   </div>
  </div>
 </section>;
}
