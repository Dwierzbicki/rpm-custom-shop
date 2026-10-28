import {NextResponse} from 'next/server';
import {getShippingSettings} from '../../lib/settings-db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({shipping:await getShippingSettings()},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Nie można pobrać ustawień dostawy'},{status:503})}}
