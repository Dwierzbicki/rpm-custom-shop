import type {Metadata} from 'next';
import {notFound,redirect} from 'next/navigation';
import {readProduct} from '../../../lib/read-product';
import {productPath} from '../../../lib/product-path';
import ProductPageClient from '../ProductPageClient';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string;sku:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {sku}=await params;const data=await readProduct(sku);
 if(!data)return {title:'Nie znaleziono produktu',robots:{index:false,follow:false}};
 const p=data.product;const canonical=productPath(p.name,p.sku);
 const description=(p.technical?.intro||p.description||p.name).replace(/\s+/g,' ').slice(0,160);
 return {title:p.name,description,alternates:{canonical},robots:{index:false,follow:false},openGraph:{type:'website',title:p.name,description,url:canonical,images:p.images?.[0]?[p.images[0]]:[]}};
}
export default async function Page({params}:Props){
 const {slug,sku}=await params;const data=await readProduct(sku);
 if(!data)notFound();
 const canonical=productPath(data.product.name,data.product.sku);
 if(canonical!=='/produkt/'+slug+'/'+encodeURIComponent(sku))redirect(canonical);
 return <ProductPageClient data={data}/>;
}
