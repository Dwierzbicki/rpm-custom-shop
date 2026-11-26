'use client';
import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Pause,Play} from 'lucide-react';
import photos from './custom-project-photos.json';

const count=photos.length;
export default function CustomProjectSlider({lang}:{lang:'pl'|'en'}){
 const [active,setActive]=useState(0);
 const [paused,setPaused]=useState(false);
 const [hover,setHover]=useState(false);
 const [focus,setFocus]=useState(false);
 const [reduced,setReduced]=useState(false);
 const [inView,setInView]=useState(false);
 const [visible,setVisible]=useState(true);
 const [ready,setReady]=useState<Record<number,boolean>>({});
 const root=useRef<HTMLDivElement>(null);
 const touch=useRef<{x:number;y:number}|null>(null);
 const en=lang==='en';
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>setReduced(media.matches);
  sync();media.addEventListener('change',sync);
  const visibility=()=>setVisible(!document.hidden);
  visibility();document.addEventListener('visibilitychange',visibility);
  return ()=>{media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',visibility)};
 },[]);
 useEffect(()=>{
  if(!root.current||!('IntersectionObserver' in window)){setInView(true);return}
  const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting),{rootMargin:'0px',threshold:.15});
  observer.observe(root.current);return ()=>observer.disconnect();
 },[]);
 const next=(active+1)%count;
 const previous=(active+count-1)%count;
 useEffect(()=>{
  if(count<2||paused||hover||focus||reduced||!inView||!visible||!ready[next])return;
  const timer=window.setTimeout(()=>setActive(index=>(index+1)%count),5000);
  return ()=>window.clearTimeout(timer);
 },[active,next,paused,hover,focus,reduced,inView,visible,ready]);
 const go=(index:number)=>{setActive((index+count)%count)};
 return <div ref={root} className="rpm-hp-custom-image rpm-project-slider" role="region" aria-roledescription={en?'carousel':'karuzela'} aria-label={en?'RPM Custom project gallery':'Galeria realizacji RPM Custom'}
  onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
  onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(false)}}
  onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(active+(e.key==='ArrowLeft'?-1:1))}}}
  onTouchStart={e=>{const p=e.touches[0];touch.current=p?{x:p.clientX,y:p.clientY}:null}}
  onTouchCancel={()=>{touch.current=null}}
  onTouchEnd={e=>{const start=touch.current,p=e.changedTouches[0];touch.current=null;if(!start||!p)return;const dx=p.clientX-start.x,dy=p.clientY-start.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3)go(active+(dx<0?1:-1))}}>
  <div className="rpm-project-slides">
   {photos.map((filename,index)=>{
    const selected=index===active;
    const shouldLoad=selected||index===next||index===previous||ready[index];
    return <div key={filename} className={'rpm-project-slide'+(selected?' is-active':'')} aria-hidden={!selected}>
     {shouldLoad&&<img src={'/optimized/cars/'+filename.replace(/\.jpg$/i,'.webp')} alt={en?'RPM Custom project photo '+(index+1):'Realizacja RPM Custom — zdjęcie '+(index+1)} loading={selected?'eager':'lazy'} decoding="async" draggable={false}
      onLoad={()=>setReady(old=>old[index]?old:{...old,[index]:true})}
      onError={e=>{const fallback='/cars/'+filename;if(!e.currentTarget.src.endsWith(fallback))e.currentTarget.src=fallback}}/>}
    </div>;
   })}
  </div>
  <div className="rpm-project-grade" aria-hidden="true"/>
  <div className="rpm-project-kicker"><span>RPM CUSTOM</span><strong>{en?'WORKSHOP GALLERY':'Z WARSZTATU'}</strong></div>
  <div className="rpm-project-controls">
   <div className="rpm-project-arrows"><button type="button" onClick={()=>go(active-1)} aria-label={en?'Previous photo':'Poprzednie zdjęcie'}><ChevronLeft size={20}/></button><button type="button" onClick={()=>go(active+1)} aria-label={en?'Next photo':'Następne zdjęcie'}><ChevronRight size={20}/></button></div>
   <div className="rpm-project-dots">{photos.map((filename,index)=><button type="button" key={filename} aria-current={index===active?'true':undefined} aria-label={(en?'Photo ':'Zdjęcie ')+(index+1)} onClick={()=>go(index)}><span/></button>)}</div>
   <div className="rpm-project-end"><span className="rpm-project-count">{String(active+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</span>{!reduced&&<button type="button" onClick={()=>setPaused(v=>!v)} aria-label={paused?(en?'Play slideshow':'Wznów pokaz'):(en?'Pause slideshow':'Wstrzymaj pokaz')}>{paused?<Play size={16}/>:<Pause size={16}/>}</button>}</div>
  </div>
 </div>;
}
