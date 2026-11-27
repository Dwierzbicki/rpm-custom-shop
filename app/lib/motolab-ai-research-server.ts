import {getDbPool} from './db';
import {providerRequest,parseProvider,type AiRequest} from './motolab-ai-research';
const limit=(v:string|undefined,max:number)=>v&&/^\d+$/.test(v)&&Number(v)>0&&Number(v)<=max?Number(v):0;
export function aiConfig(){
 const daily=limit(process.env.RPM_RESEARCH_DAILY_LIMIT,5),monthly=limit(process.env.RPM_RESEARCH_MONTHLY_LIMIT,50),model=process.env.RPM_RESEARCH_MODEL?.trim()||'gpt-5-mini';
 return {daily,monthly,model,enabled:process.env.RPM_RESEARCH_AI_ENABLED==='1'&&!!process.env.OPENAI_API_KEY?.trim()&&!!daily&&!!monthly&&daily<=monthly&&/^[a-zA-Z0-9._-]{1,100}$/.test(model)};
}
const keys=()=>{const d=new Date().toISOString().slice(0,10);return ['motolab_ai_research_count:day:'+d,'motolab_ai_research_count:month:'+d.slice(0,7)]};
function count(data:unknown){if(data===undefined)return 0;const n=(data as {count?:unknown})?.count;if(typeof n!=='number'||!Number.isSafeInteger(n)||n<0)throw Error('Invalid quota');return n}
export async function aiQuota(){
 const c=aiConfig();if(!c.enabled)return {...c,usedToday:0,usedMonth:0};
 const [day,month]=keys(),r=await getDbPool().query<{key:string;data:unknown}>('SELECT key,data FROM rpm_shop_settings WHERE key=ANY($1::text[])',[[day,month]]);
 return {...c,usedToday:count(r.rows.find(x=>x.key===day)?.data),usedMonth:count(r.rows.find(x=>x.key===month)?.data)};
}
export class AiUnavailable extends Error{}
export class AiQuotaExceeded extends Error{}
async function reserve(){
 const c=aiConfig();if(!c.enabled)throw new AiUnavailable('AI wyłączone. Skonfiguruj klucz i oba limity.');
 const client=await getDbPool().connect(),[day,month]=keys();
 try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(27391,14)');
 const r=await client.query<{key:string;data:unknown}>('SELECT key,data FROM rpm_shop_settings WHERE key=ANY($1::text[])',[[day,month]]);
 const a=count(r.rows.find(x=>x.key===day)?.data),b=count(r.rows.find(x=>x.key===month)?.data);
 if(a>=c.daily||b>=c.monthly)throw new AiQuotaExceeded('Wyczerpano limit researchu (UTC).');
 for(const [key,n] of [[day,a+1],[month,b+1]] as const)await client.query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES($1,$2::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()",[key,JSON.stringify({count:n})]);
 await client.query('COMMIT');return c;
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
export async function runAi(r:AiRequest){
 const c=await reserve();
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(providerRequest(r,c.model)),cache:'no-store',signal:AbortSignal.timeout(75000)});
 if(!response.ok)throw new AiUnavailable('API zwróciło HTTP '+response.status+'. Próba zużywa limit.');
 const result=parseProvider(await response.json(),r);
 return {...result,quota:await aiQuota()};
}
