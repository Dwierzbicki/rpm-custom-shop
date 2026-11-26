import type {Metadata} from 'next';
import {notFound,redirect} from 'next/navigation';
import {readProduct} from '../../../lib/read-product';
import {productPath} from '../../../lib/product-path';
import {productSocialMetadata} from '../../../lib/social-metadata';
import ProductPageClient from '../../ProductPageClient';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string;sku:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {sku}=await params;const data=await readProduct(sku);
 if(!data)return {title:'Nie znaleziono produktu',robots:{index:false,follow:false}};
 const p=data.product;const canonical=productPath(p.name,p.sku);
 return productSocialMetadata(p,canonical);
}
export default async function Page({params}:Props){
 const {slug,sku}=await params;const data=await readProduct(sku);
 if(!data)notFound();
 const canonical=productPath(data.product.name,data.product.sku);
 if(canonical!=='/produkt/'+slug+'/'+encodeURIComponent(sku))redirect(canonical);
 return <ProductPageClient data={data}/>;
}
