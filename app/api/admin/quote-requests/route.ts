import {NextResponse} from 'next/server';
import {getDbPool} from '../../../lib/db';
import {ensureFmicRequests} from '../../../lib/fmic-quote-requests';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){
 try{await ensureFmicRequests();const r=await getDbPool().query('SELECT id::text,customer,items,estimated_subtotal::float8 AS subtotal,status,created_at FROM rpm_fmic_quote_requests ORDER BY id DESC LIMIT 200');return NextResponse.json({requests:r.rows},{headers})}
 catch{return NextResponse.json({error:'Nie udało się pobrać zapytań'},{status:503,headers})}
}
export async function PATCH(request:Request){
 try{
  const origin=request.headers.get('origin');if(!origin||new URL(origin).host!==request.headers.get('host'))return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403,headers});
  if(!(request.headers.get('content-type')??'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415,headers});
  const b=await request.json();if(typeof b?.id!=='string'||!/^[1-9][0-9]{0,17}$/.test(b.id)||!['new','contacted','closed'].includes(b.status))return NextResponse.json({error:'Niepoprawne dane'},{status:400,headers});
  await ensureFmicRequests();const r=await getDbPool().query('UPDATE rpm_fmic_quote_requests SET status=$2 WHERE id=$1 RETURNING id::text,status',[b.id,b.status]);
  return r.rowCount?NextResponse.json({request:r.rows[0]},{headers}):NextResponse.json({error:'Nie znaleziono zapytania'},{status:404,headers});
 }catch{return NextResponse.json({error:'Nie udało się zapisać statusu'},{status:503,headers})}
}
