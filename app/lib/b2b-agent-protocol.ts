import {createHash,timingSafeEqual} from 'node:crypto';

const MIN_TOKEN_LENGTH=32;
export function agentAuthConfigured(secret:unknown):secret is string{
 return typeof secret==='string'&&secret.length>=MIN_TOKEN_LENGTH&&secret.length<=512;
}
/**
 * This route is intentionally outside /api/admin/ because a local
 * Playwright worker has no browser admin session.
 * Fail closed unless the owner configured a separate 32+ character secret.
 */
export function verifyB2BAgentBearer(header:string|null,secret:unknown):boolean{
 if(!agentAuthConfigured(secret)||!header||!/^Bearer [\x21-\x7e]{32,512}$/.test(header))return false;
 const token=header.slice(7);
 const actual=createHash('sha256').update(token).digest();
 const expected=createHash('sha256').update(secret).digest();
 return timingSafeEqual(actual,expected);
}
export type AgentPhase=
 'started'|'inspect_product'|'inspected'|'cart_add'|'cart_add_ack'|
 'inspect_cart'|'cart_verified'|'needs_review'|'completed_readonly'|'stopped';
export type AgentMode='inspect'|'cart-only';
export type AgentEventPayload={
 orderId:string;supplier:'fmic';jobId:string;fingerprint:string;
 runId:string;seq:number;mode:AgentMode;phase:AgentPhase;stepIndex:number|null;
};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const sha=/^[a-f0-9]{64}$/;
const phases:Record<AgentMode,readonly AgentPhase[]>={
 inspect:['started','inspect_product','inspected','completed_readonly','stopped'],
 'cart-only':['started','inspect_product','inspected','cart_add','cart_add_ack',
  'inspect_cart','cart_verified','needs_review','stopped'],
};
export class InvalidAgentEvent extends Error{}
export function validateAgentEvent(value:unknown):AgentEventPayload{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new InvalidAgentEvent('Niepoprawny raport agenta');
 const data=value as Record<string,unknown>;
 const keys=['orderId','supplier','jobId','fingerprint','runId','seq','mode','phase','stepIndex'];
 if(Object.keys(data).length!==keys.length||Object.keys(data).some(key=>!keys.includes(key)))
  throw new InvalidAgentEvent('Zabronione pola w raporcie agenta');
 if(typeof data.orderId!=='string'||!/^[1-9][0-9]{0,17}$/.test(data.orderId)||
  data.supplier!=='fmic'||typeof data.jobId!=='string'||!sha.test(data.jobId)||
  typeof data.fingerprint!=='string'||!sha.test(data.fingerprint)||
  typeof data.runId!=='string'||!uuid.test(data.runId)||
  !Number.isSafeInteger(data.seq)||Number(data.seq)<1||Number(data.seq)>300||
  (data.mode!=='inspect'&&data.mode!=='cart-only')||
  !phases[data.mode as AgentMode]?.includes(data.phase as AgentPhase)||
  !(data.stepIndex===null||(Number.isSafeInteger(data.stepIndex)&&Number(data.stepIndex)>=0&&Number(data.stepIndex)<30))){
  throw new InvalidAgentEvent('Niepoprawny identyfikator, etap lub typ raportu');
 }
 if((data.phase==='started'||data.phase==='stopped'||data.phase==='completed_readonly'||
     data.phase==='cart_verified'||data.phase==='needs_review')&&data.stepIndex!==null){
  throw new InvalidAgentEvent('Etap końcowy nie może zawierać indeksu pozycji');
 }
 if(data.phase==='started'&&data.seq!==1)throw new InvalidAgentEvent('Pierwszy etap musi mieć sekwencję 1');
 return data as AgentEventPayload;
}
export const TERMINAL_AGENT_PHASES:readonly AgentPhase[]=
 ['completed_readonly','cart_verified','needs_review','stopped'];
