import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {getDbPool} from '../../../lib/db';
import {validateBatch} from '../../../engine-hardware/audit';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){try{
 const r=await getDbPool().query("SELECT key,updated_at,data->>'engine' AS engine,jsonb_array_length(data->'rows') AS count FROM rpm_shop_settings WHERE key LIKE 'engine_hardware_draft:%' ORDER BY updated_at DESC LIMIT 50");
 return NextResponse.json({batches:r.rows},{headers});
 }catch{return NextResponse.json({error:'Nie udało się odczytać importów.'},{status:503,headers})}}
export async function POST(r:Request){try{
 const origin=r.headers.get('origin');if(!origin||new URL(origin).host!==r.headers.get('host'))return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403,headers});
 if(!r.headers.get('content-type')?.includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415,headers});
 const raw=await r.text();if(raw.length>1000000)return NextResponse.json({error:'Zbyt duże żądanie'},{status:413,headers});
 let input:unknown;try{input=JSON.parse(raw)}catch{return NextResponse.json({error:'Niepoprawny JSON'},{status:400,headers})}
 const check=validateBatch(input);if(!check.ok)return NextResponse.json({errors:check.errors},{status:400,headers});
 const id=randomUUID();await getDbPool().query('INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES($1,$2::jsonb,NOW())',['engine_hardware_draft:'+id,JSON.stringify(check.batch)]);
 return NextResponse.json({id,count:check.batch.rows.length},{status:201,headers});
 }catch{return NextResponse.json({error:'Błąd zapisu wersji roboczej.'},{status:503,headers})}}
