import {NextResponse} from 'next/server';
import {importFmicRemote} from '../../../../../lib/fmic-remote-import';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin'),host=request.headers.get('host');
  if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
  return NextResponse.json(await importFmicRemote());
 }catch(e){console.error('FMIC import failed',e);return NextResponse.json({error:'Import nie powiódł się. Sprawdź logi serwera; transakcja błędnego importu jest wycofywana.'},{status:500})}
}
