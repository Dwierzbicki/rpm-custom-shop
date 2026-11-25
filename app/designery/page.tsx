import StandaloneStorefrontHeader from '../components/storefront/StandaloneStorefrontHeader';
import StorefrontFooter from '../components/storefront/StorefrontFooter';
import type {Metadata} from 'next';
import {ArrowRight,Box,Gauge,Wind} from 'lucide-react';

export const metadata:Metadata={
 title:'Designery CAD | RPM Custom',
 description:'Projektuj trąbki dolotowe i analizuj stopień sprężania silnika w narzędziach RPM Custom.',
};

const itbActive=Boolean(process.env.ITB_DESIGNER_ORIGIN);

export default function DesignersPage(){
 return (
  <div className="drift-home rpm-designers">
   <StandaloneStorefrontHeader/>
   <main>
    <section className="drift-hero" style={{minHeight:'clamp(340px,34vw,480px)',justifyContent:'center'}}>
     <div className="drift-hero-photo" aria-hidden="true"/>
     <div className="drift-hero-shade" aria-hidden="true"/>
     <div className="drift-hero-inner" style={{padding:'clamp(48px,6vw,90px) clamp(20px,4vw,56px)'}}>
      <span className="eyebrow">RPM CUSTOM / MOTOLAB / ENGINEERING</span>
      <h1 style={{fontSize:'clamp(42px,6.5vw,88px)',maxWidth:950}}>PROJEKTUJ.<br/><em>ANALIZUJ.</em></h1>
      <p style={{maxWidth:560,marginBottom:0}}>Twój silnik. Twoje możliwości. Projektuj części i analizuj geometrię silnika w interaktywnych narzędziach 3D RPM Custom.</p>
     </div>
    </section>
    <section className="section drift-section" aria-labelledby="designers-title" style={{paddingBlock:'clamp(32px,5vw,64px)'}}>
     <div className="section-heading"><div><span className="eyebrow">RPM CUSTOM / DESIGNERS</span><h2 id="designers-title">WYBIERZ NARZĘDZIE</h2></div></div>
     <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,340px),1fr))',gap:20}}>
      <article className="product-card" style={{minWidth:0,background:'var(--surface)'}}>
       <div className="product-art" style={{height:190,background:'radial-gradient(ellipse at 65% 30%,#54202e,#191a20 58%,#101116)'}}>
        <Wind size={88} strokeWidth={1.2} color="var(--accent)" aria-hidden="true"/>
        <span className="art-label">01 / INTAKE TECHNOLOGY</span>
       </div>
       <div className="product-info" style={{padding:'clamp(18px,2.5vw,30px)',gap:12}}>
        <span className="eyebrow" style={{marginBottom:0}}>ITB DESIGNER</span>
        <h3 style={{fontSize:28,margin:0,letterSpacing:'-.03em'}}>Trąbki dolotowe</h3>
        <p style={{flex:1,marginBottom:12}}>Projektuj średnice, kielich, zawiniętą wargę i spiralne prowadnice. Podgląd 3D oraz eksporty do przygotowania produkcji.</p>
        {itbActive
         ? <a href="/itb-designer" className="primary" style={{textDecoration:'none',alignSelf:'flex-start'}}>OTWÓRZ ITB DESIGNER <ArrowRight size={18}/></a>
         : <p style={{color:'var(--accent)',fontWeight:700,margin:0}}>Integracja z kreatorem w przygotowaniu</p>}
       </div>
      </article>
      <article className="product-card" style={{minWidth:0,background:'var(--surface)'}}>
       <div className="product-art" style={{height:190,background:'radial-gradient(ellipse at 65% 30%,#54202e,#191a20 58%,#101116)'}}>
        <Gauge size={88} strokeWidth={1.2} color="var(--accent)" aria-hidden="true"/>
        <span className="art-label">02 / ENGINE SIMULATION 3D</span>
       </div>
       <div className="product-info" style={{padding:'clamp(18px,2.5vw,30px)',gap:12}}>
        <span className="eyebrow" style={{marginBottom:0}}>ENGINEERING CALCULATOR</span>
        <h3 style={{fontSize:28,margin:0,letterSpacing:'-.03em'}}>CR Calculator 3D</h3>
        <p style={{flex:1,marginBottom:12}}>Animowany przekrój silnika: tłok, korbowód i wał korbowy. Oblicz geometryczny stopień sprężania i dobierz denko tłoka do docelowego CR.</p>
        <a href="/cr-calculator" className="primary" style={{textDecoration:'none',alignSelf:'flex-start'}}>URUCHOM CR CALCULATOR <ArrowRight size={18}/></a>
       </div>
      </article>
     </div>
     <div style={{display:'flex',alignItems:'flex-start',gap:12,borderTop:'1px solid var(--line)',paddingTop:20,marginTop:28}}>
      <Box size={20} color="var(--accent)" style={{flexShrink:0}} aria-hidden="true"/>
      <p style={{fontSize:12,margin:0}}>Modele CAD wymagają sprawdzenia wymiarów i technologii wykonania przed produkcją. Funkcje płatności i automatycznego udostępniania plików nie są jeszcze uruchomione.</p>
     </div>
    </section>
   </main>
   <StorefrontFooter/>
  </div>
 );
}
