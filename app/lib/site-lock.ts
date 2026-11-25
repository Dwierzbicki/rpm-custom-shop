export function isRoadAssistance(path:string){return path==='/autopomoc'||path.startsWith('/autopomoc/')}
export function isAdminPath(path:string){return path==='/admin'||path.startsWith('/admin/')||path==='/api/admin'||path.startsWith('/api/admin/')}
export function readBasic(header:string|null):string|null{
 if(!header||header.length>4096||!/^Basic\s+[A-Za-z0-9+/]+={0,2}$/i.test(header))return null;
 try{const raw=atob(header.trim().split(/\s+/)[1]);return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0)))}catch{return null}
}
export async function authorizedBasic(header:string|null,username:string,password:string){
 const actual=readBasic(header);if(actual===null)return false;
 const encoder=new TextEncoder();
 const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(actual)),crypto.subtle.digest('SHA-256',encoder.encode(username+':'+password))]);
 const x=new Uint8Array(a),y=new Uint8Array(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0
}
