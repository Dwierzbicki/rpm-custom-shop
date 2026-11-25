import {NextResponse} from 'next/server';
import {listDynoBuilds,saveDynoBuild} from '../../../lib/motolab-dyno-db';
import {validDynoBuild} from '../../../lib/motolab-dyno';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){try{return NextResponse.json({builds:await listDynoBuilds()},{headers})}catch{return NextResponse.json({error:'Błąd odczytu'},{status:503,headers})}}
export async function PUT(r:Request){try{
 const origin=r.headers.get('origin');if(!origin||new URL(origin).host!==r.headers.get('host'))return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403,headers});
 if(!r.headers.get('content-type')?.includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415,headers});
 const raw=await r.text();if(raw.length>60000)return NextResponse.json({error:'Zbyt duże żądanie'},{status:413,headers});
 const b=JSON.parse(raw);if(!validDynoBuild(b))return NextResponse.json({error:'Sprawdź pola; publikacja wymaga wykresu, części i potwierdzenia.'},{status:400,headers});
 return NextResponse.json({build:await saveDynoBuild(b)},{headers});
 }catch(e){return NextResponse.json({error:e instanceof Error&&e.message.startsWith('SKU lub nazwa')?e.message:'Błąd zapisu'},{status:400,headers})}}
