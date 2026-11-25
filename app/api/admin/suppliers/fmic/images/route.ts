import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../../lib/db';
import {setupAuditWorker,seedAuditQueue,startAuditWorker,resetAuditCandidates} from '../../../../../lib/fmic-audit-worker';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 try{
 const db=getDbPool();
 const sku=new URL(request.url).searchParams.get('sku')?.trim();
 if(sku){
  if(sku.length>120)return NextResponse.json({error:'Niepoprawny SKU'},{status:400,headers});
  const product=(await db.query('SELECT sku,name FROM rpm_fmic_catalog WHERE sku=$1',[sku])).rows[0];
  if(!product)return NextResponse.json({error:'Nie znaleziono produktu'},{status:404,headers});
  const rows=(await db.query("SELECT img.url,img.pos,COALESCE(a.status,'pending') AS status,a.detail FROM rpm_fmic_catalog c CROSS JOIN LATERAL jsonb_array_elements_text(c.data->'images') WITH ORDINALITY img(url,pos) LEFT JOIN rpm_fmic_image_audit a ON a.url=img.url WHERE c.sku=$1 ORDER BY img.pos LIMIT 50",[sku])).rows;
  return NextResponse.json({product,images:rows},{headers});
 }
 const [stats,examples,control]=await Promise.all([db.query('SELECT status,count(*)::int AS total FROM rpm_fmic_image_audit GROUP BY status'),db.query("SELECT url,status,detail,checked_at FROM rpm_fmic_image_audit WHERE status IN ('blank','missing','review','watermarked') ORDER BY checked_at DESC LIMIT 30"),db.query('SELECT enabled,heartbeat,last_error,processed,intensity,NOW() AS server_time FROM rpm_fmic_audit_control WHERE id=1')]);
 return NextResponse.json({stats:stats.rows,examples:examples.rows,control:control.rows[0]},{headers});
 }catch(e){console.error('Image audit read',e);return NextResponse.json({error:'Błąd odczytu audytu'},{status:500,headers})}
}
export async function POST(request:Request){
 try{
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403,headers});
 const {action,intensity,sku,url,status}=await request.json();
 if(!['seed','start','pause','retry','intensity','classify'].includes(action))return NextResponse.json({error:'Nieznana akcja'},{status:400,headers});
 const db=getDbPool();
 if(action==='classify'){
  if(typeof sku!=='string'||!sku||sku.length>120||typeof url!=='string'||url.length>2000||!['watermarked','ok','pending'].includes(status))return NextResponse.json({error:'Niepoprawne dane zdjęcia'},{status:400,headers});
  let parsed:URL;try{parsed=new URL(url)}catch{return NextResponse.json({error:'Niepoprawny adres zdjęcia'},{status:400,headers})}
  if(parsed.origin!=='https://fmic.pl'||parsed.username||parsed.password)return NextResponse.json({error:'Nieobsługiwany host'},{status:400,headers});
  const result=await db.query(`INSERT INTO rpm_fmic_image_audit(url,status,detail,checked_at)
   SELECT $2,$3,$4,NOW() FROM rpm_fmic_catalog WHERE sku=$1 AND data->'images' ? $2
   ON CONFLICT(url) DO UPDATE SET status=EXCLUDED.status,detail=EXCLUDED.detail,checked_at=NOW()
   WHERE rpm_fmic_image_audit.status NOT IN ('blank','missing') OR EXCLUDED.status='pending' RETURNING url`,[sku,url,status,status==='watermarked'?'Ręcznie potwierdzony znak wodny':status==='ok'?'Ręcznie sprawdzone zdjęcie':null]);
  if(!result.rowCount)return NextResponse.json({error:'Brak zdjęcia lub wymagane ponowne sprawdzenie pliku'},{status:409,headers});
  resetAuditCandidates();
  return NextResponse.json({ok:true},{headers});
 }
 await setupAuditWorker();
 if(action==='intensity'){if(![1,2,4].includes(intensity))return NextResponse.json({error:'Nieprawidłowa intensywność'},{status:400,headers});await db.query('UPDATE rpm_fmic_audit_control SET intensity=$1 WHERE id=1',[intensity]);return NextResponse.json({ok:true},{headers})}
 if(action==='seed')return NextResponse.json({added:await seedAuditQueue()},{headers});
 if(action==='retry'){const result=await db.query("UPDATE rpm_fmic_image_audit SET status='pending' WHERE status='review'");resetAuditCandidates();return NextResponse.json({added:result.rowCount},{headers})}
 if(action==='start'){await seedAuditQueue();await db.query('UPDATE rpm_fmic_audit_control SET enabled=true,last_error=NULL WHERE id=1');startAuditWorker()}
 else await db.query('UPDATE rpm_fmic_audit_control SET enabled=false WHERE id=1');
 return NextResponse.json({ok:true},{headers});
 }catch(e){console.error('Image audit control',e);return NextResponse.json({error:'Błąd sterowania audytem'},{status:500,headers})}
}
