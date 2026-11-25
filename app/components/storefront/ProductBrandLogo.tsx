'use client';
import {useState} from 'react';
import {findBrandAsset,brandLogoSrc} from './brand-library';
export default function ProductBrandLogo({brand,name}:{brand?:string|null;name:string}){
 const asset=findBrandAsset(brand,name);
 const src=asset&&brandLogoSrc(asset);
 const [failed,setFailed]=useState<string|null>(null);
 if(!asset||!src||failed===src)return null;
 return <span className="fplp-brand-logo" title={asset.name}><img src={src} alt={asset.name} width={80} height={24} decoding="async" loading="lazy" onError={()=>setFailed(src)}/></span>;
}
