import {NextResponse} from 'next/server';
import {getCommunity,saveCommunity} from '../../../lib/community-db';
import {validCommunity} from '../../../lib/community-settings';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json(await getCommunity(),{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Błąd odczytu'},{status:503})}}
export async function PUT(request:Request){try{const origin=request.headers.get('origin');if(!origin||new URL(origin).host!==request.headers.get('host'))return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});const value=await request.json();if(!validCommunity(value))return NextResponse.json({error:'Sprawdź teksty, adres grupy Facebook i adres HTTPS zdjęcia.'},{status:400});await saveCommunity(value);return NextResponse.json(value)}catch{return NextResponse.json({error:'Błąd zapisu'},{status:500})}}
