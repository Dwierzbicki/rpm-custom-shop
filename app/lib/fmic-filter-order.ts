const naturalOrder=new Intl.Collator('pl',{numeric:true,sensitivity:'base'});
function numericValue(value:string){
 const match=value.trim().match(/^([+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+))\s*(mm|cm|cc(?:\/min)?|cm3|cm³|bar|psi|hp|km|l\/min|%|°)?$/i);
 if(!match)return null;
 const number=Number(match[1].replace(',','.'));
 return Number.isFinite(number)?{number,unit:(match[2]??'').toLowerCase()}:null;
}
export function compareOptions(a:{value:string},b:{value:string}){
 const x=numericValue(a.value),y=numericValue(b.value);
 if(x&&y)return naturalOrder.compare(x.unit,y.unit)||x.number-y.number||naturalOrder.compare(a.value,b.value);
 if(x||y)return x?-1:1;
 return naturalOrder.compare(a.value,b.value);
}
