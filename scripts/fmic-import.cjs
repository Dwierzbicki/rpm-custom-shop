// Run from the repository root: node scripts/fmic-import.cjs /path/to/feed.xml
// Requires Python 3, npm dependencies and DATABASE_URL in the environment.
const ts=require('typescript');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const readline=require('node:readline');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {getDbPool}=require('../app/lib/db.ts');
const {setupFmicCatalog,stageFmicBatch}=require('../app/lib/fmic-catalog-db.ts');
async function main(){
 const file=process.argv[2],discount=process.argv[3]??'5';
 if(!file||!fs.statSync(file).isFile())throw new Error('Provide local XML or ZIP file');
 const pool=getDbPool();
 let client,child;
 try{
  await setupFmicCatalog();
  client=await pool.connect();
  await client.query('BEGIN');
  const lock=await client.query("SELECT pg_try_advisory_xact_lock(27391,1) AS acquired");
  if(!lock.rows[0].acquired)throw new Error('Another FMIC import is running');
  child=spawn(process.env.PYTHON_BIN||'python3',['scripts/fmic-feed-inspect.py',file,'--jsonl','--discount',discount],{stdio:['ignore','pipe','inherit']});
  const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});
  done.catch(()=>{});
  const lines=readline.createInterface({input:child.stdout,crlfDelay:Infinity});
  let batch=[],count=0;
  for await(const line of lines){
   batch.push(JSON.parse(line));
   if(batch.length===1000){count+=await stageFmicBatch(batch,client);batch=[];}
  }
  if(batch.length)count+=await stageFmicBatch(batch,client);
  const code=await done;
  if(code!==0||!count)throw new Error('Feed validation failed; no product changes committed (exit '+code+')');
  await client.query('COMMIT');
  console.log(JSON.stringify({imported:count,published:0,discount}));
 }catch(error){
  if(child&&!child.killed)child.kill();
  if(client)await client.query('ROLLBACK').catch(()=>{});
  throw error;
 }finally{if(client)client.release();await pool.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
