import type {Metadata} from 'next';

export const metadata:Metadata={
 title:'Designery CAD | RPM Custom',
 description:'Zaprojektuj części do dolotu w kreatorach RPM Custom. ITB Designer oraz kolektory ssące TIG i CNC.',
};

const itbActive=Boolean(process.env.ITB_DESIGNER_ORIGIN);

export default function DesignersPage(){
 return (
  <main style={{minHeight:'100vh',background:'#0c0f14',color:'#f5f5f5',fontFamily:'Arial,sans-serif',padding:'clamp(20px,5vw,60px)'}}>
   <div style={{maxWidth:1080,margin:'0 auto'}}>
    <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
     <a href="/" style={{color:'#fb923c',textDecoration:'none',fontWeight:800,letterSpacing:2,fontSize:21}}>RPM CUSTOM</a>
     <a href="/" style={{color:'#cbd5e1',fontSize:14}}>← Wróć do sklepu</a>
    </nav>
    <header style={{padding:'64px 0 36px'}}>
     <p style={{color:'#fb923c',fontSize:12,fontWeight:700,letterSpacing:4}}>RPM CUSTOM · MOTOLAB</p>
     <h1 style={{fontSize:'clamp(32px,5vw,56px)',margin:'12px 0',lineHeight:1.12}}>Projektuj i analizuj swój silnik</h1>
     <p style={{color:'#a1a1aa',maxWidth:720,lineHeight:1.65}}>Kreatory 3D i narzędzia inżynierskie RPM Custom. Projektuj części, analizuj geometrię silnika i eksperymentuj z konfiguracją w czasie rzeczywistym.</p>
    </header>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:18}}>
     <article style={{border:'1px solid #9a341244',borderRadius:18,padding:26,background:'#151b25'}}>
      <div style={{fontSize:12,letterSpacing:2,color:'#fb923c',fontWeight:700}}>ITB DESIGNER</div>
      <h2 style={{fontSize:25,margin:'14px 0'}}>Trąbki dolotowe</h2>
      <p style={{color:'#a1a1aa',lineHeight:1.6}}>Projektuj średnice, kielich, zawiniętą wargę i spiralne prowadnice. Podgląd 3D oraz eksporty do przygotowania produkcji.</p>
      {itbActive
       ? <a href="/itb-designer" style={{display:'inline-block',marginTop:20,padding:'13px 22px',background:'#f97316',borderRadius:10,color:'#111827',fontWeight:800,textDecoration:'none'}}>Otwórz ITB Designer</a>
       : <p style={{marginTop:22,color:'#fb923c',fontWeight:700}}>Integracja z kreatorem w przygotowaniu</p>}
     </article>
     <article style={{border:'1px solid #ffffff20',borderRadius:18,padding:26,background:'#151b25'}}>
      <div style={{fontSize:12,letterSpacing:2,color:'#94a3b8',fontWeight:700}}>INTAKE MANIFOLD DESIGNER</div>
      <h2 style={{fontSize:25,margin:'14px 0'}}>Kolektory ssące TIG / CNC</h2>
      <p style={{color:'#a1a1aa',lineHeight:1.6}}>Koncepcyjny model 3D: plenum, runnery, flansze i przepustnice. Dwa widoki technologiczne TIG i CNC, zapis projektu JSON.</p>
      <a href="/intake-designer" style={{display:'inline-block',marginTop:20,padding:'13px 22px',background:'#f97316',borderRadius:10,color:'#111827',fontWeight:800,textDecoration:'none'}}>Otwórz Intake Designer · MVP</a>
     </article>
     <article style={{border:'1px solid #e4456366',borderRadius:18,padding:26,background:'linear-gradient(135deg,#311a28,#141d2a 80%)'}}>
      <div style={{fontSize:12,letterSpacing:2,color:'#fb7185',fontWeight:700}}>NOWOŚĆ · ENGINE SIMULATION 3D</div>
      <h2 style={{fontSize:25,margin:'14px 0'}}>CR Calculator 3D</h2>
      <p style={{color:'#a1a1aa',lineHeight:1.6}}>Animowany przekrój silnika: tłok, korbowód i wał korbowy. Oblicz geometryczny stopień sprężania, zobacz zmianę objętości i dobierz denko tłoka do docelowego CR.</p>
      <a href="/cr-calculator" style={{display:'inline-block',marginTop:20,padding:'13px 22px',background:'#e93d5e',borderRadius:10,color:'#fff',fontWeight:800,textDecoration:'none'}}>Uruchom CR Calculator 3D →</a>
     </article>
    </div>
    <p style={{marginTop:28,color:'#71717a',fontSize:13}}>Modele CAD wymagają sprawdzenia wymiarów i technologii wykonania przed produkcją. Funkcje płatności i automatycznego udostępniania plików nie są jeszcze uruchomione.</p>
   </div>
  </main>
 );
}
