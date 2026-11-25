import {NextResponse} from 'next/server';
import {getDbPool} from '../../../../../lib/db';
import {setupFmicCatalog} from '../../../../../lib/fmic-catalog-db';
import {FMIC_CATEGORY_TREE,type SupplierCategory} from '../../../../../fmic-categories';
export const runtime='nodejs';
export const dynamic='force-dynamic';
function paths(nodes:SupplierCategory[],parent:string[]=[]):string[][]{
 return nodes.flatMap(n=>{const path=[...parent,n.name];return [path,...paths(n.children,path)]});
}
export async function GET(){return NextResponse.json({paths:paths(FMIC_CATEGORY_TREE)})}
export async function PUT(request:Request){
 try{
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
 const {source,target}=await request.json();
 if(typeof source!=='string'||!source.trim()||source.length>2000||!Array.isArray(target)||!paths(FMIC_CATEGORY_TREE).some(p=>JSON.stringify(p)===JSON.stringify(target)))return NextResponse.json({error:'Wybierz prawidłową kategorię. Puste ścieżki wymagają przypisania indywidualnego.'},{status:400});
 if(['default category','produkty bez kategorii'].includes(source.trim().toLowerCase()))return NextResponse.json({error:'Ta grupa wymaga przypisania indywidualnego.'},{status:400});
 await setupFmicCatalog();
 const client=await getDbPool().connect();
 try{
 await client.query('BEGIN');
 const lock=await client.query('SELECT pg_try_advisory_xact_lock(27391,1) AS acquired');
 if(!lock.rows[0].acquired){await client.query('ROLLBACK');return NextResponse.json({error:'Trwa import lub zmiana cen.'},{status:409})}
 const updated=await client.query("UPDATE rpm_fmic_catalog SET target_category=$2::text[],mapping_status='manual' WHERE source_category=$1",[source,target]);
 if(!updated.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Nie znaleziono grupy'},{status:404})}
 await client.query('INSERT INTO rpm_fmic_category_overrides(source_category,target_category) VALUES($1,$2) ON CONFLICT(source_category) DO UPDATE SET target_category=EXCLUDED.target_category,updated_at=NOW()',[source,target]);
 await client.query('COMMIT');
 return NextResponse.json({updated:updated.rowCount});
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
 }catch(e){console.error('FMIC mapping update failed',e);return NextResponse.json({error:'Nie udało się zapisać mapowania'},{status:500})}
}
