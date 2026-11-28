'use client';
import {ChevronLeft} from 'lucide-react';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
import {MOTOLAB_HOME,MOTOLAB_TOOLS,type MotoLabToolId} from '../../lib/motolab-tools';
export default function MotoLabNavigation({active}:{active:MotoLabToolId}){
 const {lang}=useStorefrontLanguage();
 return <nav className="rpm-lab-subnav" aria-label={lang==='en'?'MotoLab tools':'Narzędzia MotoLab'}><a href={MOTOLAB_HOME}><ChevronLeft size={16}/> MotoLab</a>{MOTOLAB_TOOLS.map(tool=><a key={tool.id} href={tool.href} aria-current={active===tool.id?'page':undefined}>{tool.name}</a>)}</nav>
}
