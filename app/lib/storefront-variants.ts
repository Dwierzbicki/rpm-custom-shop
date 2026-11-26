export type StorefrontVariant={sku:string;name:string;color:string;price:string;available:boolean};
export type StorefrontVariantFamily={id:string;variants:StorefrontVariant[]};
const colors:Record<string,[string,string]>={
 'Czarny':['Black','#242424'],'Niebieski':['Blue','#2563eb'],'Czerwony':['Red','#dc2626'],'Zielony':['Green','#249b48'],
 'Pomarańczowy':['Orange','#f58c24'],'Żółty':['Yellow','#eab308'],'Biały':['White','#fafafa'],'Szary':['Grey','#7b8794'],
 'Srebrny':['Silver','#bfc4cc'],'Złoty':['Gold','#d4af37'],'Fioletowy':['Purple','#884bd3'],'Różowy':['Pink','#ec4899'],
 'Miedziany':['Copper','#b87333'],'Karbon przezroczysty':['Transparent carbon','#454545'],
 'Fioletowy przezroczysty':['Transparent purple','#b98ae8'],'Niebieski przezroczysty':['Transparent blue','#83bbef'],
 'Czerwony przezroczysty':['Transparent red','#f28b90'],'Przezroczysty':['Transparent','#dce9ed']
};
export function variantColor(color:string,english:boolean){
 const entry=Object.hasOwn(colors,color)?colors[color]:undefined;
 return {label:english&&entry?entry[0]:color,swatch:entry?.[1]??null};
}
export function usableVariantFamily(family:StorefrontVariantFamily|null|undefined,sku:string){
 if(!family||family.variants.length<2||family.variants.length>40||!family.variants.some(v=>v.sku===sku))return null;
 if(new Set(family.variants.map(v=>v.sku)).size!==family.variants.length||new Set(family.variants.map(v=>v.color)).size!==family.variants.length)return null;
 return family;
}

// Compare displayed gross prices in integer grosze; avoid floating-point dust.
export function variantPriceDelta(price:string,selectedPrice:string):string|null{
 if(!price.trim()||!selectedPrice.trim())return null;
 const current=Number(price),selected=Number(selectedPrice);
 if(!Number.isFinite(current)||!Number.isFinite(selected)||current<0||selected<0)return null;
 const delta=Math.round(current*100)-Math.round(selected*100);
 if(!delta)return null;
 return (delta>0?'+ ':'− ')+(Math.abs(delta)/100).toLocaleString('pl-PL',{style:'currency',currency:'PLN'});
}
