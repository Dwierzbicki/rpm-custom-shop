/** Default stays embedded until a separate worker has been provisioned. */
type WorkerEnvironment=Record<string,string|undefined>;
export function canRunFmicWorker(env:WorkerEnvironment=process.env){
 return env.FMIC_WORKER_MODE==='external'?env.FMIC_WORKER_PROCESS==='1':env.FMIC_WORKER_PROCESS!=='1';
}
export function fmicWorkerPoolSize(env:WorkerEnvironment=process.env){
 return env.FMIC_WORKER_MODE==='external'&&env.FMIC_WORKER_PROCESS==='1'?4:10;
}

/** Reserve at least half of the detected container memory for the web app/other work.
 * On the current 2 GiB plan the worker RSS ceiling is 768 MiB; unknown limit keeps old 320 MiB ceiling. */
export function fmicWorkerMemoryBudget(limit=process.constrainedMemory?.()??0){
 const MiB=1024*1024;
 return Number.isFinite(limit)&&limit>0?Math.min(768*MiB,Math.floor(limit/2)):320*MiB;
}
