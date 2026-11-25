export type FmicCommercialSettings={
 priceBasis:'unknown'|'purchase_net'|'purchase_gross'|'retail_gross';
 markupPercent:number;
 vatPercent:number;
 shippingMode:'quote'|'weight';
 country:'PL';
 tiers:{maxKg:number;gross:number}[];
};
export const DEFAULT_FMIC_COMMERCIAL:FmicCommercialSettings={priceBasis:'unknown',markupPercent:0,vatPercent:23,shippingMode:'quote',country:'PL',tiers:[]};
export function validFmicCommercial(v:unknown):v is FmicCommercialSettings{
 if(!v||typeof v!=='object')return false;
 const s=v as FmicCommercialSettings;
 const bounded=(n:unknown,max:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max&&Math.abs(n*100-Math.round(n*100))<1e-6;
 if(!['unknown','purchase_net','purchase_gross','retail_gross'].includes(s.priceBasis)||!bounded(s.markupPercent,500)||!bounded(s.vatPercent,100)||!['quote','weight'].includes(s.shippingMode)||s.country!=='PL'||!Array.isArray(s.tiers)||s.tiers.length>20)return false;
 let last=0;
 for(const t of s.tiers){if(!t||!bounded(t.maxKg,1000)||!bounded(t.gross,10000)||t.maxKg<=last)return false;last=t.maxKg}
 return s.shippingMode!=='weight'||s.tiers.length>0;
}
export function previewFmicPrice(source:number,settings:FmicCommercialSettings){
 if(!Number.isFinite(source)||source<=0||!validFmicCommercial(settings)||settings.priceBasis==='unknown')return null;
 const vat=1+settings.vatPercent/100;
 // Retail gross is a reference price, not a purchase cost; no margin inference.
 if(settings.priceBasis==='retail_gross')return {gross:Math.round(source*100)/100,net:Math.round(source/vat*100)/100,profitNet:null};
 const costNet=settings.priceBasis==='purchase_net'?source:source/vat;
 const gross=Math.round(costNet*(1+settings.markupPercent/100)*vat*100)/100;
 const net=Math.round(gross/vat*100)/100;
 return {gross,net,profitNet:Math.round((net-costNet)*100)/100};
}
export function parseFmicWeight(value:unknown):number|null{
 if(typeof value!=='string'||!/^\s*\d+(?:[.,]\d+)?\s*kg\s*$/i.test(value))return null;
 const kg=Number(value.trim().replace(/\s*kg$/i,'').replace(',','.'));
 return Number.isFinite(kg)&&kg>0&&kg<=1000?kg:null;
}
export function previewFmicDelivery(lines:{weight:string|null;qty:number}[],settings:FmicCommercialSettings){
 if(!validFmicCommercial(settings)||settings.shippingMode!=='weight'||!lines.length)return null;
 let kg=0;
 for(const line of lines){const w=parseFmicWeight(line.weight);if(w===null||!Number.isSafeInteger(line.qty)||line.qty<1||line.qty>50)return null;kg+=w*line.qty}
 const tier=settings.tiers.find(t=>kg<=t.maxKg+1e-9);
 return tier?{kg:Math.round(kg*1000)/1000,gross:tier.gross}:null;
}
