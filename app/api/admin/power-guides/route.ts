import {NextResponse} from 'next/server';
import {getGuideSettings,saveGuideSettings,saveGuideSettingsIfCurrent} from '../../../lib/power-guides-db';
import {validGuideSettings} from '../../../lib/power-guides';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json(await getGuideSettings(),{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Nie można pobrać ustawień Power Guides'},{status:503})}}
export async function PUT(request:Request){try{
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
 if(!(request.headers.get('content-type')||'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
 const data=await request.json();
 if(data&&typeof data==='object'&&'expected' in data&&'settings' in data){if(!validGuideSettings(data.expected)||!validGuideSettings(data.settings))return NextResponse.json({error:'Niepoprawne dane rekomendacji'},{status:400});if(!await saveGuideSettingsIfCurrent(data.settings,data.expected))return NextResponse.json({error:'Dane zmieniły się w innej sesji. Wróć do listy i odśwież przed ponowną edycją.'},{status:409});return NextResponse.json(data.settings);}
 if(!validGuideSettings(data))return NextResponse.json({error:'Niepoprawne dane. Sprawdź ceny, linki FMIC i pola.'},{status:400});
 await saveGuideSettings(data);return NextResponse.json(data);
 }catch{return NextResponse.json({error:'Nie udało się zapisać Power Guides'},{status:500})}}
