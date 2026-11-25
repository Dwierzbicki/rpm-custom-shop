'use client';

import {useState} from 'react';
import {Pause,Play} from 'lucide-react';
import './brand-carousel.css';

// Curated candidate URLs from rpm_fmic_image_audit, one per producer.
// These are supplier catalog assets, not logos fetched from unrelated sources.
const brands=[
 {name:'Pulsar',url:'https://fmic.pl/media/catalog/product/P/u/Pulsar-PSR-Logo.png'},
 {name:'ECUMaster',url:'https://fmic.pl/media/catalog/product/E/c/Ecumaster-Logo.png'},
 {name:'Manley',url:'https://fmic.pl/media/catalog/product/M/A/MANLEY-LOGO.png'},
 {name:'Wisefab',url:'https://fmic.pl/media/catalog/product/W/i/Wisefab-Logo_4.png'},
 {name:'DeatschWerks',url:'https://fmic.pl/media/catalog/product/D/e/DeatschWerksLogo.png'},
 {name:'Wilwood',url:'https://fmic.pl/media/catalog/product/w/i/wilwoodlogo.jpg'},
 {name:'TEIN',url:'https://fmic.pl/media/catalog/product/t/e/tein-logo-png_seeklogo-497939.png'},
 {name:'ZRP',url:'https://fmic.pl/media/catalog/product/Z/R/ZRP-Logo.jpg'},
 {name:'CANchecked',url:'https://fmic.pl/media/catalog/product/C/A/CANchecked-LOGO.jpg'},
 {name:'Penrite',url:'https://fmic.pl/media/catalog/product/P/e/Penrite-Logo_27.jpg'},
 {name:'Elring',url:'https://fmic.pl/media/catalog/product/E/l/Elring-logo.png'},
 {name:'IOD',url:'https://fmic.pl/media/catalog/product/I/O/IOD-LOGO.jpg'},
] as const;

export default function BrandCarousel({lang}:{lang:'pl'|'en'}){
 const [failed,setFailed]=useState<string[]>([]);
 const [paused,setPaused]=useState(false);
 const visible=brands.filter(brand=>!failed.includes(brand.name));
 const animated=visible.length>=9;
 if(!visible.length)return null;
 return <section className="rpm-brand-carousel" aria-labelledby="rpm-brand-carousel-title">
  <div className="rpm-brand-carousel-head">
   <h2 id="rpm-brand-carousel-title">{lang==='en'?'BRANDS IN OUR RANGE':'MARKI W NASZEJ OFERCIE'}</h2>
   {animated&&<button type="button" className="rpm-brand-carousel-toggle" aria-label={paused?(lang==='en'?'Resume scrolling':'Wznów przewijanie'):(lang==='en'?'Pause scrolling':'Zatrzymaj przewijanie')} onClick={()=>setPaused(v=>!v)}>{paused?<Play size={16}/>:<Pause size={16}/>}</button>}
  </div>
  <div className={'rpm-brand-carousel-window'+(animated?' is-animated':'')+(paused?' is-paused':'')}>
   <div className="rpm-brand-carousel-track">
    {(animated?[0,1]:[0]).map(copy=><div className={'rpm-brand-carousel-group'+(copy?' is-copy':'')} key={copy} aria-hidden={copy?true:undefined}>
     {visible.map(brand=><a key={brand.name} href={'/sklep?'+new URLSearchParams({q:brand.name})} tabIndex={copy?-1:undefined} title={brand.name} aria-label={(lang==='en'?'Search products: ':'Szukaj produktów: ')+brand.name}>
      <img src={brand.url} alt={brand.name} width={140} height={55} decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(old=>old.includes(brand.name)?old:[...old,brand.name])}/>
     </a>)}
    </div>)}
   </div>
  </div>
 </section>;
}
