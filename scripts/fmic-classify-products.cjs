// Preview by default. Apply explicitly with --apply.
const ts=require('typescript'),fs=require('node:fs');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {getDbPool}=require('../app/lib/db.ts');
const {mapFmicProductCategory}=require('../app/lib/fmic-category-mapping.ts');
async function main(){
 const apply=process.argv.includes('--apply'),pool=getDbPool(),db=await pool.connect();
 try{
  await db.query('BEGIN');
  await db.query("SET LOCAL lock_timeout='10s'");
  await db.query("SET LOCAL statement_timeout='120s'");
  if(!(await db.query('SELECT pg_try_advisory_xact_lock(27391,1) AS acquired')).rows[0].acquired)throw Error('Another FMIC import/remap is running');
  const rows=(await db.query("SELECT sku,name,source_category FROM rpm_fmic_catalog WHERE mapping_status='unmapped' ORDER BY sku")).rows;
  const changes=rows.flatMap(row=>{const match=mapFmicProductCategory(row.source_category,row.name);return match.status==='normalized'?[{...row,target:match.targetPath}]:[]});
  const groups={};
  for(const row of changes){const k=row.target.join(' > ');const g=groups[k]??={count:0,samples:[]};g.count++;if(g.samples.length<5)g.samples.push({sku:row.sku,name:row.name})}
  console.log(JSON.stringify({mode:apply?'apply':'preview',products:changes.length,remaining:rows.length-changes.length,groups},null,2));
  if(apply){
   let updated=0;
   for(let i=0;i<changes.length;i+=500){
    const r=await db.query("UPDATE rpm_fmic_catalog c SET target_category=ARRAY(SELECT jsonb_array_elements_text(x->'target')),mapping_status='normalized',updated_at=now() FROM jsonb_array_elements($1::jsonb) x WHERE c.sku=x->>'sku' AND c.mapping_status='unmapped' AND c.name=x->>'name' AND c.source_category=x->>'source_category'",[JSON.stringify(changes.slice(i,i+500))]);
    updated+=r.rowCount;
   }
   if(updated!==changes.length)throw Error('Catalog changed during classification; retry preview');
   await db.query('COMMIT');console.log('FMIC classification committed: '+updated);
  }else await db.query('ROLLBACK');
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
 finally{db.release();await pool.end()}
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
