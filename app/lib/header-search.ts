export function searchTokens(query:string){return query.trim().slice(0,120).toLocaleLowerCase('pl').split(/\s+/).filter(Boolean)}
export function matchesSearch(query:string,fields:unknown[]){const tokens=searchTokens(query);const haystack=fields.filter(x=>typeof x==='string').join(' ').toLocaleLowerCase('pl');return tokens.length>0&&tokens.every(t=>haystack.includes(t))}
export function suggestionHref(sku:string,query:string){return '/sklep?'+new URLSearchParams({q:query.trim(),sku}).toString()}
