import type {Diagram,Part} from './catalog';
import type {Profile} from './release';
import {m54Breakdown,connectionRows} from './m54-breakdown';

type ReportOptions={engine:string;profileId:string;revision:string|null;profiles:Profile[];parts:Part[];diagrams:Diagram[]};
export function buildHardwareReport({engine,profileId,revision,profiles,parts,diagrams}:ReportOptions){
 if(!revision&&engine!=='M54B30')return null;
 const profile=revision?profiles.find(p=>p.id===profileId&&p.engine===engine):undefined;
 if(revision&&!profile)return null;
 const selected=diagrams.filter(d=>d.engine===engine&&(!revision||d.profileId===profile?.id));
 if(!selected.length)return null;
 const byKey=new Map(parts.map(p=>[p.key??p.oem,p]));
 const groups=selected.map(d=>({diagram:d,rows:d.usages.map(usage=>({usage,part:byKey.get(usage.partKey??usage.oem)}))}));
 const all=groups.flatMap(g=>g.rows);
 const gaps=!revision?m54Breakdown.map(g=>({id:g.id,title:g.title,items:g.connections.filter(c=>!connectionRows(c,selected).length)})).filter(g=>g.items.length):[];
 return {engine,profile,revision,groups,gaps,usageCount:all.length,uniqueOem:new Set(all.map(r=>r.usage.partKey??r.usage.oem)).size,unresolvedPartCount:all.filter(r=>!r.part).length};
}
export function hardwareReportHref(engine:string,profileId:string,language:'pl'|'en'){
 const q=new URLSearchParams({engine,lang:language});
 if(profileId)q.set('profile',profileId);
 return '/engine-hardware/report?'+q.toString();
}
