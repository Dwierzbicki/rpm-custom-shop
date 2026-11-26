import type {Metadata} from 'next';

export const socialOrigin='https://rpmcustom.pl';
export const siteTitle='RPM Custom – tuning i motorsport';
export const siteDescription='Części tuningowe, turbosprężarki, kute podzespoły silników i kolektory RPM Custom. Zbuduj swój projekt performance.';
export const socialFallback=socialOrigin+'/optimized/social-card.jpg';
const clean=(value:string|undefined)=> (value??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/\s+/g,' ').trim();
function shorten(value:string,max:number){
 if(value.length<=max)return value;
 const cut=value.slice(0,max-1),space=cut.lastIndexOf(' ');
 return (space>max*.65?cut.slice(0,space):cut).trimEnd()+'…';
}
function productImage(images:string[]|undefined){
 for(const value of images??[]){
  try{
   const url=new URL(value);
   if(url.protocol!=='https:'||url.username||url.password)continue;
   // Only transform our own Cloudinary assets; do not proxy arbitrary supplier URLs.
   if(url.hostname==='res.cloudinary.com'&&/^\/if1bnaya\/image\/upload\/v\d+\//.test(url.pathname)){
    url.pathname=url.pathname.replace('/image/upload/','/image/upload/c_pad,w_1200,h_630,b_white,f_jpg,q_auto/');
    return {url:url.toString(),width:1200,height:630};
   }
   return {url:url.toString()};
  }catch{continue}
 }
 return {url:socialFallback,width:1200,height:630};
}
function socialTags(title:string,description:string,image:{url:string;width?:number;height?:number},canonical?:string):Pick<Metadata,'openGraph'|'twitter'>{
 return {
  openGraph:{type:'website',locale:'pl_PL',siteName:'RPM Custom',title,description,...(canonical?{url:new URL(canonical,socialOrigin).href}:{}),images:[{...image,alt:title}]},
  twitter:{card:'summary_large_image',title,description,images:[image.url]}
 };
}
export function siteSocialMetadata(){
 return socialTags(siteTitle,siteDescription,{url:socialFallback,width:1200,height:630});
}
export function productSocialMetadata(p:{name:string;brand?:string;sku:string;description?:string;technical?:{intro?:string};images?:string[]},canonical:string):Metadata{
 const name=clean(p.name);
 const title=shorten(name||p.sku,105);
 const intro=clean(p.technical?.intro);
 const full=clean(p.description);
 const useful=[intro,full].find(value=>value&&value!==name);
 const description=shorten(useful||[clean(p.brand),p.sku,'Sprawdź produkt w RPM Custom.'].filter(Boolean).join(' · '),170);
 return {title:p.name,description,alternates:{canonical},robots:{index:false,follow:false},...socialTags(title,description,productImage(p.images),canonical)};
}
