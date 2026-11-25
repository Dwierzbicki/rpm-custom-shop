/** Default stays embedded until a separate worker has been provisioned. */
type WorkerEnvironment=Record<string,string|undefined>;
export function canRunFmicWorker(env:WorkerEnvironment=process.env){
 return env.FMIC_WORKER_MODE==='external'?env.FMIC_WORKER_PROCESS==='1':env.FMIC_WORKER_PROCESS!=='1';
}
export function fmicWorkerPoolSize(env:WorkerEnvironment=process.env){
 return env.FMIC_WORKER_MODE==='external'&&env.FMIC_WORKER_PROCESS==='1'?4:10;
}
