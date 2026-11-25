import brands from '../components/storefront/brand-assets.json';
export const normalizeBrand=(value:string)=>value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
export const brandAliases:Readonly<Record<string,string>>={'manley performance':'manley','iod performance':'iod','pulsar turbo systems':'pulsar','pulsar psr':'pulsar','ecu master':'ecumaster','garrett motion':'garrett'};
export function brandSearchNames(query:string):string[]{
 const normalized=normalizeBrand(query);
 const brand=brands.find(b=>normalizeBrand(b.name)===normalized||b.slug===brandAliases[normalized]);
 if(!brand)return [];
 return [...new Set([normalizeBrand(brand.name),...Object.entries(brandAliases).filter(([,slug])=>slug===brand.slug).map(([name])=>name)])];
}
