export async function register(){
 if(process.env.NEXT_RUNTIME==='nodejs'&&process.env.NODE_ENV==='production'&&process.env.DATABASE_URL&&process.env.FMIC_WORKER_MODE!=='external'){
 const {startAuditWorker}=await import('./app/lib/fmic-audit-worker');
 startAuditWorker();
 if(process.env.FMIC_ENRICHMENT_ALLOWED==="1"){const {startDescriptionWorker}=await import("./app/lib/fmic-description-worker");startDescriptionWorker()}
 }
}
