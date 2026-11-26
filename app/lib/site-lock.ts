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

export const SITE_COOKIE='rpm_site_session';
export async function signSiteSession(expires:string,secret:string,user:string,password:string){
 const encoder=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=await crypto.subtle.sign('HMAC',key,encoder.encode(JSON.stringify(['rpm-site-v1',expires,user,password])));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function verifySiteSession(token:string,secret:string,user:string,password:string){
 const parts=token.split('.');
 if(parts.length!==2||!/^\d{13}$/.test(parts[0])||! /^[a-f0-9]{64}$/.test(parts[1]))return false;
 const now=Date.now(),expires=Number(parts[0]);if(expires<=now||expires>now+86400000)return false;
 const expected=await signSiteSession(parts[0],secret,user,password);let diff=0;
 for(let i=0;i<64;i++)diff|=expected.charCodeAt(i)^parts[1].charCodeAt(i);
 return diff===0;
}
export function safeReturnPath(value:string|null){
 if(!value||!value.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u001f\u007f]/.test(value))return '/';
 try{const url=new URL(value,'https://local.invalid');if(url.origin!=='https://local.invalid'||url.pathname==='/site-access')return '/';return url.pathname+url.search}catch{return '/'}
}

// Only this non-sensitive branded artwork is public during the closed test phase.
export function isPublicSocialArtwork(path:string,method:string){return path==='/optimized/social-card.jpg'&&(method==='GET'||method==='HEAD')}
