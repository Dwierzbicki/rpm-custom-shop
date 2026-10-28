import {NextResponse} from 'next/server';
import {getPaymentSettings,savePaymentSettings} from '../../../../lib/settings-db';
import {validPaymentSettings} from '../../../../lib/payment-settings';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({payments:await getPaymentSettings()},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Nie można pobrać ustawień płatności'},{status:503})}}
export async function PUT(request:Request){
 try{
  const origin=request.headers.get('origin'),host=request.headers.get('host');
  if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
  if(!(request.headers.get('content-type')??'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
  const value=(await request.json())?.payments;
  if(!validPaymentSettings(value))return NextResponse.json({error:'Uzupełnij dane przelewu lub wyłącz tę metodę'},{status:400});
  await savePaymentSettings(value);
  return NextResponse.json({payments:value});
 }catch{return NextResponse.json({error:'Nie udało się zapisać ustawień płatności'},{status:500})}
}
