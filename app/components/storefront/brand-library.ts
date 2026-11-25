import brands from './brand-assets.json';
import generated from './brand-display.generated.json';
const logos:Record<string,string>=generated;
type Brand=(typeof brands)[number];
const normalized=(value:string)=>value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const aliases:Record<string,string>={'manley performance':'manley','iod performance':'iod','pulsar turbo systems':'pulsar','pulsar psr':'pulsar','ecu master':'ecumaster'};
export function findBrandAsset(brand:string|null|undefined,name:string):Brand|undefined{
 const explicit=normalized(brand??'');
 if(explicit)return brands.find(b=>normalized(b.name)===explicit||b.slug===aliases[explicit]);
 // Only leading brand tokens or a small, explicit product-type prefix; never "fits BRAND".
 const title=normalized(name).replace(/^(?:turbosprężarka|turbocharger|kute tłoki|forged pistons|tłoki|pistons|korbowody|connecting rods|wtryskiwacze|injectors|sterownik|ecu|olej silnikowy|engine oil|klocki hamulcowe|brake pads)\s+/u,'');
 return brands.find(b=>{const n=normalized(b.name);return title===n||title.startsWith(n+' ')||title.startsWith(n+',')||title.startsWith(n+':')});
}
export function brandLogoSrc(brand:Brand){return logos[brand.slug]}
export const brandAssets=brands;
