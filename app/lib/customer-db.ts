import {getDbPool} from './db';
let setup:Promise<void>|undefined;
async function ensure(){setup??=getDbPool().query(`CREATE TABLE IF NOT EXISTS rpm_customer_accounts (
 id BIGSERIAL PRIMARY KEY,
 provider TEXT NOT NULL,
 provider_id TEXT NOT NULL,
 email TEXT,
 display_name TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(provider,provider_id)
)`).then(()=>{});try{await setup}catch(e){setup=undefined;throw e}}
export async function upsertCustomer(profile:{provider:'google';providerId:string;email:string;name:string}){
 await ensure();
 const result=await getDbPool().query<{id:string;email:string|null;display_name:string|null}>(`INSERT INTO rpm_customer_accounts(provider,provider_id,email,display_name)
 VALUES ($1,$2,$3,$4) ON CONFLICT(provider,provider_id)
 DO UPDATE SET email=EXCLUDED.email,display_name=EXCLUDED.display_name
 RETURNING id,email,display_name`,[profile.provider,profile.providerId,profile.email,profile.name]);
 return result.rows[0];
}
export async function getCustomer(id:string){await ensure();const result=await getDbPool().query<{id:string;email:string|null;display_name:string|null}>('SELECT id,email,display_name FROM rpm_customer_accounts WHERE id=$1',[id]);return result.rows[0]||null}
