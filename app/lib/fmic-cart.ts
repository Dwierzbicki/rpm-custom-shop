import {isRetiredDemoProductId,type CartLine} from '../data';
export const CART_EVENT='rpm-cart-change';
export type FmicQuote={sku:string;name:string;unitPrice:number;available:boolean;image:string|null;updatedAt:string};
export async function quoteFmicCart(skus:string[],signal?:AbortSignal):Promise<FmicQuote[]>{
 const unique=[...new Set(skus)];
 if(!unique.length)return [];
 const items:FmicQuote[]=[];
 // The quote API accepts at most 30 SKU per request. Keep requests bounded
 // as complete build plans include many material variants.
 for(let offset=0;offset<unique.length;offset+=30){
  const response=await fetch('/api/catalog/fmic/cart-quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({skus:unique.slice(offset,offset+30)}),cache:'no-store',signal});
  if(!response.ok)throw Error('Nie udało się sprawdzić ceny i dostępności. Spróbuj ponownie.');
  const data=await response.json();
  if(!Array.isArray(data.items))throw Error('Niepoprawna odpowiedź katalogu');
  items.push(...data.items);
 }
 return items;
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
export async function addFmicToCart(sku:string,qty:number,displayedPrice:number,expectedName?:string){
 if(!Number.isSafeInteger(qty)||qty<1||qty>50)throw Error('Wybierz ilość od 1 do 50');
 const [quote]=await quoteFmicCart([sku]);
 if(quote&&expectedName!==undefined&&quote.name!==expectedName)throw Error('Dane produktu uległy zmianie. Wymagana ponowna weryfikacja.');
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

/** Same cart, distinct source identity: manual offers never enter FMIC procurement. */
export async function addManualToCart(sku:string,id:number,qty:number,displayedPrice:number,chosenOptions:Record<string,string>,target:'cart'|'garage'='cart'){
 if(!Number.isSafeInteger(qty)||qty<1||qty>50)throw Error('Wybierz ilość od 1 do 50');
 const response=await fetch('/api/catalog',{cache:'no-store'});
 if(!response.ok)throw Error('Nie udało się sprawdzić produktu.');
 const data=await response.json();
 const p=(Array.isArray(data.products)?data.products:[]).find((p:import('./catalog-db').CatalogItem)=>p.id===id&&p.sku===sku) as import('./catalog-db').CatalogItem|undefined;
 if(!p||p.visible===false||p.stockStatus==='unavailable')throw Error('Produkt jest obecnie niedostępny.');
 const groups=(p.optionGroups??[]).filter(g=>g.id!=='rpm-wastegate');
 if(p.configurable&&!groups.length)throw Error('Konfiguracja produktu wymaga potwierdzenia.');
 if(Object.entries(chosenOptions).some(([key,value])=>!groups.some(g=>g.id===key&&g.options.some(o=>o.id===value))))throw Error('Opcje produktu uległy zmianie.');
 const {configuredCartLine}=await import('./product-configuration');
 const line=configuredCartLine(p,{chosenOptions,qty,engine:'',flange:'',wg:'',egt:false});
 if(!line)throw Error('Wybierz wymagane opcje produktu.');
 if(line.unitPrice!==displayedPrice)throw Error('Cena produktu uległa zmianie. Odśwież kartę produktu.');
 const storageKey=target==='garage'?'rpm-garage':'rpm-cart';
 const raw:unknown=JSON.parse(localStorage.getItem(storageKey)??'[]');
 if(!Array.isArray(raw))throw Error('Nie udało się odczytać koszyka.');
 const lines=(raw as CartLine[]).filter(l=>l&&(l.fmicSku||!isRetiredDemoProductId(l.productId)));
 const current=lines.find(l=>l.key===line.key);
 if((current?.qty??0)+qty>50)throw Error('Maksymalnie 50 sztuk na pozycję.');
 if(!current&&lines.length>=30)throw Error('Koszyk może zawierać maksymalnie 30 pozycji.');
 const next=current?lines.map(l=>l.key===line.key?{...line,qty:l.qty+qty}:l):[...lines,line];
 localStorage.setItem(storageKey,JSON.stringify(next));if(target==='cart')window.dispatchEvent(new Event(CART_EVENT));
 return line;
}
