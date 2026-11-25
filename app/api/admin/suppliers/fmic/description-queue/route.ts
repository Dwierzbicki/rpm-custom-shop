import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../../lib/db';
import {setupDescriptionQueue,seedDescriptionQueue,startDescriptionWorker,assignDraft} from '../../../../../lib/fmic-description-worker';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){
 try{await setupDescriptionQueue();const db=getDbPool();const [stats,control,examples]=await Promise.all([db.query('SELECT status,count(*)::int AS total FROM rpm_fmic_description_queue GROUP BY status'),db.query('SELECT *,NOW() AS server_time FROM rpm_fmic_description_control WHERE id=1'),db.query("SELECT sku,status,detail FROM rpm_fmic_description_queue WHERE status='review' ORDER BY updated_at DESC LIMIT 30")]);return NextResponse.json({allowed:process.env.FMIC_ENRICHMENT_ALLOWED==='1',stats:stats.rows,control:control.rows[0],examples:examples.rows},{headers})}catch(e){console.error(e);return NextResponse.json({error:'Błąd kolejki opisów'},{status:500,headers})}
}
export async function POST(request:Request){
 try{
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403,headers});
 const {action,sku}=await request.json();await setupDescriptionQueue();const db=getDbPool();
 if(action==='assign'){if(typeof sku!=='string'||!sku.trim()||sku.length>120)return NextResponse.json({error:'Nieprawidłowe SKU'},{status:400,headers});const assigned=await assignDraft(sku);return NextResponse.json({assigned},{headers})}
 if(action==='start'){if(process.env.FMIC_ENRICHMENT_ALLOWED!=='1')return NextResponse.json({error:'Wymagane potwierdzenie zasad FMIC i konfiguracja FMIC_ENRICHMENT_ALLOWED=1'},{status:403,headers});await seedDescriptionQueue();await db.query('UPDATE rpm_fmic_description_control SET enabled=true,last_error=NULL WHERE id=1');startDescriptionWorker()}
 else if(action==='pause')await db.query('UPDATE rpm_fmic_description_control SET enabled=false WHERE id=1');
 else if(action==='seed')await seedDescriptionQueue();
 else if(action==='retry')await db.query("UPDATE rpm_fmic_description_queue SET status='pending',detail=NULL WHERE status='review'");
 else return NextResponse.json({error:'Nieznana akcja'},{status:400,headers});
 return NextResponse.json({ok:true},{headers});
 }catch(e){console.error(e);return NextResponse.json({error:'Błąd sterowania kolejką'},{status:500,headers})}
}
