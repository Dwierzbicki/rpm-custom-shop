import {NextResponse} from 'next/server';
import {GET as readCatalog} from '../../../admin/fmic-preview/product/route';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(process.env.SITE_LOCK_ENABLED!=='1')return NextResponse.json({error:'Katalog jeszcze niedostępny'},{status:503,headers:{'Cache-Control':'private, no-store'}});
 return readCatalog(request);
}
