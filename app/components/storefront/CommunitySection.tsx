'use client';
import {useEffect,useState} from 'react';
import {Users,Wrench,Gauge,ArrowUpRight,Facebook} from 'lucide-react';
import {DEFAULT_COMMUNITY,validCommunity,type CommunitySettings} from '../../lib/community-settings';
export default function CommunitySection({lang}:{lang:'pl'|'en'}){
 const [settings,setSettings]=useState<CommunitySettings|null>(null);
 useEffect(()=>{let alive=true;fetch('/api/community',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(v=>{if(alive)setSettings(validCommunity(v)?v:DEFAULT_COMMUNITY)}).catch(()=>{if(alive)setSettings(null)});return()=>{alive=false}},[]);
 if(!settings?.enabled)return null;
 const en=lang==='en';
 return <section className="rpm-community" aria-labelledby="rpm-community-title"><div className="rpm-community-copy"><span className="eyebrow">RPM CUSTOM / COMMUNITY</span><h2 id="rpm-community-title">{en?settings.titleEn:settings.title}<em>{en?settings.accentEn:settings.accent}</em></h2><p>{en?settings.descriptionEn:settings.description}</p><div className="rpm-community-benefits"><span><Wrench size={20}/>{en?'Projects and modifications':'Projekty i modyfikacje'}</span><span><Gauge size={20}/>Performance &amp; motorsport</span><span><Users size={20}/>{en?'Knowledge and experience':'Wiedza i doświadczenie'}</span></div><a className="rpm-community-cta" href={settings.groupUrl} target="_blank" rel="noopener noreferrer"><Facebook size={20}/>{en?settings.buttonEn:settings.button}<ArrowUpRight size={18}/></a></div><div className="rpm-community-visual">{settings.image?<img src={settings.image} alt="" loading="lazy"/>:<div className="rpm-community-art"><img src="/optimized/logo.webp" width={1024} height={350} alt="RPM Custom" loading="lazy"/><Users size={70}/><strong>COMMUNITY</strong><span>BUILD · SHARE · INSPIRE</span></div>}<span className="rpm-community-tag"><Facebook size={17}/> FACEBOOK GROUP</span></div></section>
}
