import {getDbPool} from './db';
let setup:Promise<unknown>|undefined;
export async function ensureFmicRequests(){
 setup??=getDbPool().query(`CREATE TABLE IF NOT EXISTS rpm_fmic_quote_requests(
 id BIGSERIAL PRIMARY KEY, request_key UUID UNIQUE NOT NULL, request_hash TEXT NOT NULL,
 customer JSONB NOT NULL, items JSONB NOT NULL, estimated_subtotal NUMERIC(14,2) NOT NULL,
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','closed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`).catch(e=>{setup=undefined;throw e});
 await setup;
}
