/**
 * Strict post-add verification for FMIC cart.
 *
 * Prices must be current unit prices in PLN, not historic lowest-price labels.
 * Unknown lines, duplicate SKU, quantities, prices or subtotals STOP further
 * automation. This module has no network, browser, or purchase functions.
 */
export function parsePlnPrice(text){
 if(typeof text!=='string')return null;
 const normalized=text.replace(/\u00a0|\u202f/g,' ').trim();
 // Reject multiple currency values / historic-price paragraphs.
 if(!/^(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[,.]\d{2})?\s*(?:zł|PLN)?$/i.test(normalized))return null;
 const numeric=normalized.replace(/(?:zł|PLN)$/i,'').trim().replace(/[ .](?=\d{3}(?:\D|$))/g,'').replace(',','.');
 const n=Number(numeric);
 return Number.isFinite(n)&&n>0&&n<=10_000_000?Math.round(n*100)/100:null;
}
const round=(v)=>Math.round((v+Number.EPSILON)*100)/100;
const skuKey=(v)=>typeof v==='string'?v.trim().toUpperCase():'';
export function verifyFmicCart(expected,observed,subtotal){
 if(!Array.isArray(expected)||expected.length===0||!Array.isArray(observed)){
  return {ok:false,issues:['Brak pozycji oczekiwanych lub danych koszyka']};
 }
 const issues=[];
 const required=new Map();
 for(const item of expected){
  const key=skuKey(item.sku);
  if(!key||required.has(key)||!Number.isSafeInteger(item.qty)||item.qty<1||
   !Number.isFinite(item.cap)||item.cap<=0){
   issues.push('Niepoprawny lub powtórzony SKU/ilość/limit zakupu: '+key);continue;
  }
  required.set(key,item);
 }
 const seen=new Map();
 let total=0;
 for(const item of observed){
  const key=skuKey(item.sku);
  if(!key||seen.has(key)){
   issues.push('Nieustalone lub powtórzone SKU w koszyku: '+key);continue;
  }
  seen.set(key,item);
  const want=required.get(key);
  if(!want){
   issues.push('Obcy produkt w koszyku: '+key);continue;
  }
  if(!Number.isSafeInteger(item.qty)||item.qty!==want.qty){
   issues.push('Ilość SKU '+key+' nie zgadza się z zamówieniem');continue;
  }
  if(!Number.isFinite(item.unitGrossPLN)||item.unitGrossPLN<=0||
   item.unitGrossPLN>want.cap){
   issues.push('Nieznana lub za wysoka aktualna cena brutto SKU '+key);continue;
  }
  total=round(total+round(item.unitGrossPLN*item.qty));
 }
 for(const [key] of required)if(!seen.has(key))issues.push('Brak SKU w koszyku: '+key);
 if(observed.length!==expected.length)issues.push('Inna liczba pozycji koszyka niż w planie');
 if(!Number.isFinite(subtotal)||subtotal<=0||Math.abs(round(subtotal)-total)>0.02){
  issues.push('Suma produktów nie odpowiada sprawdzonym cenom i ilościom');
 }
 return {ok:issues.length===0,issues,verifiedLines:seen.size,
  calculatedGrossPLN:total,observedSubtotalGrossPLN:subtotal};
}
