import {NextResponse} from 'next/server';
import {listDynoBuilds} from '../../lib/motolab-dyno-db';
import {powerRangesFor} from '../../lib/storefront-config';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:Request){try{const v=new URL(r.url).searchParams.get('version')??'';if(!powerRangesFor(v).length)return NextResponse.json({builds:[]});return NextResponse.json({builds:await listDynoBuilds(true,v)},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Unavailable'},{status:503})}}
