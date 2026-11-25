import {searchTokens} from './header-search';

// Immutable expression, identical in query and index. Preserve concat_ws null semantics.
export const searchExpression="lower(name || ' ' || sku || CASE WHEN data->>'ean' IS NULL THEN '' ELSE ' ' || (data->>'ean') END || CASE WHEN data->>'mpn' IS NULL THEN '' ELSE ' ' || (data->>'mpn') END)";
export function searchPatterns(q:string){return searchTokens(q).map(t=>'%'+t.replace(/[\\%_]/g,c=>'\\'+c)+'%')}
export function searchConditions(patterns:string[],start:number){return patterns.map((_,i)=>searchExpression+' LIKE $'+(start+i)).join(' AND ')||'TRUE'}
type Entry={expires:number;value:unknown};
const cache=new Map<string,Entry>();
const pending=new Map<string,Promise<unknown>>();
export async function cachedSearch<T>(key:string,ttl:number,load:()=>Promise<T>):Promise<T>{
 const hit=cache.get(key);
 if(hit&&hit.expires>Date.now())return hit.value as T;
 const active=pending.get(key);if(active)return active as Promise<T>;
 const work=load().then(value=>{if(cache.size>=200)cache.delete(cache.keys().next().value!);cache.set(key,{expires:Date.now()+ttl,value});return value}).finally(()=>pending.delete(key));
 pending.set(key,work);return work;
}
