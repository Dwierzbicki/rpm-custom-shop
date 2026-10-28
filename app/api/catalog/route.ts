import {NextResponse} from 'next/server';
import {getCatalog} from '../../lib/catalog-db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({products:(await getCatalog()).filter(p=>p.visible!==false)},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Katalog chwilowo niedostępny'},{status:503})}}
