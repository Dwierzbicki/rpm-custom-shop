import {Pool} from 'pg';
import {products,Product} from '../data';
export type CatalogItem=Product&{stockStatus:'available'|'order'|'unavailable';leadTime:string};
const defaults:CatalogItem[]=products.map(p=>({...p,stockStatus:p.configurable?'order':'available',leadTime:p.configurable?'Do potwierdzenia':''}));
const globalForDb=globalThis as unknown as {rpmPool?:Pool};
function pool(){if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL missing');return globalForDb.rpmPool??(globalForDb.rpmPool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='require'?{rejectUnauthorized:true}:undefined,max:5}));}
let setup:Promise<void>|undefined;
async function ensure(){setup??=(async()=>{await pool().query('CREATE TABLE IF NOT EXISTS rpm_catalog (id INTEGER PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())')})();try{await setup}catch(e){setup=undefined;throw e}}
export async function getCatalog():Promise<CatalogItem[]>{await ensure();const result=await pool().query<{id:number;data:Partial<CatalogItem>}>('SELECT id,data FROM rpm_catalog');const byId=new Map(result.rows.map(r=>[r.id,r.data]));return defaults.map(p=>({...p,...byId.get(p.id),id:p.id,sku:p.sku}));}
export async function saveCatalog(item:CatalogItem){await ensure();await pool().query('INSERT INTO rpm_catalog (id,data,updated_at) VALUES ($1,$2::jsonb,NOW()) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data, updated_at=NOW()',[item.id,JSON.stringify(item)]);}
