// Standalone opt-in process; never start alongside an embedded storefront worker.
const fs=require('node:fs');
const ts=require('typescript');
if(process.env.FMIC_WORKER_MODE!=='external'||!process.env.DATABASE_URL){
 console.error('Standalone worker requires FMIC_WORKER_MODE=external and DATABASE_URL');
 process.exit(1);
}
process.env.FMIC_WORKER_PROCESS='1';
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {getDbPool}=require('../app/lib/db.ts');
const {setupAuditWorker,startAuditWorker,stopAuditWorker}=require('../app/lib/fmic-audit-worker.ts');
const {setupDescriptionQueue,startDescriptionWorker,stopDescriptionWorker}=require('../app/lib/fmic-description-worker.ts');
let stopping=false;
async function shutdown(){
 if(stopping)return;
 stopping=true;
 const deadline=setTimeout(()=>process.exit(1),25000);
 try{await Promise.all([stopAuditWorker(),stopDescriptionWorker()]);await getDbPool().end();clearTimeout(deadline);process.exit(0)}
 catch(e){console.error('FMIC worker shutdown failed',e);process.exit(1)}
}
process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
(async()=>{
 await setupAuditWorker();
 if(process.env.FMIC_ENRICHMENT_ALLOWED==='1')await setupDescriptionQueue();
 if(stopping)return;
 startAuditWorker();
 startDescriptionWorker();
 console.info('FMIC standalone worker ready; supplier limits unchanged');
})().catch(e=>{console.error('FMIC worker startup failed',e);process.exit(1)});
