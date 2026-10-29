import {Pool} from 'pg';
import {DEFAULT_PRICING_RULES,PricingRules,validPricingRules} from './supplier-pricing';
const g=globalThis as unknown as {rpmPricingPool?:Pool};
function db(){if(!process.env.DATABASE_URL)throw Error('DATABASE_URL missing');return g.rpmPricingPool??(g.rpmPricingPool=new Pool({connectionString:process.env.DATABASE_URL,max:2}));}
async function ensure(){await db().query('CREATE TABLE IF NOT EXISTS rpm_shop_settings (key TEXT PRIMARY KEY,data JSONB NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');}
export async function getPricingRules():Promise<PricingRules>{await ensure();const r=await db().query<{data:unknown}>("SELECT data FROM rpm_shop_settings WHERE key='supplier_pricing'");return validPricingRules(r.rows[0]?.data)?r.rows[0].data as PricingRules:DEFAULT_PRICING_RULES;}
export async function savePricingRules(v:PricingRules){if(!validPricingRules(v))throw Error('Invalid pricing rules');await ensure();await db().query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES('supplier_pricing',$1::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()",[JSON.stringify(v)]);}
