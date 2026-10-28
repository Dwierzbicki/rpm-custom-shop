export type GuidePart={id:string;engineVersion:string;rangeIndex:number;usage:'street'|'drift'|'track';tier:'budget'|'recommended'|'premium';category:string;name:string;reason:string;fmicPrice:number|null;manualPrice:number|null;fmicUrl:string;productId:number|null;enabled:boolean};
export type GuideSettings={discountPercent:number;parts:GuidePart[]};
export const DEFAULT_GUIDE_SETTINGS:GuideSettings={discountPercent:5,parts:[]};
export const GUIDE_CATEGORIES=['Turbosprężarka','Kolektor turbo','Wastegate','Wtryskiwacze','Pompa paliwa','Intercooler','ECU','Układ olejowy','Chłodzenie','Silnik i napęd','Inne'];
export function guidePrice(part:GuidePart,discount:number){if(part.manualPrice!==null)return part.manualPrice;if(part.fmicPrice===null)return null;return Math.round(part.fmicPrice*(100-discount))/100}
export function validGuideSettings(x:unknown):x is GuideSettings{
 if(!x||typeof x!=='object')return false;const v=x as Record<string,unknown>;
 if(typeof v.discountPercent!=='number'||!Number.isFinite(v.discountPercent)||v.discountPercent<0||v.discountPercent>95||!Array.isArray(v.parts)||v.parts.length>500)return false;
 const ids=new Set<string>();
 return v.parts.every((raw:unknown)=>{if(!raw||typeof raw!=='object')return false;const p=raw as Record<string,unknown>;
 if(typeof p.id!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(p.id)||ids.has(p.id))return false;ids.add(p.id);
 return typeof p.engineVersion==='string'&&/^(m50b20|m50b25|m52b20|m52b25|m52b28|m54b22|m54b25|m54b30|2jz-ge|2jz-gte)$/.test(p.engineVersion)
 &&Number.isInteger(p.rangeIndex)&&Number(p.rangeIndex)>=0&&Number(p.rangeIndex)<=3
 &&['street','drift','track'].includes(String(p.usage))&&['budget','recommended','premium'].includes(String(p.tier))
 &&typeof p.category==='string'&&p.category.length<=80&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=180
 &&typeof p.reason==='string'&&p.reason.length<=1000
 &&(p.fmicPrice===null||(typeof p.fmicPrice==='number'&&Number.isFinite(p.fmicPrice)&&p.fmicPrice>=0&&p.fmicPrice<=10000000))
 &&(p.manualPrice===null||(typeof p.manualPrice==='number'&&Number.isFinite(p.manualPrice)&&p.manualPrice>=0&&p.manualPrice<=10000000))
 &&typeof p.fmicUrl==='string'&&p.fmicUrl.length<=1000&&(!p.fmicUrl||/^https:\/\/(www\.)?fmic\.pl\//i.test(p.fmicUrl))
 &&(p.productId===null||(Number.isSafeInteger(p.productId)&&Number(p.productId)>0))&&typeof p.enabled==='boolean';
 });
}
