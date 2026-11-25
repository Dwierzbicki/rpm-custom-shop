// Default: preview only. Apply only with --apply; existing manual mappings are untouched.
const ts=require('typescript'),fs=require('node:fs');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {getDbPool}=require('../app/lib/db.ts');
const {mapFmicCategory}=require('../app/lib/fmic-category-mapping.ts');
async function main(){
 const apply=process.argv.includes('--apply'),pool=getDbPool(),db=await pool.connect();
 try{
  await db.query('BEGIN');
  await db.query("SET LOCAL lock_timeout='10s'");
  await db.query("SET LOCAL statement_timeout='120s'");
  if(!(await db.query('SELECT pg_try_advisory_xact_lock(27391,1) AS acquired')).rows[0].acquired)throw Error('Another FMIC import/remap is running');
  const groups=(await db.query("SELECT source_category,count(*)::int AS products FROM rpm_fmic_catalog WHERE mapping_status='parent_review' GROUP BY source_category ORDER BY source_category")).rows;
  const changes=groups.map(row=>({...row,match:mapFmicCategory(row.source_category)})).filter(row=>['exact','normalized'].includes(row.match.status));
  console.log(JSON.stringify({mode:apply?'apply':'preview',groups:changes.length,products:changes.reduce((n,r)=>n+r.products,0),remaining:groups.reduce((n,r)=>n+r.products,0)-changes.reduce((n,r)=>n+r.products,0),changes:changes.map(r=>({source:r.source_category,target:r.match.targetPath,count:r.products}))},null,2));
  if(apply){
   let updated=0;
   for(const row of changes){
    const result=await db.query("UPDATE rpm_fmic_catalog SET target_category=$2::text[],mapping_status=$3,updated_at=now() WHERE source_category=$1 AND mapping_status='parent_review'",[row.source_category,row.match.targetPath,row.match.status]);
    updated+=result.rowCount;
   }
   await db.query('COMMIT');
   console.log('FMIC remap committed: '+updated);
  }else await db.query('ROLLBACK');
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
 finally{db.release();await pool.end()}
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
