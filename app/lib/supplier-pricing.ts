export type PricingRules={markupPercent:number;minimumMarkupPercent:number;roundTo:number;maxLeadDays:number;manualPrices:Record<string,number>};
export const DEFAULT_PRICING_RULES:PricingRules={markupPercent:20,minimumMarkupPercent:10,roundTo:1,maxLeadDays:7,manualPrices:{}};
export function validPricingRules(value:unknown):value is PricingRules{
 if(!value||typeof value!=='object')return false;const x=value as Record<string,unknown>;
 const pct=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=500;
 if(!pct(x.markupPercent)||!pct(x.minimumMarkupPercent)||!Number.isInteger(x.maxLeadDays)||Number(x.maxLeadDays)<0||Number(x.maxLeadDays)>365||![0.01,0.1,1,5,10].includes(Number(x.roundTo)))return false;
 if(!x.manualPrices||typeof x.manualPrices!=='object'||Array.isArray(x.manualPrices))return false;
 const entries=Object.entries(x.manualPrices);return entries.length<=10000&&entries.every(([id,price])=>/^[1-9][0-9]*$/.test(id)&&typeof price==='number'&&Number.isFinite(price)&&price>=0&&price<=10000000);
}
export function quotePrice(costNet:number,productId:number,rules:PricingRules){
 const base=Math.max(0,costNet),minimum=base*(1+rules.minimumMarkupPercent/100);
 const suggested=Math.ceil((base*(1+Math.max(rules.markupPercent,rules.minimumMarkupPercent)/100)-0.00000001)/rules.roundTo)*rules.roundTo;
 const override=rules.manualPrices[String(productId)];
 const price=override===undefined?suggested:override;
 return {price:Math.round(price*100)/100,minimum:Math.round(minimum*100)/100,valid:price+0.000001>=minimum,manual:override!==undefined};
}
