import {NextResponse} from 'next/server';
import {getAppearanceSettings,saveAppearanceSettings} from '../../../../lib/appearance-settings-db';
import {validAppearanceSettings} from '../../../../lib/appearance-settings';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 try{return NextResponse.json({appearance:await getAppearanceSettings()},{headers:{'Cache-Control':'no-store'}})}
 catch{return NextResponse.json({error:'Nie można pobrać ustawień wyglądu'},{status:503})}
}
export async function PUT(request:Request){
 try{
  const origin=request.headers.get('origin'),host=request.headers.get('host');
  if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
  if(!(request.headers.get('content-type')??'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
  const value=(await request.json())?.appearance;
  if(!validAppearanceSettings(value))return NextResponse.json({error:'Nieprawidłowe ustawienia wyglądu'},{status:400});
  const appearance={logoLaserEnabled:value.logoLaserEnabled};
  await saveAppearanceSettings(appearance);
  return NextResponse.json({appearance},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Nie udało się zapisać ustawień wyglądu'},{status:500})}
}
