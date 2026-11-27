import {RESEARCH_SOURCES,RESEARCH_TOPICS,researchPrompt,parseResearchRows,type ResearchDraft} from './motolab-research-center';
export const AI_MAX_CALLS=3,AI_MAX_TOKENS=6000,AI_MAX_RESULTS=8;
export type AiRequest={version:string;topic:string;sourceIds:string[];confirmPaid:true};
export function validAiRequest(x:unknown):x is AiRequest{
 if(!x||typeof x!=='object')return false;
 const r=x as AiRequest;
 return r.confirmPaid===true&&typeof r.version==='string'&&typeof r.topic==='string'&&RESEARCH_TOPICS.some(t=>t.id===r.topic)&&Array.isArray(r.sourceIds)&&r.sourceIds.length>0&&r.sourceIds.length<=RESEARCH_SOURCES.length&&new Set(r.sourceIds).size===r.sourceIds.length&&r.sourceIds.every(id=>RESEARCH_SOURCES.some(s=>s.id===id))&&!!researchPrompt(r.version,r.topic,r.sourceIds);
}
export function normalizedUrl(raw:unknown){
 if(typeof raw!=='string'||raw.length>2048)return '';
 try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password)return '';u.hash='';u.hostname=u.hostname.replace(/^www\./,'');u.pathname=u.pathname.replace(/\/+$/,'')||'/';for(const k of Array.from(u.searchParams.keys()))if(/^utm_/i.test(k)||['fbclid','gclid'].includes(k.toLowerCase()))u.searchParams.delete(k);u.searchParams.sort();return u.toString()}catch{return ''}
}
export function allowedSource(raw:string,r:AiRequest){
 const n=normalizedUrl(raw);if(!n)return false;const u=new URL(n);
 if(u.hostname==='facebook.com'||u.hostname.endsWith('.facebook.com'))return r.sourceIds.includes('turbo-familia')&&/^\/TurboFamiliaCrew(?:\/|$)/i.test(u.pathname);
 if(r.sourceIds.includes('public'))return true;
 return RESEARCH_SOURCES.some(s=>{if(!s.url||!r.sourceIds.includes(s.id))return false;const b=new URL(normalizedUrl(s.url));return (u.hostname===b.hostname||u.hostname.endsWith('.'+b.hostname))&&(b.pathname==='/'||u.pathname===b.pathname||u.pathname.startsWith(b.pathname+'/'))});
}
export function providerRequest(r:AiRequest,model:string){
 const domains=[...new Set(RESEARCH_SOURCES.filter(s=>s.url&&r.sourceIds.includes(s.id)).map(s=>new URL(s.url).hostname.replace(/^www\./,'')))];
 return {model,store:false,reasoning:{effort:'low'},max_output_tokens:AI_MAX_TOKENS,max_tool_calls:AI_MAX_CALLS,tools:[{type:'web_search',search_context_size:'low',...(!r.sourceIds.includes('public')&&domains.length?{filters:{allowed_domains:domains}}:{})}],tool_choice:'required',include:['web_search_call.action.sources'],input:researchPrompt(r.version,r.topic,r.sourceIds)+'\nTryb automatyczny: zwróć wyłącznie JSON {"records":[...]}, maksymalnie 8 pozycji. Jeśli brak źródeł, {"records":[]}. Każdy URL musi pochodzić z narzędzia wyszukiwania. Nie dodawaj danych osobowych. Nie przypisuj postów innych autorów do Turbo Familia Crew.'};
}
type Source={url?:unknown;type?:unknown};
type Output={type?:string;status?:string;action?:{sources?:Source[]};content?:{type?:string;text?:string;annotations?:Source[]}[]};
export function parseProvider(raw:unknown,r:AiRequest){
 const d=raw as {status?:string;output?:Output[];usage?:{input_tokens?:number;output_tokens?:number}};
 if(d?.status!=='completed'||!Array.isArray(d.output))throw Error('Nieukończona odpowiedź');
 const urls=new Set<string>(),chunks:string[]=[];let calls=0;
 for(const o of d.output){
 if(o.type==='web_search_call'&&o.status==='completed'){calls++;for(const s of o.action?.sources??[]){const n=normalizedUrl(s.url);if(n&&allowedSource(n,r))urls.add(n)}}
 if(o.type==='message')for(const c of o.content??[]){if(c.type!=='output_text')continue;if(typeof c.text==='string')chunks.push(c.text);for(const s of c.annotations??[]){if(s.type==='url_citation'){const n=normalizedUrl(s.url);if(n&&allowedSource(n,r))urls.add(n)}}}
 }
 if(!calls)throw Error('Brak zakończonego wyszukiwania');
 const parsed=JSON.parse(chunks.join('').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
 if(!Array.isArray(parsed?.records)||parsed.records.length>AI_MAX_RESULTS)throw Error('Niepoprawna odpowiedź');
 const records:ResearchDraft[]=[];
 for(const item of parsed.records){try{const [row]=parseResearchRows([item]);if(row.entry.kind==='engine'&&row.entry.version===r.version&&allowedSource(row.sourceUrl,r)&&urls.has(normalizedUrl(row.sourceUrl)))records.push(row)}catch{}}
 return {records,discarded:parsed.records.length-records.length,usage:{inputTokens:d.usage?.input_tokens??null,outputTokens:d.usage?.output_tokens??null,searchCalls:calls}};
}
