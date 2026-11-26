import {NextResponse} from 'next/server';
import {importFmicRemote} from '../../../../../lib/fmic-remote-import';
import {syncVariantsAfterImport} from '../../../../../lib/variant-db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 try{const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403})}
 catch{return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403})}
 const encoder=new TextEncoder();
 let disconnected=false;
 const stream=new ReadableStream<Uint8Array>({
 start(controller){
 const send=(event:object)=>{if(!disconnected){try{controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'))}catch{disconnected=true}}};
 send({type:'progress',phase:'download',count:0,bytes:0,percent:null});
 void importFmicRemote(p=>send({type:'progress',...p})).then(async result=>{send({type:'variants'});const variantSync=await syncVariantsAfterImport();send({type:'done',...result,variantSync})}).catch(e=>{console.error('FMIC import failed',e);send({type:'error',error:'Import nie powiódł się. Sprawdź logi serwera.'})}).finally(()=>{if(!disconnected)controller.close()});
 },
 cancel(){disconnected=true}
 });
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store, no-transform','X-Accel-Buffering':'no'}});
}
