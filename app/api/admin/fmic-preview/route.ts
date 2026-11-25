import {NextResponse} from 'next/server';
import {getDbPool} from '../../../lib/db';
import {resolveCategoryPath} from '../../../category-routing';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const path=resolveCategoryPath(params.get('category')??'/sklep');
 if(!path?.length)return NextResponse.json({error:'Wybierz kategorię sklepu'},{status:400});
 const raw=Number(params.get('page')??1),page=Number.isSafeInteger(raw)?Math.max(1,Math.min(10000,raw)):1,size=24;
 const q=(params.get('q')??'').trim().slice(0,120);
 const sort=params.get('sort');
 const stock=params.get('stock')==='available'?'available':params.get('stock')==='unavailable'?'unavailable':'all';
 const order=sort==='priceAsc'?'proposed_gross ASC, sku ASC':sort==='priceDesc'?'proposed_gross DESC, sku ASC':'available DESC, sku ASC';
 const where="WHERE mapping_status IN ('exact','normalized','manual') AND target_category[1:cardinality($1::text[])]=$1::text[] AND ($2='' OR strpos(lower(name),lower($2))>0 OR strpos(lower(sku),lower($2))>0) AND ($3='all' OR ($3='available' AND available) OR ($3='unavailable' AND NOT available))";
 try{
 const db=getDbPool();
 const [count,items]=await Promise.all([
 db.query('SELECT count(*)::int AS total FROM rpm_fmic_catalog '+where,[path,q,stock]),
 db.query("SELECT sku,name,proposed_gross,available,data->'images'->>0 AS image FROM rpm_fmic_catalog "+where+' ORDER BY '+order+' LIMIT $4 OFFSET $5',[path,q,stock,size,(page-1)*size])
 ]);
 return NextResponse.json({items:items.rows,total:count.rows[0].total,page,size,path},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){console.error('FMIC preview failed',e);return NextResponse.json({error:'Nie udało się pobrać podglądu'},{status:500})}
}
