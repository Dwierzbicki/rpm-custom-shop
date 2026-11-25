import {NextResponse} from 'next/server';
import {getCommunity} from '../../lib/community-db';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json(await getCommunity(),{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Community unavailable'},{status:503})}}
