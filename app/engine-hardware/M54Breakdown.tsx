'use client';
import {useEffect,useState} from 'react';
import {m54Breakdown,connectionRows,type Connection} from './m54-breakdown';
import type {Diagram} from './catalog';
export default function M54Breakdown({diagrams,selected,onSelect,en,busy}:{diagrams:Diagram[];selected:string|null;onSelect:(c:Connection)=>void;en:boolean;busy:boolean}){
 const tr=(pl:string,english:string)=>en?english:pl;
 const [expanded,setExpanded]=useState<string[]>(['oil']);
 useEffect(()=>{const group=m54Breakdown.find(g=>g.connections.some(c=>c.id===selected));if(group)setExpanded(prev=>prev.includes(group.id)?prev:[...prev,group.id])},[selected]);
 const count=m54Breakdown.flatMap(g=>g.connections).filter(c=>connectionRows(c,diagrams).length>0).length;
 return <div className="eh-breakdown"><h2>{tr('Rozbiórka silnika','Engine breakdown')}</h2><p>{count}/{m54Breakdown.flatMap(g=>g.connections).length} {tr('obszarów z danymi cząstkowymi','areas with partial reference data')}</p><p className="eh-breakdown-note">{tr('Lista kontrolna połączeń, nie instrukcja kolejności demontażu.','Joint checklist, not a disassembly sequence.')}</p>
 {m54Breakdown.map(g=>{const open=expanded.includes(g.id),known=g.connections.filter(c=>connectionRows(c,diagrams).length>0).length;return <div className="eh-breakdown-group" key={g.id}><button className="eh-group-toggle" type="button" aria-expanded={open} aria-controls={'eh-group-'+g.id} onClick={()=>setExpanded(old=>open?old.filter(x=>x!==g.id):[...old,g.id])}><span>{g.title[en?'en':'pl']}<small>{known}/{g.connections.length} {tr('z danymi','with data')}</small></span><b aria-hidden="true">{open?'−':'+'}</b></button>{open&&<div id={'eh-group-'+g.id} className="eh-connections">{g.connections.map(c=>{const rows=connectionRows(c,diagrams);return <button key={c.id} type="button" disabled={busy} aria-pressed={selected===c.id} onClick={()=>onSelect(c)}><span>{c.title[en?'en':'pl']}<small>{rows.length?rows.length+' '+tr('poz. · częściowo','items · partial'):tr('Brak potwierdzonych danych','No confirmed data')}</small></span></button>})}</div>}</div>})}</div>
}
