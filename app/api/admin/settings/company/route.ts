import {NextResponse} from 'next/server';
import {getCompanySettings,saveCompanySettings} from '../../../../lib/settings-db';
import {validCompanySettings} from '../../../../lib/company-settings';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({company:await getCompanySettings()},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Nie udało się pobrać danych firmy'},{status:503})}}
export async function PUT(request:Request){
 try{
  const origin=request.headers.get('origin'),host=request.headers.get('host');
  if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
  if(!(request.headers.get('content-type')??'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
  const value=(await request.json())?.company;
  if(!validCompanySettings(value))return NextResponse.json({error:'Sprawdź NIP, e-mail i długość pól'},{status:400});
  await saveCompanySettings(value);
  return NextResponse.json({company:value});
 }catch{return NextResponse.json({error:'Nie udało się zapisać danych firmy'},{status:500})}
}
