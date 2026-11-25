'use client';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
import {useState} from 'react';
import {PackageOpen} from 'lucide-react';
export default function ProductImage({src,alt,className}:{src?:string|null;alt:string;className?:string}){
 const {t}=useStorefrontLanguage();
 const optimized=src?.startsWith('https://res.cloudinary.com/if1bnaya/image/upload/v')?src.replace('/image/upload/','/image/upload/f_auto,q_auto,c_limit,w_640/'):src;
 const [failed,setFailed]=useState<string|null>(null);
 if(src&&failed!==src)return <img className={className} src={optimized ?? undefined} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(src)}/>;
 return <div className="rpm-product-placeholder" role="img" aria-label={t('Brak zdjęcia produktu')+': '+alt}>
 <div className="rpm-placeholder-brand"><img src="/optimized/logo.webp" width={1024} height={350} alt="" aria-hidden="true"/></div>
 <PackageOpen className="rpm-placeholder-icon" aria-hidden="true" size={42} strokeWidth={1.4}/>
 <strong>{t("Brak zdjęcia produktu")}</strong><small>{t("Zdjęcie w przygotowaniu")}</small>
 </div>;
}
