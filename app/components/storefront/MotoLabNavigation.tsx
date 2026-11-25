'use client';
import {ChevronLeft} from 'lucide-react';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
export default function MotoLabNavigation({active}:{active:'power'|'cr'}){
 const {lang}=useStorefrontLanguage();
 return <nav className="rpm-lab-subnav" aria-label={lang==='en'?'MotoLab tools':'Narzędzia MotoLab'}><a href="/motolab"><ChevronLeft size={16}/> MotoLab</a><a href="/power-guides" aria-current={active==='power'?'page':undefined}>Power Builder</a><a href="/cr-calculator" aria-current={active==='cr'?'page':undefined}>CR Calculator 3D</a></nav>
}
