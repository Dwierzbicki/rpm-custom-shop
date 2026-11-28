import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import StandaloneStorefrontHeader from '../components/storefront/StandaloneStorefrontHeader';
import StorefrontFooter from '../components/storefront/StorefrontFooter';
import {getCatalog} from '../lib/catalog-db';
import {productPath} from '../lib/product-path';
import {parts,type Offer} from './catalog';
import HardwareCatalog from './HardwareCatalog';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'RPM Engine Hardware | RPM Custom',robots:{index:false,follow:false}};
export default async function Page(){
 if(process.env.ENGINE_HARDWARE_PREVIEW!=='1')notFound();
 const offers:Offer[]=[];
 const skus=new Set(parts.flatMap(p=>p.sku?[p.sku]:[]));
 if(skus.size){
  try{for(const p of await getCatalog()){
   if(skus.has(p.sku)&&p.visible===true&&p.stockStatus!=='unavailable'&&!p.configurable&&!(p.optionGroups??[]).length&&Number.isFinite(p.price)&&p.price>0)offers.push({id:p.id,sku:p.sku,price:p.price,url:productPath(p.name,p.sku)});
  }}catch(e){console.error('[engine-hardware] catalog unavailable',e)}
 }
 return <><StandaloneStorefrontHeader/><HardwareCatalog offers={offers}/><StorefrontFooter/></>;
}
