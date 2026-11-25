import {getDbPool} from './db';
import {mapFmicCategory} from './fmic-category-mapping';

export type FmicRow={sku:string;name:string;source_price:string;proposed_gross:string;availability:'in stock'|'out of stock';category_path:string;currency:'PLN';price_kind:'unknown';images:string[]};

export async function setupFmicCatalog(){
 await getDbPool().query(`CREATE TABLE IF NOT EXISTS rpm_fmic_catalog (
 sku TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 source_price NUMERIC(12,2) NOT NULL CHECK(source_price>0),
 proposed_gross NUMERIC(12,2) NOT NULL CHECK(proposed_gross>0),
 available BOOLEAN NOT NULL,
 source_category TEXT NOT NULL,
 target_category TEXT[],
 mapping_status TEXT NOT NULL,
 data JSONB NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 CREATE TABLE IF NOT EXISTS rpm_fmic_settings (
 id INTEGER PRIMARY KEY CHECK(id=1),
 discount NUMERIC(5,2) NOT NULL CHECK(discount>=0 AND discount<100)
 );
 INSERT INTO rpm_fmic_settings(id,discount) VALUES(1,5) ON CONFLICT DO NOTHING;
 CREATE INDEX IF NOT EXISTS rpm_fmic_catalog_category_idx ON rpm_fmic_catalog(source_category);
 CREATE INDEX IF NOT EXISTS rpm_fmic_catalog_mapping_idx ON rpm_fmic_catalog(mapping_status);`);
}

/** Internal import only; does not alter public catalog or infer purchase prices. */
export async function stageFmicBatch(rows:FmicRow[], db:Pick<ReturnType<typeof getDbPool>,'query'>=getDbPool()){
 if(!rows.length)return 0;
 if(rows.length>1000)throw new Error('Maximum batch size 1000');
 const payload=rows.map(row=>{
  if(!row.sku||!row.name||row.currency!=='PLN'||row.price_kind!=='unknown'||!['in stock','out of stock'].includes(row.availability)||!/^\d+\.\d{2}$/.test(row.source_price)||!/^\d+\.00$/.test(row.proposed_gross))throw new Error('Invalid FMIC row');
  const match=mapFmicCategory(row.category_path);
  return {...row,target_category:match.targetPath,mapping_status:match.status};
 });
 const result=await db.query(`INSERT INTO rpm_fmic_catalog(sku,name,source_price,proposed_gross,available,source_category,target_category,mapping_status,data)
 SELECT x->>'sku',x->>'name',(x->>'source_price')::numeric,ceil((x->>'source_price')::numeric*(100-(SELECT discount FROM rpm_fmic_settings WHERE id=1))/100),x->>'availability'='in stock',x->>'category_path',ARRAY(SELECT jsonb_array_elements_text(x->'target_category')),x->>'mapping_status',x
 FROM jsonb_array_elements($1::jsonb) AS x
 ON CONFLICT(sku) DO UPDATE SET name=EXCLUDED.name,source_price=EXCLUDED.source_price,proposed_gross=EXCLUDED.proposed_gross,available=EXCLUDED.available,source_category=EXCLUDED.source_category,target_category=EXCLUDED.target_category,mapping_status=EXCLUDED.mapping_status,data=EXCLUDED.data,updated_at=NOW()`,[JSON.stringify(payload)]);
 return result.rowCount??0;
}
