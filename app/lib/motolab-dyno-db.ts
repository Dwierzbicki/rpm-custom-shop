import {getDbPool} from './db';
import {validDynoBuild,type DynoBuild} from './motolab-dyno';
export async function listDynoBuilds(publicOnly=false,version?:string){
 const r=await getDbPool().query("SELECT data FROM rpm_shop_settings WHERE key LIKE 'motolab_dyno:%' "+(publicOnly?"AND data->>'published'='true' AND data->>'version'=$1 ":"")+"ORDER BY updated_at DESC LIMIT 100",publicOnly?[version]:[]);
 return r.rows.map(r=>r.data).filter(validDynoBuild).filter((b:DynoBuild)=>!publicOnly||b.published&&b.attested);
}
export async function saveDynoBuild(b:DynoBuild){
 if(!validDynoBuild(b))throw Error('Invalid setup');
 const db=getDbPool();
 const skus=[...new Set(b.parts.map(p=>p.sku).filter(Boolean))];
 const rows=skus.length?(await db.query('SELECT sku,name FROM rpm_fmic_catalog WHERE sku=ANY($1::text[])',[skus])).rows:[];
 const parts=b.parts.map(p=>{if(!p.sku)return p;const r=rows.find(r=>r.sku===p.sku);if(!r||r.name!==p.name)throw Error('SKU lub nazwa niezgodne: '+p.sku);return {...p,name:r.name}});
 const value={...b,parts};
 await db.query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES($1,$2::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()",['motolab_dyno:'+b.id,JSON.stringify(value)]);
 return value;
}
