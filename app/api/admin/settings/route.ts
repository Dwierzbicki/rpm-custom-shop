import {NextResponse} from 'next/server';
import {getShippingSettings,saveShippingSettings} from '../../../lib/settings-db';
import {validShippingSettings} from '../../../lib/shipping';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({shipping:await getShippingSettings()},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Nie można pobrać ustawień'},{status:503})}}
export async function PUT(request:Request){
 try{
  const origin=request.headers.get('origin'),host=request.headers.get('host');
  if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
  if(!(request.headers.get('content-type')??'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
  const value=(await request.json())?.shipping;
  if(!validShippingSettings(value))return NextResponse.json({error:'Sprawdź kwoty i aktywne sposoby dostawy'},{status:400});
  await saveShippingSettings(value);
  return NextResponse.json({shipping:value});
 }catch{return NextResponse.json({error:'Nie udało się zapisać ustawień'},{status:500})}
}
