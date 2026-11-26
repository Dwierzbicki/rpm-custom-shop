'use client';
import {ArrowRight,Check,Package,Settings2,ShoppingCart,Wrench} from 'lucide-react';
import type {Product} from '../../data';
import ProductCard from './ProductCard';
import CommunitySection from './CommunitySection';
import BrandCarousel from './BrandCarousel';
import CustomProjectPhoto from './CustomProjectSlider';

type Props={
 lang:'pl'|'en';
 products:Product[];
 onCategory:(category:string)=>void;
 onSelectGuideEngine:(engineId:string)=>void;
 onOpenGuides:()=>void;
 onOpenGarage:()=>void;
 translate:(label:string)=>string;
};

/**
 * Homepage sections extracted from the original shop monolith.
 * Navigation and shared state remain owned by the storefront controller.
 */
export default function HomeSections({
 lang,products,onCategory,
 translate
}:Props){
 return (
<main className="drift-home rpm-hp-v2">
 <section className="drift-hero rpm-hp-hero"><link rel="preload" as="image" href="/optimized/hero.webp" fetchPriority="high"/><div className="drift-hero-photo"/><div className="drift-hero-shade"/><div className="drift-hero-inner"><span className="eyebrow">RPM CUSTOM / PERFORMANCE PARTS</span><h1>{lang==='en'?<>BUILD<br/>WITHOUT LIMITS.</>:'BUDUJ\nBEZ OGRANICZEŃ.'.split('\n').map((line,i)=><span key={i}>{i>0&&<br/>}{line}</span>)}</h1><h2>{lang==='en'?<>PARTS FOR <em>YOUR PROJECT.</em></>:"CZĘŚCI DO TWOJEGO PROJEKTU."}</h2><p>{lang==='en'?'Turbochargers, exhaust systems, intercoolers and parts for demanding builds.':"Turbosprężarki, układy wydechowe, intercoolery i komponenty do wymagających projektów."}</p><div className="hero-buttons"><button className="primary" onClick={()=>{onCategory('Wszystkie')}}>{lang==='en'?'BROWSE PRODUCTS':'ZOBACZ PRODUKTY'} <ArrowRight size={18}/></button><button className="outline" onClick={()=>document.getElementById('rpm-custom-home')?.scrollIntoView({behavior:'smooth'})}>RPM CUSTOM <ArrowRight size={16}/></button></div></div></section>
 <BrandCarousel lang={lang}/>
 <section id="rpm-motolab" className="rpm-motolab" aria-labelledby="motolab-title">
  <div className="rpm-motolab-glow" aria-hidden="true"/>
  <div className="rpm-motolab-content">
   <span className="rpm-motolab-kicker">RPM CUSTOM / ENGINE CONFIGURATOR</span>
   <h2 id="motolab-title">{"MotoLab"}</h2>
   <h3>{lang==='en'?'YOUR ENGINE. YOUR BUILD.':'TWÓJ SILNIK. TWOJE MOŻLIWOŚCI.'}</h3>
   <p>{lang==='en'?'Explore proven build paths and component recommendations for your engine.':"Wybierz silnik, poznaj możliwe konfiguracje i dobierz komponenty do swojego projektu."}</p>
   <div className="rpm-motolab-benefits"><span><Wrench size={20}/>{lang==='en'?'Engine-specific':'Dopasowane do silnika'}</span><span><Check size={20}/>{lang==='en'?'Component recommendations':'Rekomendacje części'}</span><span><Settings2 size={20}/>{lang==='en'?'Your build goals':'Twój cel mocy'}</span></div>
   <div className="rpm-motolab-tools"><a href="/power-guides"><Wrench size={23}/><strong>Power Builder</strong><small>{lang==='en'?'Engine configuration':'Konfiguracja silnika'}</small><ArrowRight size={15}/></a><a href="/cr-calculator"><Settings2 size={23}/><strong>CR Calculator 3D</strong><small>{lang==='en'?'Engine geometry':'Geometria silnika'}</small><ArrowRight size={15}/></a><a href="/motolab"><Package size={23}/><strong>ITB Designer</strong><small>{lang==='en'?'Intake design':'Projektowanie dolotu'}</small><ArrowRight size={15}/></a></div>
   <div className="rpm-motolab-actions"><a href="/motolab" className="primary rpm-motolab-entry">{lang==='en'?'EXPLORE MOTOLAB':'PRZEJDŹ DO MOTOLAB'} <ArrowRight size={18}/></a></div>
  </div>
  <div className="rpm-motolab-photo" aria-hidden="true"><div className="rpm-motolab-photo-caption"><span>RPM CUSTOM</span><strong>ENGINE PERFORMANCE</strong><small>BUILD WITHOUT LIMITS</small></div></div>
 </section>
 <div className="rpm-hp-trust"><span><Package size={22}/>{lang==='en'?'Parts for your build':'Części do Twojego projektu'}</span><span><Check size={22}/>{lang==='en'?'Selected performance parts':'Wyselekcjonowany asortyment'}</span><span><Wrench size={22}/>{lang==='en'?'Technical expertise':'Doświadczenie techniczne'}</span><span><ShoppingCart size={22}/>{lang==='en'?'Convenient ordering':'Wygodne zamawianie'}</span></div>
 {products.length>0&&<section className="section drift-section rpm-hp-products"><div className="rpm-hp-products-layout"><div className="rpm-hp-promo"><span className="eyebrow">RPM CUSTOM / PERFORMANCE</span><h2>{lang==='en'?'PARTS FOR REAL PROJECTS':"CZĘŚCI DO PRAWDZIWYCH PROJEKTÓW"}</h2><p>{lang==='en'?'Discover selected components for your next build.':'Sprawdź wybrane komponenty do swojego następnego projektu.'}</p><button className="primary" onClick={()=>{onCategory('Wszystkie')}}>{lang==='en'?'SHOP NOW':'SPRAWDŹ OFERTĘ'} <ArrowRight size={16}/></button></div><div className="rpm-hp-featured"><div className="section-heading"><div><span className="eyebrow">RPM CUSTOM / SHOP</span><h2>{lang==='en'?'FEATURED PRODUCTS':'POLECANE PRODUKTY'}</h2></div><button className="text-link" onClick={()=>onCategory('Wszystkie')}>{lang==='en'?'SEE ALL':'ZOBACZ WSZYSTKIE'} <ArrowRight size={15}/></button></div><div className="products-grid drift-products">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p} translate={translate}/>)}</div></div></div></section>}
 <CommunitySection lang={lang}/>
 <section className="rpm-hp-custom" id="rpm-custom-home"><CustomProjectPhoto lang={lang}/><div className="rpm-hp-custom-copy"><span className="eyebrow">RPM CUSTOM / CUSTOM FABRICATION</span><h2>{lang==='en'?'CUSTOM SOLUTIONS FOR DEMANDING BUILDS':'INDYWIDUALNE ROZWIĄZANIA DLA WYMAGAJĄCYCH'}</h2><p>{lang==='en'?'We design and fabricate turbo manifolds, exhaust components and custom solutions tailored to your build.':'Projektujemy i wykonujemy kolektory turbo, elementy układów wydechowych i komponenty dopasowane do Twojego projektu.'}</p><div className="rpm-hp-custom-features"><span><Wrench size={18}/> TIG</span><span><Settings2 size={18}/> CUSTOM</span><span><Check size={18}/> PERFORMANCE</span></div><a className="primary" href="mailto:info@rpmcustom.pl?subject=Projekt%20RPM%20Custom">{lang==='en'?'ASK ABOUT YOUR PROJECT':'ZAPYTAJ O SWÓJ PROJEKT'} <ArrowRight size={16}/></a></div></section>
 <section className="rpm-hp-about" aria-labelledby="rpm-about-title">
  <div className="rpm-hp-about-panel">
   <div className="rpm-hp-about-intro">
    <div className="rpm-hp-about-copy">
     <span className="eyebrow">RPM CUSTOM / {lang==='en'?'ABOUT US':'O NAS'}</span>
     <h2 id="rpm-about-title">{lang==='en'?'MORE THAN A PARTS SHOP':'WIĘCEJ NIŻ SKLEP Z CZĘŚCIAMI'}</h2>
     <h3>{lang==='en'?'BUILT FOR YOUR PERFORMANCE PROJECT.':'ZAPLECZE DLA TWOJEGO PROJEKTU PERFORMANCE.'}</h3>
     <p>{lang==='en'?'RPM Custom grew out of workshop practice and hands-on performance projects. We combine our own fabrication of turbo manifolds and exhaust components with a catalogue of performance parts and tools for planning your build.':'RPM Custom powstało z praktyki warsztatowej i własnych projektów performance. Łączymy autorską produkcję kolektorów turbo oraz elementów układów wydechowych z katalogiem części i narzędziami do planowania modyfikacji.'}</p>
     <p>{lang==='en'?'Our approach starts with your goal, engine and budget. From the first modifications to a complete turbo build, we want you to understand what you are choosing and why it makes sense for your project.':'Punktem wyjścia jest Twój cel, silnik i budżet. Od pierwszych modyfikacji po kompleksowy projekt turbo — chcemy, żebyś wiedział, co wybierasz i dlaczego ma to sens w Twoim aucie.'}</p>
     <div className="rpm-hp-about-actions"><a className="primary" href="/motolab">{lang==='en'?'EXPLORE MOTOLAB':'POZNAJ MOTOLAB'} <ArrowRight size={17}/></a><a className="outline" href="#rpm-custom-home">{lang==='en'?'CUSTOM SOLUTIONS':'ROZWIĄZANIA CUSTOM'} <ArrowRight size={16}/></a></div>
    </div>
    <div className="rpm-hp-about-accent"><span className="rpm-about-brand-code">RPM / PERFORMANCE DNA</span><img src="/optimized/logo.webp" width={1024} height={350} alt="RPM Custom — Exhaust & Intake Solutions" loading="lazy"/><div className="rpm-about-brand-line" aria-hidden="true"/><strong>BUILD WITHOUT LIMITS.</strong><small>{lang==='en'?'ENGINEERING · FABRICATION · PERFORMANCE':'PROJEKTOWANIE · PRODUKCJA · PERFORMANCE'}</small></div>
   </div>
   <div className="rpm-hp-about-pillars">
    {[
     {Icon:Package,title:lang==='en'?'Performance parts':'Części performance',description:lang==='en'?'Components for street, drift, track day and turbo builds in one catalogue.':'Komponenty do projektów street, drift, track day i turbo w jednym katalogu.'},
     {Icon:Wrench,title:lang==='en'?'Workshop experience':'Doświadczenie warsztatowe',description:lang==='en'?'Hands-on fabrication, TIG welding and custom solutions for demanding builds.':'Praktyka warsztatowa, spawanie TIG i indywidualne rozwiązania dla wymagających projektów.'},
     {Icon:Settings2,title:lang==='en'?'Your build, your goal':'Dobór pod konkretny cel',description:lang==='en'?'Plan modifications around your engine, power target, intended use and budget.':'Planuj modyfikacje z uwzględnieniem silnika, celu mocy, zastosowania i budżetu.'},
     {Icon:Check,title:'MotoLab',description:lang==='en'?'Power Builder, compression ratio calculator and ITB design tools for informed decisions.':'Power Builder, kalkulator stopnia sprężania i kreator ITB wspierające świadomy dobór części.'}
    ].map(({Icon,title,description},i)=><article className="rpm-about-pillar" key={i}><div className="rpm-about-pillar-head"><Icon size={23} aria-hidden="true"/><span aria-hidden="true">0{i+1}</span></div><h4>{title}</h4><p>{description}</p></article>)}
   </div>
  </div>
 </section>

 </main>
 );
}
