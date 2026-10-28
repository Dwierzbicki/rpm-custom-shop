import {NextResponse} from 'next/server';
import {Pool} from 'pg';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const globalDb=globalThis as unknown as {rpmAdminOrdersPool?:Pool};
function db(){if(!process.env.DATABASE_URL)throw Error('Database unavailable');return globalDb.rpmAdminOrdersPool??(globalDb.rpmAdminOrdersPool=new Pool({connectionString:process.env.DATABASE_URL,max:4}));}
const statuses=['new','confirmed','processing','shipped','cancelled'] as const;
async function ensure(){await db().query("CREATE TABLE IF NOT EXISTS rpm_orders (id BIGSERIAL PRIMARY KEY, customer JSONB NOT NULL, items JSONB NOT NULL, total NUMERIC(12,2) NOT NULL, status TEXT NOT NULL DEFAULT 'new', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");}
function sameOrigin(request:Request){const origin=request.headers.get('origin');const host=request.headers.get('host');try{return !origin||!!host&&new URL(origin).host===host}catch{return false}}
export async function GET(){
 try{await ensure();const result=await db().query('SELECT id::text, customer, items, total::float8 AS total, status, created_at FROM rpm_orders ORDER BY created_at DESC, id DESC LIMIT 500');return NextResponse.json({orders:result.rows},{headers:{'Cache-Control':'no-store'}})}
 catch{return NextResponse.json({error:'Nie udało się pobrać zamówień'},{status:503})}
}
export async function PATCH(request:Request){
 try{
  if(!sameOrigin(request))return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
  if(!(request.headers.get('content-type')??'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
  const input=await request.json() as {id?:string;status?:string};
  if(!input||typeof input.id!=='string'||!/^[1-9][0-9]{0,17}$/.test(input.id)||!statuses.some(s=>s===input.status))return NextResponse.json({error:'Niepoprawne dane'},{status:400});
  await ensure();
  const result=await db().query('UPDATE rpm_orders SET status=$1 WHERE id=$2 RETURNING id::text, status',[input.status,input.id]);
  if(!result.rowCount)return NextResponse.json({error:'Nie znaleziono zamówienia'},{status:404});
  return NextResponse.json({order:result.rows[0]});
 }catch{return NextResponse.json({error:'Nie udało się zmienić statusu'},{status:500})}
}
