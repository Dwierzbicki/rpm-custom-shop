import {colorCandidate} from './variant-rules';
export type SiliconeRow={sku:string;name:string;category:string[];brand:string;price:string;available:boolean};
export type SiliconeChoice=SiliconeRow&{angle:number;diameter:string;color:string;kind:'straight'|'reducer'};
const suffix:Record<string,string>={Czarny:'B',Zielony:'G',Niebieski:'N',Pomarańczowy:'P',Czerwony:'R'};
export function siliconeChoice(row:SiliconeRow):SiliconeChoice|null{
 const parsed=colorCandidate(row.name);if(!parsed)return null;
 const m=/^(kolanko silikonowe|silikonowe kolanko redukcyjne) (23|45|67|90|135|180)['°] (\d{1,3}(?:\/\d{1,3})?)mm$/.exec(parsed.family);
 if(!m||!Object.hasOwn(suffix,parsed.color))return null;
 const kind=m[1]==='kolanko silikonowe'?'straight':'reducer',angle=Number(m[2]),diameter=m[3];
 if((kind==='reducer')!==diameter.includes('/')||diameter.split('/').some(n=>Number(n)<=0))return null;
 const leaf=(kind==='straight'?'Kolanka silikonowe ':'Kolanka redukcyjne ')+angle+'°';
 if(row.category.length!==3||row.category[0]!=='Układ dolotowy'||row.category[1]!=='Łączniki silikonowe'||row.category[2]!==leaf)return null;
 const expected=String(angle).padStart(4,'0')+diameter+(kind==='straight'?'00':'')+'-'+suffix[parsed.color];
 if(row.sku!==expected)return null;
 return {...row,kind,angle,diameter,color:parsed.color};
}
export function siliconeAlternatives(current:SiliconeRow,rows:SiliconeRow[]){
 const selected=siliconeChoice(current);if(!selected)return null;
 const candidates=rows.map(siliconeChoice).filter((v):v is SiliconeChoice=>!!v&&v.kind===selected.kind&&v.color===selected.color&&v.brand.trim().toLowerCase()===selected.brand.trim().toLowerCase()&&(v.angle===selected.angle||v.diameter===selected.diameter));
 if(!candidates.some(v=>v.sku===selected.sku)||new Set(candidates.map(v=>v.angle+':'+v.diameter)).size!==candidates.length)return null;
 return {selected,angles:candidates.filter(v=>v.diameter===selected.diameter).sort((a,b)=>a.angle-b.angle),diameters:candidates.filter(v=>v.angle===selected.angle).sort((a,b)=>Number(a.diameter.split('/')[0])-Number(b.diameter.split('/')[0])||Number(a.diameter.split('/')[1]??0)-Number(b.diameter.split('/')[1]??0))};
}
