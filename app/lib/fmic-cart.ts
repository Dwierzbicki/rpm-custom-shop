import {isRetiredDemoProductId,type CartLine} from '../data';
export const CART_EVENT='rpm-cart-change';
export type FmicQuote={sku:string;name:string;unitPrice:number;available:boolean;image:string|null;updatedAt:string};
export async function quoteFmicCart(skus:string[],signal?:AbortSignal):Promise<FmicQuote[]>{
 if(!skus.length)return [];
 const response=await fetch('/api/catalog/fmic/cart-quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({skus:[...new Set(skus)]}),cache:'no-store',signal});
 if(!response.ok)throw Error('Nie udało się sprawdzić ceny i dostępności. Spróbuj ponownie.');
 const data=await response.json();
 if(!Array.isArray(data.items))throw Error('Niepoprawna odpowiedź katalogu');
 return data.items;
}
export function mergeFmicQuotes(lines:CartLine[],quotes:FmicQuote[]):CartLine[]{
 const bySku=new Map(quotes.map(q=>[q.sku,q]));
 return lines.map(l=>{
  if(!l.fmicSku)return l;
  const q=bySku.get(l.fmicSku);
  if(!q)return {...l,fmicAvailable:false};
  const validPrice=Number.isFinite(q.unitPrice)&&q.unitPrice>0;
  return {...l,unitPrice:validPrice?q.unitPrice:l.unitPrice,fmicPreviousPrice:validPrice&&l.unitPrice!==undefined&&l.unitPrice!==q.unitPrice?l.unitPrice:l.fmicPreviousPrice,fmicName:q.name,fmicImage:q.image,fmicAvailable:q.available&&validPrice};
 });
}
export async function addFmicToCart(sku:string,qty:number,displayedPrice:number){
 if(!Number.isSafeInteger(qty)||qty<1||qty>50)throw Error('Wybierz ilość od 1 do 50');
 const [quote]=await quoteFmicCart([sku]);
 if(!quote||!quote.available)throw Error('Produkt jest obecnie niedostępny.');
 if(!Number.isFinite(quote.unitPrice)||quote.unitPrice<=0)throw Error('Cena wymaga potwierdzenia.');
 if(quote.unitPrice!==displayedPrice)throw Error('Cena produktu uległa zmianie. Odśwież kartę produktu przed dodaniem.');
 const raw:unknown=JSON.parse(localStorage.getItem('rpm-cart')??'[]');
 if(!Array.isArray(raw))throw Error('Nie udało się odczytać koszyka.');
 const lines=(raw as CartLine[]).filter(l=>l&&(l.fmicSku||!isRetiredDemoProductId(l.productId))),key='fmic:'+sku;
 const current=lines.find(l=>l.key===key);
 if((current?.qty??0)+qty>50)throw Error('Maksymalnie 50 sztuk na pozycję.');
 if(!current&&lines.length>=30)throw Error('Koszyk może zawierać maksymalnie 30 pozycji.');
 const line:CartLine={key,productId:0,qty:(current?.qty??0)+qty,fmicSku:sku,fmicName:quote.name,fmicImage:quote.image,fmicAvailable:true,unitPrice:quote.unitPrice};
 const next=current?lines.map(l=>l.key===key?line:l):[...lines,line];
 localStorage.setItem('rpm-cart',JSON.stringify(next));
 window.dispatchEvent(new Event(CART_EVENT));
 return line;
}
