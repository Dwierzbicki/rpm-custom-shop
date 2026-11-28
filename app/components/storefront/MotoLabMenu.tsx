'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {ChevronDown,ArrowRight,Wrench,Settings2,Package,Hexagon} from 'lucide-react';
import {MOTOLAB_TOOLS} from '../../lib/motolab-tools';
import './motolab-menu.css';
const icons={power:Wrench,cr:Settings2,itb:Package,hardware:Hexagon};
export default function MotoLabMenu({lang}:{lang:'pl'|'en'}){
 const id=useId(),trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLElement>(null);
 const [open,setOpen]=useState(false),[placement,setPlacement]=useState({left:12,top:0,width:264,maxHeight:240});
 function position(){
  const rect=trigger.current?.getBoundingClientRect();if(!rect)return;
  const viewport=document.documentElement.clientWidth, height=window.innerHeight;
  const width=Math.max(0,Math.min(264,viewport-24)),left=Math.max(12,Math.min(rect.right-width,viewport-width-12));
  const below=Math.max(0,height-rect.bottom-18),above=Math.max(0,rect.top-18),up=below<220&&above>below;
  const maxHeight=Math.min(300,up?above:below);
  setPlacement({left,top:up?Math.max(12,rect.top-maxHeight-8):rect.bottom+8,width,maxHeight});
 }
 function toggle(){if(open){setOpen(false);return}position();setOpen(true)}
 useEffect(()=>{
  if(!open)return;
  const outside=(e:PointerEvent)=>{if(!trigger.current?.contains(e.target as Node)&&!panel.current?.contains(e.target as Node))setOpen(false)};
  const keyboard=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setOpen(false);trigger.current?.focus()}};
  const focusOutside=(e:FocusEvent)=>{if(!trigger.current?.contains(e.target as Node)&&!panel.current?.contains(e.target as Node))setOpen(false)};
  const scroll=()=>position();
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',keyboard);document.addEventListener('focusin',focusOutside);
  window.addEventListener('resize',scroll);window.addEventListener('scroll',scroll,{passive:true});
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',keyboard);document.removeEventListener('focusin',focusOutside);window.removeEventListener('resize',scroll);window.removeEventListener('scroll',scroll)};
 },[open]);
 return <><button ref={trigger} type="button" className="rpm-header-lab rpm-lab-menu-trigger" title="MotoLab" aria-expanded={open} aria-controls={open?id:undefined} onClick={toggle} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();position();setOpen(true);requestAnimationFrame(()=>panel.current?.querySelector('a')?.focus())}else if(e.key==='Tab'&&!e.shiftKey&&open){const first=panel.current?.querySelector('a');if(first){e.preventDefault();first.focus()}}}}>MotoLab <ChevronDown size={13} aria-hidden="true"/></button>
 {open&&createPortal(<nav ref={panel} id={id} className="rpm-lab-menu-panel" aria-label={lang==='en'?'MotoLab tools':'Narzędzia MotoLab'} style={placement} onKeyDown={e=>{if(e.key==='Tab'&&e.shiftKey&&document.activeElement===panel.current?.querySelector('a')){e.preventDefault();trigger.current?.focus()}else if(e.key==='Tab'&&!e.shiftKey&&document.activeElement===panel.current?.querySelector('a:last-child')){e.preventDefault();setOpen(false);trigger.current?.focus()}}}>{MOTOLAB_TOOLS.map(tool=>{const Icon=icons[tool.id];return <a key={tool.id} href={tool.href} onClick={()=>setOpen(false)}><Icon size={18} aria-hidden="true"/><span><strong>{tool.name}</strong><small>{tool[lang]}</small></span><ArrowRight size={14} aria-hidden="true"/></a>})}</nav>,document.body)}</>
}
