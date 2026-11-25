export async function register(){
 if(process.env.NEXT_RUNTIME==='nodejs'&&process.env.NODE_ENV==='production'&&process.env.DATABASE_URL&&process.env.NEXT_PHASE!=='phase-production-build'){
  try{const {importPrismManualDraft}=await import('./app/lib/catalog-db');await importPrismManualDraft();const {importPrismGallery}=await import('./app/lib/prism-gallery-import');void importPrismGallery().catch(e=>console.error('[catalog] PRISM gallery import failed',e instanceof Error?e.message:'unknown error'))}catch(e){console.error('[catalog] PRISM manual draft import failed',e)}
 }
 if(process.env.NEXT_RUNTIME==='nodejs'&&process.env.NODE_ENV==='production'&&process.env.DATABASE_URL&&process.env.FMIC_WORKER_MODE!=='external'){
 const {startAuditWorker}=await import('./app/lib/fmic-audit-worker');
 startAuditWorker();
 if(process.env.FMIC_ENRICHMENT_ALLOWED==="1"){const {startDescriptionWorker}=await import("./app/lib/fmic-description-worker");startDescriptionWorker()}
 }
}
