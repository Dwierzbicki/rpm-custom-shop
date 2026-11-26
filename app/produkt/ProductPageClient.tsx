'use client';
import {useStorefrontLanguage} from '../components/storefront/hooks/useStorefrontLanguage';
import FmicProductPreview,{type Detail} from '../components/storefront/FmicProductPreview';
import StandaloneStorefrontHeader from '../components/storefront/StandaloneStorefrontHeader';
import StorefrontFooter from '../components/storefront/StorefrontFooter';
import {productPath} from '../lib/product-path';
import {categoryPath} from '../category-routing';
import {listingReturnPath} from '../lib/listing-history';
export default function ProductPageClient({data}:{data:Detail}){
 const {lang}=useStorefrontLanguage();
 return <><StandaloneStorefrontHeader/><main className="page rpm-shop-page" data-rpm-audit-sku={new URLSearchParams({sku:data.product.sku}).toString()}><FmicProductPreview sku={data.product.sku} initialData={data} onBack={()=>{const previous=listingReturnPath(document.referrer,location.origin);if(previous){if(window.history.length>1){window.history.back();return}location.assign(previous);return}location.assign(categoryPath(data.product.target_category))}} onOpen={(sku,name)=>location.assign(productPath(name??'czesc',sku))}/></main><StorefrontFooter lang={lang}/></>;
}
