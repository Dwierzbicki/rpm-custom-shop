'use client';
import photos from './custom-project-photos.json';

/** A single authentic featured project, with no slideshow controls. */
export default function CustomProjectPhoto({lang}:{lang:'pl'|'en'}){
 const filename=photos[0];
 return <div className="rpm-hp-custom-image rpm-project-photo">
  <img src={'/optimized/cars/'+filename.replace(/\.jpg$/i,'.webp')}
   alt={lang==='en'?'Red Nissan S14 — RPM Custom project':'Czerwony Nissan S14 — projekt RPM Custom'}
   loading="lazy" decoding="async" draggable={false}
   onError={e=>{const fallback='/cars/'+filename;if(!e.currentTarget.src.endsWith(fallback))e.currentTarget.src=fallback}}/>
  <div className="rpm-project-photo-grade" aria-hidden="true"/>
 </div>;
}
