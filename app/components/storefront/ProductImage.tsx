'use client';
import {useState} from 'react';
import {PackageOpen} from 'lucide-react';
export default function ProductImage({src,alt,className}:{src?:string|null;alt:string;className?:string}){
 const [failed,setFailed]=useState<string|null>(null);
 if(src&&failed!==src)return <img className={className} src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(src)}/>;
 return <div className="rpm-product-placeholder" role="img" aria-label={'Brak zdjęcia produktu: '+alt}>
 <div className="rpm-placeholder-brand"><img src="/rpm-logo.png.png" alt="" aria-hidden="true"/></div>
 <PackageOpen className="rpm-placeholder-icon" aria-hidden="true" size={42} strokeWidth={1.4}/>
 <strong>Brak zdjęcia produktu</strong><small>Zdjęcie w przygotowaniu</small>
 </div>;
}
