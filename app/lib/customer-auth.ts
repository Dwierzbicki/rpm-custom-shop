import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
const SECRET=()=>process.env.CUSTOMER_SESSION_SECRET||process.env.ADMIN_SESSION_SECRET||'';
export const CUSTOMER_COOKIE='rpm_customer_session';
export const OAUTH_COOKIE='rpm_google_oauth';
export function encodeSigned(payload:string){const secret=SECRET();if(secret.length<32)throw Error('Session secret missing');const sig=createHmac('sha256',secret).update(payload).digest('hex');return Buffer.from(payload).toString('base64url')+'.'+sig}
export function decodeSigned(value:string|undefined){if(!value)return null;const [body,sig]=value.split('.');if(!body||!sig||!/^[a-f0-9]{64}$/.test(sig))return null;try{const payload=Buffer.from(body,'base64url').toString('utf8');const expected=createHmac('sha256',SECRET()).update(payload).digest('hex');if(!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;return payload}catch{return null}}
export function newNonce(){return randomBytes(32).toString('base64url')}
export function customerFromCookie(value:string|undefined){const raw=decodeSigned(value);if(!raw)return null;try{const data=JSON.parse(raw) as {id:string;exp:number};if(typeof data.id!=='string'||!Number.isSafeInteger(data.exp)||data.exp<Date.now())return null;return {id:data.id}}catch{return null}}
