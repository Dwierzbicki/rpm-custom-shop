import type {AuditState,AuditIssue} from './link-audit';
const name='rpm-link-audit-v1';
function openDb():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{const req=indexedDB.open(name,1);
 req.onupgradeneeded=()=>{req.result.createObjectStore('state');req.result.createObjectStore('issues',{keyPath:'id'})};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
}
async function read<T>(store:string,action:(s:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 const db=await openDb();try{return await new Promise<T>((resolve,reject)=>{const req=action(db.transaction(store,'readonly').objectStore(store));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}finally{db.close()}
}
export const readAudit=()=>read<AuditState|undefined>('state',s=>s.get('current'));
export const readAuditIssues=(limit?:number)=>read<AuditIssue[]>('issues',s=>s.getAll(undefined,limit));
export async function saveAudit(state:AuditState,issue?:AuditIssue,reset=false){
 const db=await openDb();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['state','issues'],'readwrite');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 const issues=tx.objectStore('issues');if(reset)issues.clear();if(issue)issues.put(issue);tx.objectStore('state').put(state,'current');
 })}finally{db.close()}
}
