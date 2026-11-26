// Only UI state belongs in history; product data and credentials do not.
export const listingHistoryKey='rpmListingV1';
export type ListingSnapshot={
 scope:string;page:number;search:string;stock:string;order:string;layout:string;selected:Record<string,string>;
 price:{min:string;max:string};choices:Record<string,string>;treeOpen:boolean;scrollY:number;
};
export function listingScope(pathname:string,query:string){return JSON.stringify([pathname,query]);}
const record=(value:unknown,max:number):Record<string,string>=>{
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 return Object.fromEntries(Object.entries(value).filter(([k,v])=>k.length<=120&&typeof v==='string'&&v.length<=120).slice(-max));
};
const string=(value:unknown,max=120)=>typeof value==='string'?value.slice(0,max):'';
const money=(value:unknown)=>typeof value==='string'&&/^\d{0,8}(?:\.\d{1,2})?$/.test(value)?value:'';
const filters=(value:unknown)=>Object.fromEntries(Object.entries(record(value,40)).filter(([k])=>!['category','page','q','sort','stock','min','max','sku'].includes(k)));
export function readListingSnapshot(historyState:unknown,scope:string):ListingSnapshot|null{
 if(!historyState||typeof historyState!=='object')return null;
 const raw=(historyState as Record<string,unknown>)[listingHistoryKey];
 if(!raw||typeof raw!=='object')return null;
 const v=raw as Partial<ListingSnapshot>;
 if(v.scope!==scope)return null;
 return {scope,page:typeof v.page==='number'&&Number.isSafeInteger(v.page)?Math.max(1,Math.min(10000,v.page)):1,
 search:string(v.search),stock:v.stock==='available'||v.stock==='unavailable'?v.stock:'all',
 order:v.order==='priceAsc'||v.order==='priceDesc'?v.order:'featured',layout:v.layout==='list'?'list':'grid',
 selected:filters(v.selected),price:{min:money(v.price?.min),max:money(v.price?.max)},choices:record(v.choices,200),
 treeOpen:v.treeOpen!==false,scrollY:typeof v.scrollY==='number'&&Number.isFinite(v.scrollY)?Math.max(0,Math.min(1000000,v.scrollY)):0};
}
export function withListingSnapshot(historyState:unknown,snapshot:ListingSnapshot){
 const state=historyState&&typeof historyState==='object'&&!Array.isArray(historyState)?historyState:{};
 return {...state,[listingHistoryKey]:{...snapshot,choices:record(snapshot.choices,200),selected:filters(snapshot.selected)}};
}
export function listingReturnPath(referrer:string,origin:string){
 try{const url=new URL(referrer);return url.origin===origin&&(url.pathname==='/sklep'||url.pathname.startsWith('/sklep/'))?url.pathname+url.search:null}catch{return null}
}
