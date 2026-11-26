import {NextResponse} from 'next/server';
import {getAppearanceSettings} from '../../../lib/appearance-settings-db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 try{return NextResponse.json({appearance:await getAppearanceSettings()},{headers:{'Cache-Control':'no-store'}})}
 catch{return NextResponse.json({error:'Nie można pobrać ustawień wyglądu'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
