import {Pool} from 'pg';
import type {SupplierOffer} from './supplier-matching';
const g=globalThis as unknown as {rpmSupplierPool?:Pool};
function db(){if(!process.env.DATABASE_URL)throw Error('DATABASE_URL missing');return g.rpmSupplierPool??(g.rpmSupplierPool=new Pool({connectionString:process.env.DATABASE_URL,max:3}));}
async function setup(){await db().query('CREATE TABLE IF NOT EXISTS rpm_supplier_offers (id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, supplier TEXT NOT NULL, supplier_sku TEXT NOT NULL, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(supplier,supplier_sku))');}
export async function getOffers():Promise<SupplierOffer[]>{await setup();const r=await db().query<{id:number;data:Omit<SupplierOffer,'id'>}>('SELECT id,data FROM rpm_supplier_offers ORDER BY id DESC LIMIT 1000');return r.rows.map(x=>({...x.data,id:x.id}));}
export async function saveOffer(value:Omit<SupplierOffer,'id'>){await setup();const r=await db().query<{id:number}>('INSERT INTO rpm_supplier_offers(supplier,supplier_sku,data) VALUES($1,$2,$3::jsonb) ON CONFLICT(supplier,supplier_sku) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW() RETURNING id',[value.supplier,value.supplierSku,JSON.stringify(value)]);return r.rows[0].id;}
export async function removeOffer(id:number){await setup();await db().query('DELETE FROM rpm_supplier_offers WHERE id=$1',[id]);}
