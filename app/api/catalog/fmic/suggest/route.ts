import {getCatalog} from '../../../../lib/catalog-db';
import {ownListingRows} from '../../../../lib/own-catalog-listing';
import {NextResponse} from 'next/server';
import {GET as readCatalog} from '../../../admin/fmic-preview/suggest/route';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(process.env.SITE_LOCK_ENABLED!=='1')return NextResponse.json({error:'Katalog jeszcze niedostępny'},{status:503,headers:{'Cache-Control':'private, no-store'}});
 const response=await readCatalog(request);
 if(!response.ok)return response;
 const q=(new URL(request.url).searchParams.get('q')??'').trim().slice(0,120);
 if(q.length<2)return response;
 try{
 const payload=await response.json(),rows=ownListingRows(await getCatalog(),q,'all',null,null);
 const categories=new Map<string,number>((payload.categories??[]).map((c:{name:string;count:number})=>[c.name,Number(c.count)]));
 for(const r of rows){const root=r.target_category[0];if(root)categories.set(root,(categories.get(root)??0)+1)}
 const own=rows.sort((a,b)=>Number(b.sku.toLowerCase()===q.toLowerCase())-Number(a.sku.toLowerCase()===q.toLowerCase())||Number(b.available)-Number(a.available)||a.sku.localeCompare(b.sku)).slice(0,3).map(r=>({sku:r.sku,name:r.name,proposed_gross:r.proposed_gross,available:r.available,image:r.data.images[0]??null,own_id:r.own_id,stock_status:r.stock_status}));
 return NextResponse.json({...payload,items:[...own,...(payload.items??[])].slice(0,9),total:Number(payload.total??0)+rows.length,categories:[...categories].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,4)},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){console.error('Own catalog suggestions failed',e);return NextResponse.json({error:'Nie udało się pobrać podpowiedzi'},{status:500})}
}
