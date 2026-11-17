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
     <h1 style={{fontSize:'clamp(32px,5vw,56px)',margin:'12px 0',lineHeight:1.12}}>Projektuj części do swojego silnika</h1>
     <p style={{color:'#a1a1aa',maxWidth:720,lineHeight:1.65}}>Kreatory CAD połączone ze sklepem RPM Custom. Projektuj geometrię, oglądaj model 3D na żywo i przygotowuj pliki do dalszej pracy.</p>
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
      <p style={{color:'#a1a1aa',lineHeight:1.6}}>Plenum, runnery, flansze, przepustnice i elementy do produkcji. Jeden projekt, dwa tryby technologiczne.</p>
      <p style={{marginTop:22,color:'#94a3b8',fontWeight:700}}>W przygotowaniu — projekt następnego modułu</p>
     </article>
    </div>
    <p style={{marginTop:28,color:'#71717a',fontSize:13}}>Modele CAD wymagają sprawdzenia wymiarów i technologii wykonania przed produkcją. Funkcje płatności i automatycznego udostępniania plików nie są jeszcze uruchomione.</p>
   </div>
  </main>
 );
}
