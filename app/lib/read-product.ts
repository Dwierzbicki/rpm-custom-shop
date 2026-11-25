import {cache} from 'react';
import {GET} from '../api/admin/fmic-preview/product/route';
import type {Detail} from '../components/storefront/FmicProductPreview';
export const readProduct=cache(async(sku:string):Promise<Detail|null>=>{
 if(!sku||sku.length>120)return null;
 const response=await GET(new Request('https://rpmcustom.pl/api/catalog/fmic/product?'+new URLSearchParams({sku})));
 if(response.status===404||response.status===400)return null;
 if(!response.ok)throw new Error('Product catalog temporarily unavailable');
 return response.json();
});
