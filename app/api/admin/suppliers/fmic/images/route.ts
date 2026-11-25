import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../../lib/db';
import {setupImageAudit,inspectImage} from '../../../../../lib/fmic-image-quality';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){
 try{
 await setupImageAudit();const db=getDbPool();
 const [stats,examples]=await Promise.all([db.query('SELECT status,count(*)::int AS total FROM rpm_fmic_image_audit GROUP BY status'),db.query("SELECT url,status,detail,checked_at FROM rpm_fmic_image_audit WHERE status IN ('blank','missing','review') ORDER BY checked_at DESC LIMIT 30")]);
 return NextResponse.json({stats:stats.rows,examples:examples.rows},{headers});
 }catch(e){console.error('Image audit read',e);return NextResponse.json({error:'Błąd odczytu audytu'},{status:500,headers})}
}
export async function POST(request:Request){
 try{
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403,headers});
 const {action}=await request.json();
 if(!['seed','batch','retry'].includes(action))return NextResponse.json({error:'Nieznana akcja'},{status:400,headers});
 await setupImageAudit();const client=await getDbPool().connect();let locked=false;
 try{
 const lock=await client.query('SELECT pg_try_advisory_lock(27391,2) AS acquired');locked=lock.rows[0].acquired;
 if(!locked)return NextResponse.json({error:'Audyt już trwa'},{status:409,headers});
 if(action==='seed'){
 const result=await client.query("INSERT INTO rpm_fmic_image_audit(url) SELECT DISTINCT image FROM rpm_fmic_catalog CROSS JOIN LATERAL jsonb_array_elements_text(data->'images') AS image ON CONFLICT DO NOTHING");
 return NextResponse.json({added:result.rowCount},{headers});
 }
 if(action==='retry'){const result=await client.query("UPDATE rpm_fmic_image_audit SET status='pending' WHERE status='review'");return NextResponse.json({added:result.rowCount},{headers})}
 const result=await client.query("SELECT url FROM rpm_fmic_image_audit WHERE status='pending' ORDER BY url LIMIT 12");
 let processed=0;
 for(let i=0;i<result.rows.length;i+=2){
 const pair=result.rows.slice(i,i+2);
 await Promise.all(pair.map(async ({url})=>{const outcome=await inspectImage(url);await client.query('UPDATE rpm_fmic_image_audit SET status=$2,hash=$3,detail=$4,checked_at=NOW() WHERE url=$1',[url,outcome.status,outcome.hash,outcome.detail]);processed++}));
 await new Promise(resolve=>setTimeout(resolve,500));
 }
 return NextResponse.json({processed},{headers});
 }finally{if(locked)await client.query('SELECT pg_advisory_unlock(27391,2)').catch(()=>{});client.release()}
 }catch(e){console.error('Image audit failed',e);return NextResponse.json({error:'Błąd audytu. Zapisane wyniki pozostają w bazie.'},{status:500,headers})}
}
