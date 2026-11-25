'use client';
import {ArrowRight,Check,Package,Settings2,ShoppingCart,Wrench} from 'lucide-react';
import type {Product} from '../../data';
import {POWER_ENGINES} from '../../lib/storefront-config';
import ProductCard from './ProductCard';
import CommunitySection from './CommunitySection';

type Props={
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
 lang,products,onCategory,onSelectGuideEngine,
 onOpenGuides,onOpenGarage,onOpenProduct,translate
}:Props){
 return (
<main className="drift-home rpm-hp-v2">
 <section className="drift-hero rpm-hp-hero"><link rel="preload" as="image" href="/optimized/hero.webp" fetchPriority="high"/><div className="drift-hero-photo"/><div className="drift-hero-shade"/><div className="drift-hero-inner"><span className="eyebrow">RPM CUSTOM / PERFORMANCE PARTS</span><h1>{lang==='en'?<>BUILD<br/>WITHOUT LIMITS.</>:'BUDUJ\nBEZ OGRANICZEŃ.'.split('\n').map((line,i)=><span key={i}>{i>0&&<br/>}{line}</span>)}</h1><h2>{lang==='en'?<>PARTS FOR <em>YOUR PROJECT.</em></>:"CZĘŚCI DO TWOJEGO PROJEKTU."}</h2><p>{lang==='en'?'Turbochargers, exhaust systems, intercoolers and parts for demanding builds.':"Turbosprężarki, układy wydechowe, intercoolery i komponenty do wymagających projektów."}</p><div className="hero-buttons"><button className="primary" onClick={()=>{onCategory('Wszystkie')}}>{lang==='en'?'BROWSE PRODUCTS':'ZOBACZ PRODUKTY'} <ArrowRight size={18}/></button><button className="outline" onClick={()=>document.getElementById('rpm-custom-home')?.scrollIntoView({behavior:'smooth'})}>RPM CUSTOM <ArrowRight size={16}/></button></div></div></section>
 <section id="rpm-motolab" className="rpm-motolab" aria-labelledby="motolab-title">
  <div className="rpm-motolab-glow" aria-hidden="true"/>
  <div className="rpm-motolab-content">
   <span className="rpm-motolab-kicker">RPM CUSTOM / ENGINE CONFIGURATOR</span>
   <h2 id="motolab-title">{"MotoLab"}</h2>
   <h3>{lang==='en'?'YOUR ENGINE. YOUR BUILD.':'TWÓJ SILNIK. TWOJE MOŻLIWOŚCI.'}</h3>
   <p>{lang==='en'?'Explore proven build paths and component recommendations for your engine.':"Wybierz silnik, poznaj możliwe konfiguracje i dobierz komponenty do swojego projektu."}</p>
   <div className="rpm-motolab-benefits"><span><Wrench size={20}/>{lang==='en'?'Engine-specific':'Dopasowane do silnika'}</span><span><Check size={20}/>{lang==='en'?'Component recommendations':'Rekomendacje części'}</span><span><Settings2 size={20}/>{lang==='en'?'Your build goals':'Twój cel mocy'}</span></div>
   <div className="rpm-motolab-engines">{POWER_ENGINES.map((e,i)=><button type="button" className="rpm-motolab-engine" key={e.id} onClick={()=>{onSelectGuideEngine(e.id)}}><span className="rpm-motolab-engine-visual">{['M50','M52','M54','2JZ'][i]}</span><small>{e.make}</small><strong>{e.name}</strong><span className="rpm-motolab-engine-arrow"><ArrowRight size={17}/></span></button>)}</div>
   <div className="rpm-motolab-actions"><button className="primary" onClick={onOpenGuides}><Wrench size={19}/>{lang==='en'?'CONFIGURE ENGINE':'KONFIGURUJ SILNIK'} <ArrowRight size={18}/></button><a href="/cr-calculator" className="rpm-motolab-secondary" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:10,minHeight:49,padding:"13px 19px",fontSize:12,fontWeight:850}}>{lang==='en'?'CR CALCULATOR 3D':'KALKULATOR CR 3D'} <ArrowRight size={18}/></a></div>
  </div>
  <div className="rpm-motolab-photo" aria-hidden="true"><div className="rpm-motolab-photo-caption"><span>RPM CUSTOM</span><strong>ENGINE PERFORMANCE</strong><small>BUILD WITHOUT LIMITS</small></div></div>
 </section>
 <div className="rpm-hp-trust"><span><Package size={22}/>{lang==='en'?'Parts for your build':'Części do Twojego projektu'}</span><span><Check size={22}/>{lang==='en'?'Selected performance parts':'Wyselekcjonowany asortyment'}</span><span><Wrench size={22}/>{lang==='en'?'Technical expertise':'Doświadczenie techniczne'}</span><span><ShoppingCart size={22}/>{lang==='en'?'Convenient ordering':'Wygodne zamawianie'}</span></div>
 <section className="section drift-section rpm-hp-products"><div className="rpm-hp-products-layout"><div className="rpm-hp-promo"><span className="eyebrow">RPM CUSTOM / PERFORMANCE</span><h2>{lang==='en'?'PARTS FOR REAL PROJECTS':"CZĘŚCI DO PRAWDZIWYCH PROJEKTÓW"}</h2><p>{lang==='en'?'Discover selected components for your next build.':'Sprawdź wybrane komponenty do swojego następnego projektu.'}</p><button className="primary" onClick={()=>{onCategory('Wszystkie')}}>{lang==='en'?'SHOP NOW':'SPRAWDŹ OFERTĘ'} <ArrowRight size={16}/></button></div><div className="rpm-hp-featured"><div className="section-heading"><div><span className="eyebrow">RPM CUSTOM / SHOP</span><h2>{lang==='en'?'FEATURED PRODUCTS':'POLECANE PRODUKTY'}</h2></div><button className="text-link" onClick={()=>onCategory('Wszystkie')}>{lang==='en'?'SEE ALL':'ZOBACZ WSZYSTKIE'} <ArrowRight size={15}/></button></div><div className="products-grid drift-products">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p} onOpen={onOpenProduct} translate={translate}/>)}</div></div></div></section>
 <CommunitySection lang={lang}/>
 <section className="rpm-hp-brandstrip"><img src="/optimized/logo.webp" width={1024} height={350} alt="RPM Custom — Exhaust & Intake Solutions" loading="lazy"/><span>PERFORMANCE</span><span>TIG FABRICATION</span><span>MOTORSPORT</span></section>
 <section className="rpm-hp-custom" id="rpm-custom-home"><div className="rpm-hp-custom-image" role="img" aria-label="RPM Custom — projekty i komponenty performance"/><div className="rpm-hp-custom-copy"><span className="eyebrow">RPM CUSTOM / CUSTOM FABRICATION</span><h2>{lang==='en'?'CUSTOM SOLUTIONS FOR DEMANDING BUILDS':'INDYWIDUALNE ROZWIĄZANIA DLA WYMAGAJĄCYCH'}</h2><p>{lang==='en'?'We design and fabricate turbo manifolds, exhaust components and custom solutions tailored to your build.':'Projektujemy i wykonujemy kolektory turbo, elementy układów wydechowych i komponenty dopasowane do Twojego projektu.'}</p><div className="rpm-hp-custom-features"><span><Wrench size={18}/> TIG</span><span><Settings2 size={18}/> CUSTOM</span><span><Check size={18}/> PERFORMANCE</span></div><a className="primary" href="mailto:info@rpmcustom.pl?subject=Projekt%20RPM%20Custom">{lang==='en'?'ASK ABOUT YOUR PROJECT':'ZAPYTAJ O SWÓJ PROJEKT'} <ArrowRight size={16}/></a></div></section>
 <section className="rpm-hp-about"><div><span className="eyebrow">RPM CUSTOM / {lang==='en'?'ABOUT US':'O NAS'}</span><h2>{lang==='en'?'MORE THAN A PARTS SHOP':'WIĘCEJ NIŻ SKLEP Z CZĘŚCIAMI'}</h2><p>{lang==='en'?'RPM Custom combines hands-on fabrication with a passion for performance projects.':'RPM Custom łączy praktykę warsztatową, własne projekty i pasję do motoryzacji performance.'}</p><button className="outline" onClick={onOpenGarage}>{lang==='en'?'OUR PROJECTS':'NASZE PROJEKTY'} <ArrowRight size={16}/></button></div><div className="rpm-hp-about-accent"><img src="/optimized/logo.webp" width={1024} height={350} alt="RPM Custom — Exhaust & Intake Solutions" loading="lazy"/></div></section>

 </main>
 );
}
