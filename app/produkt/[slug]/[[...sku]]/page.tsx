import type {Metadata} from 'next';
import {notFound,redirect} from 'next/navigation';
import {readProduct} from '../../../lib/read-product';
import {productPath,productRouteSku,isCanonicalProductRoute} from '../../../lib/product-path';
import {productSocialMetadata} from '../../../lib/social-metadata';
import ProductPageClient from '../../ProductPageClient';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string;sku?:string[]}>;searchParams:Promise<{sku?:string|string[]}>};
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
 const [{sku:parts},query]=await Promise.all([params,searchParams]);
 const sku=productRouteSku(parts,query.sku);
 const data=sku?await readProduct(sku):null;
 if(!data)return {title:'Nie znaleziono produktu',robots:{index:false,follow:false}};
 const p=data.product;
 return productSocialMetadata(p,productPath(p.name,p.sku));
}
export default async function Page({params,searchParams}:Props){
 const [{slug,sku:parts},query]=await Promise.all([params,searchParams]);
 const sku=productRouteSku(parts,query.sku);
 if(!sku)notFound();
 const data=await readProduct(sku);
 if(!data)notFound();
 const p=data.product;
 if(!isCanonicalProductRoute(p.name,p.sku,slug,parts))redirect(productPath(p.name,p.sku));
 return <ProductPageClient data={data}/>;
}
