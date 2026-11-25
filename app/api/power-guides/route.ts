import {NextResponse} from 'next/server';
import {isRetiredDemoProductId} from '../../data';
import {getGuideSettings} from '../../lib/power-guides-db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{const data=await getGuideSettings();return NextResponse.json({discountPercent:data.discountPercent,parts:data.parts.filter(p=>p.enabled&&(p.productId===null||!isRetiredDemoProductId(p.productId))&&!/^Nowa część$/i.test(p.name.trim()))},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Rekomendacje chwilowo niedostępne'},{status:503})}}
