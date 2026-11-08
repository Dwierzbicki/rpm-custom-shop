// Hard safety boundary for the ordinary FMIC consumer storefront.
// Only fmic.pl and www.fmic.pl may receive browser requests.
const safeHosts=new Set(['fmic.pl','www.fmic.pl']);
const orderWords=/(?:checkout\/(?!cart\/(?:index|add)(?:\/|$))|place.?order|submit.?order|payment|paypal|payu|przelewy24|order\/(?:create|place)|rest\/.*\/payment|graphql)/i;
export const exampleFmicProductUrl=
 'https://fmic.pl/389145-zestaw-naprawczy-uszczelka-pierscien-uszczelniajacy-wtrysku-bosch-f-00v-e35-007-f00ve35007-bos.html';

export function validateFmicProductUrl(value){
 let url;
 try{url=new URL(value)}catch{throw Error('Nieprawidłowy adres produktu FMIC')}
 if(url.protocol!=='https:'||!safeHosts.has(url.hostname)||
    url.username||url.password||url.port||url.search||
    !/^\/[a-z0-9-]+\.html$/i.test(url.pathname)||
    url.pathname.includes('checkout')||url.pathname.includes('payment')){
  throw Error('Dozwolony wyłącznie publiczny adres karty produktu HTTPS w fmic.pl');
 }
 url.hash='';
 return url.toString();
}

export function guardFmicRequest(method,target,cartMutationAllowed=false){
 let url;
 try{url=new URL(target)}catch{return 'abort'}
 if(url.protocol!=='https:'||!safeHosts.has(url.hostname)||url.username||url.password||url.port){
  return 'abort';
 }
 const path=decodeURIComponent(url.pathname);
 const isCartAdd=/^\/checkout\/cart\/add(?:\/|$)/i.test(path);
 // Even GET /checkout/cart/add is forbidden: a storefront can mutate on GET.
 if(isCartAdd&&(!cartMutationAllowed||method!=='POST'))return 'abort';
 const isCartView=/^\/checkout\/cart\/(?:index\/?)?$/i.test(path);
 if(orderWords.test(path)&&!(isCartAdd&&cartMutationAllowed)&&!isCartView)return 'abort';
 if(method==='GET'||method==='HEAD')return 'continue';
 // Mutations OTHER than Magento's add-to-cart path are NEVER permitted.
 if(cartMutationAllowed&&method==='POST'&&isCartAdd)return 'continue';
 return 'abort';
}
