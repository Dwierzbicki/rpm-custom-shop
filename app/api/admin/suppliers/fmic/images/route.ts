import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../../lib/db';
import {setupAuditWorker,seedAuditQueue,startAuditWorker,resetAuditCandidates} from '../../../../../lib/fmic-audit-worker';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){
 try{
 await setupAuditWorker();const db=getDbPool();
 const [stats,examples,control]=await Promise.all([db.query('SELECT status,count(*)::int AS total FROM rpm_fmic_image_audit GROUP BY status'),db.query("SELECT url,status,detail,checked_at FROM rpm_fmic_image_audit WHERE status IN ('blank','missing','review') ORDER BY checked_at DESC LIMIT 30"),db.query('SELECT enabled,heartbeat,last_error,processed,intensity,NOW() AS server_time FROM rpm_fmic_audit_control WHERE id=1')]);
 return NextResponse.json({stats:stats.rows,examples:examples.rows,control:control.rows[0]},{headers});
 }catch(e){console.error('Image audit read',e);return NextResponse.json({error:'Błąd odczytu audytu'},{status:500,headers})}
}
export async function POST(request:Request){
 try{
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403,headers});
 const {action,intensity}=await request.json();
 if(!['seed','start','pause','retry','intensity'].includes(action))return NextResponse.json({error:'Nieznana akcja'},{status:400,headers});
 await setupAuditWorker();const db=getDbPool();
 if(action==='intensity'){if(![1,2,4].includes(intensity))return NextResponse.json({error:'Nieprawidłowa intensywność'},{status:400,headers});await db.query('UPDATE rpm_fmic_audit_control SET intensity=$1 WHERE id=1',[intensity]);return NextResponse.json({ok:true},{headers})}
 if(action==='seed')return NextResponse.json({added:await seedAuditQueue()},{headers});
 if(action==='retry'){const result=await db.query("UPDATE rpm_fmic_image_audit SET status='pending' WHERE status='review'");resetAuditCandidates();return NextResponse.json({added:result.rowCount},{headers})}
 if(action==='start'){await seedAuditQueue();await db.query('UPDATE rpm_fmic_audit_control SET enabled=true,last_error=NULL WHERE id=1');startAuditWorker()}
 else await db.query('UPDATE rpm_fmic_audit_control SET enabled=false WHERE id=1');
 return NextResponse.json({ok:true},{headers});
 }catch(e){console.error('Image audit control',e);return NextResponse.json({error:'Błąd sterowania audytem'},{status:500,headers})}
}
