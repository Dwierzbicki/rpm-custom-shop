'use client';
import {ArrowRight,Check,Package,Settings2,ShoppingCart,Wrench} from 'lucide-react';
import type {Product} from '../../data';
import type {HomepageDraft} from '../../lib/homepage-editor';
import {POWER_ENGINES} from '../../lib/storefront-config';
import ProductCard from './ProductCard';

type Props={
 homepageDraft:HomepageDraft;
 lang:'pl'|'en';
 products:Product[];
 onCategory:(category:string)=>void;
 onSelectGuideEngine:(engineId:string)=>void;
 onOpenGuides:()=>void;
 onOpenGarage:()=>void;
 onOpenProduct:(product:Product)=>void;
 translate:(label:string)=>string;
};

/**
 * Homepage sections extracted from the original shop monolith.
 * Navigation and shared state remain owned by the storefront controller.
 */
export default function HomeSections({
 homepageDraft,lang,products,onCategory,onSelectGuideEngine,
 onOpenGuides,onOpenGarage,onOpenProduct,translate
}:Props){
 return (
<main className="drift-home rpm-hp-v2">
 <section className="drift-hero rpm-hp-hero"><div className="drift-hero-photo" style={homepageDraft.heroImage?{backgroundImage:`url(${homepageDraft.heroImage})`}:undefined}/><div className="drift-hero-shade"/><div className="drift-hero-inner"><span className="eyebrow">RPM CUSTOM / PERFORMANCE PARTS</span><h1 data-rpm-edit="heroTitle">{lang==='en'?<>BUILD<br/>WITHOUT LIMITS.</>:homepageDraft.heroTitle.split('\n').map((line,i)=><span key={i}>{i>0&&<br/>}{line}</span>)}</h1><h2 data-rpm-edit="heroSubtitle">{lang==='en'?<>PARTS FOR <em>YOUR PROJECT.</em></>:homepageDraft.heroSubtitle}</h2><p data-rpm-edit="heroDescription">{lang==='en'?'Turbochargers, exhaust systems, intercoolers and parts for demanding builds.':homepageDraft.heroDescription}</p><div className="hero-buttons"><button className="primary" onClick={()=>{onCategory('Wszystkie')}}>{lang==='en'?'BROWSE PRODUCTS':'ZOBACZ PRODUKTY'} <ArrowRight size={18}/></button><button className="outline" onClick={()=>document.getElementById('rpm-custom-home')?.scrollIntoView({behavior:'smooth'})}>RPM CUSTOM <ArrowRight size={16}/></button></div></div></section>
 <section id="rpm-motolab" className="rpm-motolab" aria-labelledby="motolab-title">
  <div className="rpm-motolab-glow" aria-hidden="true"/>
  <div className="rpm-motolab-content">
   <span className="rpm-motolab-kicker">RPM CUSTOM / ENGINE CONFIGURATOR</span>
   <h2 id="motolab-title" data-rpm-edit="motolabTitle">{homepageDraft.motolabTitle}</h2>
   <h3>{lang==='en'?'YOUR ENGINE. YOUR BUILD.':'TWÓJ SILNIK. TWOJE MOŻLIWOŚCI.'}</h3>
   <p data-rpm-edit="motolabDescription">{lang==='en'?'Explore proven build paths and component recommendations for your engine.':homepageDraft.motolabDescription}</p>
   <div className="rpm-motolab-benefits"><span><Wrench size={20}/>{lang==='en'?'Engine-specific':'Dopasowane do silnika'}</span><span><Check size={20}/>{lang==='en'?'Component recommendations':'Rekomendacje części'}</span><span><Settings2 size={20}/>{lang==='en'?'Your build goals':'Twój cel mocy'}</span></div>
   <div className="rpm-motolab-engines">{POWER_ENGINES.map((e,i)=><button type="button" className="rpm-motolab-engine" key={e.id} onClick={()=>{onSelectGuideEngine(e.id)}}><span className="rpm-motolab-engine-visual">{['M50','M52','M54','2JZ'][i]}</span><small>{e.make}</small><strong>{e.name}</strong><span className="rpm-motolab-engine-arrow"><ArrowRight size={17}/></span></button>)}</div>
   <div className="rpm-motolab-actions"><button className="primary" onClick={onOpenGuides}><Wrench size={19}/>{lang==='en'?'CONFIGURE ENGINE':'KONFIGURUJ SILNIK'} <ArrowRight size={18}/></button></div>
  </div>
  <div className="rpm-motolab-photo" aria-hidden="true"><div className="rpm-motolab-photo-caption"><span>RPM CUSTOM</span><strong>ENGINE PERFORMANCE</strong><small>BUILD WITHOUT LIMITS</small></div></div>
 </section>
 <div className="rpm-hp-trust"><span><Package size={22}/>{lang==='en'?'Parts for your build':'Części do Twojego projektu'}</span><span><Check size={22}/>{lang==='en'?'Selected performance parts':'Wyselekcjonowany asortyment'}</span><span><Wrench size={22}/>{lang==='en'?'Technical expertise':'Doświadczenie techniczne'}</span><span><ShoppingCart size={22}/>{lang==='en'?'Convenient ordering':'Wygodne zamawianie'}</span></div>
 <section className="section drift-section rpm-hp-categories"><div className="section-heading"><div><span className="eyebrow">RPM CUSTOM / {lang==='en'?'CATEGORIES':'KATEGORIE'}</span><h2>{lang==='en'?'FIND WHAT YOU NEED':'ZNAJDŹ TO, CZEGO POTRZEBUJESZ'}</h2></div><button className="text-link" onClick={()=>{onCategory('Wszystkie')}}>{lang==='en'?'ALL PRODUCTS':'ZOBACZ WSZYSTKIE'} <ArrowRight size={16}/></button></div><div className="rpm-hp-category-grid">{[{name:'Turbo',label:'Turbosprężarki',art:'turbo'},{name:'Kolektory',label:'Układy wydechowe',art:'exhaust'},{name:'Intercoolery',label:'Intercoolery',art:'cooler'},{name:'Osprzęt',label:'Osprzęt',art:'parts'},{name:'Wastegate',label:'Wastegate',art:'wastegate'},{name:'Elektronika',label:'Elektronika',art:'electronics'},{name:'Paliwo',label:'Układ paliwowy',art:'fuel'},{name:'Wszystkie',label:'Cały katalog',art:'all'}].map((item)=><button key={item.label} type="button" className={'rpm-hp-category rpm-hp-cat-'+item.art} onClick={()=>{onCategory(item.name)}}><span className="rpm-hp-cat-art" aria-hidden="true">{item.art==='turbo'?'TURBO':item.art==='exhaust'?'TIG':item.art==='cooler'?'IC':item.art==='parts'?'PARTS':item.art==='wastegate'?'WG':item.art==='electronics'?'ECU':item.art==='fuel'?'FUEL':'RPM'}</span><span className="rpm-hp-cat-label"><strong>{item.label}</strong><small>{lang==='en'?'EXPLORE':'ZOBACZ'} <ArrowRight size={13}/></small></span></button>)}</div></section>
 <section className="section drift-section rpm-hp-products"><div className="rpm-hp-products-layout"><div className="rpm-hp-promo"><span className="eyebrow">RPM CUSTOM / PERFORMANCE</span><h2 data-rpm-edit="promoTitle">{lang==='en'?'PARTS FOR REAL PROJECTS':homepageDraft.promoTitle}</h2><p>{lang==='en'?'Discover selected components for your next build.':'Sprawdź wybrane komponenty do swojego następnego projektu.'}</p><button className="primary" onClick={()=>{onCategory('Wszystkie')}}>{lang==='en'?'SHOP NOW':'SPRAWDŹ OFERTĘ'} <ArrowRight size={16}/></button></div><div className="rpm-hp-featured"><div className="section-heading"><div><span className="eyebrow">RPM CUSTOM / SHOP</span><h2>{lang==='en'?'FEATURED PRODUCTS':'POLECANE PRODUKTY'}</h2></div><button className="text-link" onClick={()=>onCategory('Wszystkie')}>{lang==='en'?'SEE ALL':'ZOBACZ WSZYSTKIE'} <ArrowRight size={15}/></button></div><div className="products-grid drift-products">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p} onOpen={onOpenProduct} translate={translate}/>)}</div></div></div></section>
 <section className="rpm-hp-brandstrip"><img src="/rpm-logo.png.png" alt="RPM Custom — Exhaust & Intake Solutions" loading="lazy"/><span>PERFORMANCE</span><span>TIG FABRICATION</span><span>MOTORSPORT</span></section>
 <section className="rpm-hp-custom" id="rpm-custom-home"><div className="rpm-hp-custom-image" role="img" aria-label="RPM Custom — projekty i komponenty performance"/><div className="rpm-hp-custom-copy"><span className="eyebrow">RPM CUSTOM / CUSTOM FABRICATION</span><h2>{lang==='en'?'CUSTOM SOLUTIONS FOR DEMANDING BUILDS':'INDYWIDUALNE ROZWIĄZANIA DLA WYMAGAJĄCYCH'}</h2><p>{lang==='en'?'We design and fabricate turbo manifolds, exhaust components and custom solutions tailored to your build.':'Projektujemy i wykonujemy kolektory turbo, elementy układów wydechowych i komponenty dopasowane do Twojego projektu.'}</p><div className="rpm-hp-custom-features"><span><Wrench size={18}/> TIG</span><span><Settings2 size={18}/> CUSTOM</span><span><Check size={18}/> PERFORMANCE</span></div><a className="primary" href="mailto:info@rpmcustom.pl?subject=Projekt%20RPM%20Custom">{lang==='en'?'ASK ABOUT YOUR PROJECT':'ZAPYTAJ O SWÓJ PROJEKT'} <ArrowRight size={16}/></a></div></section>
 <section className="rpm-hp-about"><div><span className="eyebrow">RPM CUSTOM / {lang==='en'?'ABOUT US':'O NAS'}</span><h2>{lang==='en'?'MORE THAN A PARTS SHOP':'WIĘCEJ NIŻ SKLEP Z CZĘŚCIAMI'}</h2><p>{lang==='en'?'RPM Custom combines hands-on fabrication with a passion for performance projects.':'RPM Custom łączy praktykę warsztatową, własne projekty i pasję do motoryzacji performance.'}</p><button className="outline" onClick={onOpenGarage}>{lang==='en'?'OUR PROJECTS':'NASZE PROJEKTY'} <ArrowRight size={16}/></button></div><div className="rpm-hp-about-accent"><img src="/rpm-logo.png.png" alt="RPM Custom — Exhaust & Intake Solutions" loading="lazy"/></div></section>

 </main>
 );
}
