import {searchTokens} from './header-search';

// Immutable expression, identical in query and index. Preserve concat_ws null semantics.
export const searchExpression="lower(name || ' ' || sku || CASE WHEN data->>'ean' IS NULL THEN '' ELSE ' ' || (data->>'ean') END || CASE WHEN data->>'mpn' IS NULL THEN '' ELSE ' ' || (data->>'mpn') END)";
export function searchPatterns(q:string){return searchTokens(q).map(t=>'%'+t.replace(/[\\%_]/g,c=>'\\'+c)+'%')}
export function searchConditions(patterns:string[],start:number){return patterns.map((_,i)=>searchExpression+' LIKE $'+(start+i)).join(' AND ')||'TRUE'}
type Entry={expires:number;value:unknown;bytes:number};
/** Bounded process-local LRU. Byte limits estimate serialized payload size, not heap usage. */
export function createSearchCache({maxEntries=200,maxBytes=8*1024*1024,maxEntryBytes=256*1024,now=Date.now}={}){
 const cache=new Map<string,Entry>();
 const pending=new Map<string,Promise<unknown>>();
 let bytes=0,generation=0;
 const remove=(key:string)=>{const entry=cache.get(key);if(entry){bytes-=entry.bytes;cache.delete(key)}};
 function clear(){generation++;cache.clear();pending.clear();bytes=0}
 async function get<T>(key:string,ttl:number,load:()=>Promise<T>):Promise<T>{
  const hit=cache.get(key);
  if(hit&&hit.expires>now()){cache.delete(key);cache.set(key,hit);return hit.value as T}
  if(hit)remove(key);
  const active=pending.get(key);if(active)return active as Promise<T>;
  const started=generation;
  const work=Promise.resolve().then(load).then(value=>{
   if(started!==generation||ttl<=0)return value;
   let size:number;
   try{size=Buffer.byteLength(JSON.stringify(value)??'')+Buffer.byteLength(key)}catch{return value}
   if(size>maxEntryBytes||size>maxBytes||maxEntries<=0)return value;
   const time=now();
   for(const [k,e] of cache)if(e.expires<=time)remove(k);
   remove(key);
   while(cache.size&&(cache.size>=maxEntries||bytes+size>maxBytes))remove(cache.keys().next().value!);
   cache.set(key,{expires:time+ttl,value,bytes:size});bytes+=size;
   return value;
  }).finally(()=>{if(pending.get(key)===work)pending.delete(key)});
  pending.set(key,work);return work;
 }
 return {get,clear};
}
// Next.js route bundles may load separate module copies; share within one Node process.
const processCache=globalThis as typeof globalThis & {__rpmFmicSearchCacheV2?:ReturnType<typeof createSearchCache>};
const sharedCache=processCache.__rpmFmicSearchCacheV2??=createSearchCache();
export const cachedSearch=sharedCache.get;
export const invalidateFmicSearchCache=sharedCache.clear;

/** Count/facets depend on filters, not page or sort. Search category counts use only global criteria. */
export function listingCacheKeys(input:{path:string[];q:string;stock:string;sort:string|null;page:number;min:number|null;max:number|null;selected:string[]}){
 const {path,q,stock,sort,page,min,max,selected}=input;
 const criteria=[path,q,stock,min,max,selected];
 const normalizedSort=sort==='priceAsc'||sort==='priceDesc'?sort:'default';
 return {
  count:'listing-count:'+JSON.stringify(criteria),
  facets:'listing-facets:'+JSON.stringify(criteria),
  items:'listing-items:'+JSON.stringify([...criteria,normalizedSort,page]),
  categories:'listing-categories:'+JSON.stringify([q,stock,min,max])
 };
}
