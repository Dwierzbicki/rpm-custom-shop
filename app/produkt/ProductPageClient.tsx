'use client';
import FmicProductPreview,{type Detail} from '../components/storefront/FmicProductPreview';
import StandaloneStorefrontHeader from '../components/storefront/StandaloneStorefrontHeader';
import {productPath} from '../lib/product-path';
import {categoryPath} from '../category-routing';
export default function ProductPageClient({data}:{data:Detail}){
 return <><StandaloneStorefrontHeader/><main className="page rpm-shop-page"><FmicProductPreview sku={data.product.sku} initialData={data} onBack={()=>{try{const previous=new URL(document.referrer);if(previous.origin===location.origin&&previous.pathname.startsWith('/sklep')){location.assign(previous.pathname+previous.search);return}}catch{}location.assign(categoryPath(data.product.target_category))}} onOpen={(sku,name)=>location.assign(productPath(name??'czesc',sku))}/></main></>;
}
