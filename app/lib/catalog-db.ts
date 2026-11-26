import {getDbPool} from './db';
import {products,Product,RETIRED_DEMO_MAX_ID,isRetiredDemoProductId} from '../data';
import {withManifoldOptions} from './manifold-options';
import {manifoldDrafts,manifoldDraftMarker} from './manifold-drafts';
export type CatalogItem=Product&{stockStatus:'available'|'order'|'unavailable';leadTime:string;visible?:boolean;vatPercent?:number};
const defaults:CatalogItem[]=products.map(p=>({...p,stockStatus:p.configurable?'order':'available',leadTime:p.configurable?'Do potwierdzenia':'',visible:true}));
let setup:Promise<void>|undefined;
async function ensure(){setup??=(async()=>{await getDbPool().query('CREATE TABLE IF NOT EXISTS rpm_catalog (id INTEGER PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');await getDbPool().query('CREATE TABLE IF NOT EXISTS rpm_catalog_deleted (id INTEGER PRIMARY KEY)')})();try{await setup}catch(e){setup=undefined;throw e}}
export async function getCatalog():Promise<CatalogItem[]>{await ensure();const [saved,deleted]=await Promise.all([getDbPool().query<{id:number;data:Partial<CatalogItem>}>('SELECT id,data FROM rpm_catalog'),getDbPool().query<{id:number}>('SELECT id FROM rpm_catalog_deleted')]);const removed=new Set(deleted.rows.map(r=>r.id));const byId=new Map(saved.rows.map(r=>[r.id,r.data]));const base=defaults.filter(p=>byId.has(p.id)&&!removed.has(p.id)&&!isRetiredDemoProductId(p.id)).map(p=>({...p,...byId.get(p.id),id:p.id,sku:p.sku}));const extra=saved.rows.filter(r=>!defaults.some(p=>p.id===r.id)&&!removed.has(r.id)&&!isRetiredDemoProductId(r.id)).map(r=>r.data as CatalogItem);return [...base,...extra].map(withManifoldOptions).sort((a,b)=>a.id-b.id)}
export async function saveCatalog(item:CatalogItem){await ensure();await getDbPool().query('INSERT INTO rpm_catalog (id,data,updated_at) VALUES ($1,$2::jsonb,NOW()) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data, updated_at=NOW()',[item.id,JSON.stringify(item)]);}
export async function createCatalog(input:Omit<CatalogItem,'id'|'sku'>){await ensure();const client=await getDbPool().connect();try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(9382761)');const result=await client.query<{id:number}>('SELECT GREATEST(COALESCE((SELECT MAX(id) FROM rpm_catalog),0),COALESCE((SELECT MAX(id) FROM rpm_catalog_deleted),0),$1::integer)+1 AS id',[RETIRED_DEMO_MAX_ID]);const id=result.rows[0].id;const item:CatalogItem={...input,id,sku:'RPM-'+String(id).padStart(5,'0')};await client.query('INSERT INTO rpm_catalog (id,data) VALUES ($1,$2::jsonb)',[id,JSON.stringify(item)]);await client.query('COMMIT');return item}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}}
export async function deleteCatalog(id:number){await ensure();const client=await getDbPool().connect();try{await client.query('BEGIN');await client.query('INSERT INTO rpm_catalog_deleted(id) VALUES($1) ON CONFLICT DO NOTHING',[id]);await client.query('DELETE FROM rpm_catalog WHERE id=$1',[id]);await client.query('COMMIT')}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}}

/** One-time operator-requested manual catalogue entry. Same allocation lock and
 * storage shape as the normal admin editor; never updates or resurrects a row. */
export async function importPrismManualDraft(){
 await ensure();
 const client=await getDbPool().connect();
 const marker='manual_catalog_import:prism_zzz135:2026-11-25';
 try{
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(9382761)');
  const done=await client.query('SELECT 1 FROM rpm_shop_settings WHERE key=$1',[marker]);
  if(done.rowCount){await client.query('COMMIT');return}
  const duplicate=await client.query("SELECT id FROM rpm_catalog WHERE id>$1 AND lower(data->>'brand')='prism' AND (data->'attributes'->>'Numer katalogowy'='ZZZ135' OR data->>'name' ILIKE '%135%') LIMIT 1",[RETIRED_DEMO_MAX_ID]);
  let id:number;
  if(duplicate.rows.length){id=duplicate.rows[0].id}
  else{
   const r=await client.query<{id:number}>('SELECT GREATEST(COALESCE((SELECT MAX(id) FROM rpm_catalog),0),COALESCE((SELECT MAX(id) FROM rpm_catalog_deleted),0),$1::integer)+1 AS id',[RETIRED_DEMO_MAX_ID]);
   id=r.rows[0].id;
   const item:CatalogItem={id,sku:'RPM-'+String(id).padStart(5,'0'),name:'Kute korbowody PRISM BMW M50 / M52 / M54 135 mm',brand:'PRISM',category:'Korbowody',price:2100,engine:'BMW M50 / M52 / M54 — wyłącznie geometria 135 mm',description:'Komplet sześciu kutych korbowodów PRISM ZZZ135. Według oferty dostawcy: stal 42CrMo, profil H, obróbka CNC, tulejki brązowe i dobór masy w komplecie. Długość między osiami 135 mm, otwór stopy 48 mm, otwór sworznia 22,01 mm. Przygotowane pod śruby 3/8 cala; zawartość śrub wymaga potwierdzenia. Przed zakupem sprawdź dokładną wersję silnika, wymiary wału, tłoków i szerokość stopy. Nie wszystkie silniki z rodzin M50/M52/M54 mają korbowody 135 mm.',configurable:false,images:[],optionGroups:[],stockStatus:'order',leadTime:'Do potwierdzenia',visible:false,attributes:{'Numer katalogowy':'ZZZ135','Długość między osiami':'135 mm','Otwór stopy':'48 mm','Otwór sworznia':'22,01 mm','Materiał':'42CrMo (dane oferty)','Profil':'H','Komplet':'6 szt.','Śruby':'Przygotowane pod 3/8 cala; zawartość do potwierdzenia'},motolab:{slot:'rods',versions:['m52b28','m54b30'],maxPowerPs:700,note:'Rekomendacja warsztatowa RPM Custom do projektów do 700 KM. Dotyczy konfiguracji o potwierdzonej geometrii 135 mm; wymiary stopy, sworznia, śrub i tłoków wymagają sprawdzenia. Nie jest deklaracją producenta ani gwarancją trwałości.',noteEn:'RPM Custom workshop recommendation for projects up to 700 PS with confirmed 135 mm geometry. Verify big-end dimensions, pin, bolts and pistons. Not a manufacturer rating or durability guarantee.',enabled:true}};
   await client.query('INSERT INTO rpm_catalog (id,data) VALUES ($1,$2::jsonb)',[id,JSON.stringify(item)]);
  }
  await client.query('INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES($1,$2::jsonb,NOW())',[marker,JSON.stringify({id,source:'https://allegro.pl/oferta/18688035757',referenceOfferPrice:2100,checkedOn:'2026-11-25',draft:true})]);
  await client.query('COMMIT');
  console.info('[catalog] PRISM manual draft import completed');
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}

/** Operator-requested, hidden offers. Atomic, idempotent and never resurrects deleted records. */
export async function importManifoldDrafts(){
 await ensure();
 const client=await getDbPool().connect();
 try{
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(9382761)');
  const previous=await client.query('SELECT 1 FROM rpm_shop_settings WHERE key=$1',[manifoldDraftMarker]);
  if(previous.rowCount){await client.query('COMMIT');return}
  const imported:Record<string,number>={};
  for(const {key,input} of manifoldDrafts()){
   const existing=await client.query<{id:number}>(`SELECT c.id FROM rpm_catalog c WHERE c.id>$1 AND NOT EXISTS(SELECT 1 FROM rpm_catalog_deleted d WHERE d.id=c.id) AND lower(trim(c.data->>'brand'))=lower($2) AND lower(trim(c.data->>'name'))=lower($3) LIMIT 1`,[RETIRED_DEMO_MAX_ID,input.brand,input.name]);
   if(existing.rows[0]){imported[key]=existing.rows[0].id;continue}
   const result=await client.query<{id:number}>('SELECT GREATEST(COALESCE((SELECT MAX(id) FROM rpm_catalog),0),COALESCE((SELECT MAX(id) FROM rpm_catalog_deleted),0),$1::integer)+1 AS id',[RETIRED_DEMO_MAX_ID]);
   const id=result.rows[0].id;
   const item:CatalogItem={...input,id,sku:'RPM-'+String(id).padStart(5,'0')};
   await client.query('INSERT INTO rpm_catalog (id,data) VALUES($1,$2::jsonb)',[id,JSON.stringify(item)]);
   imported[key]=id;
  }
  await client.query('INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES($1,$2::jsonb,NOW())',[manifoldDraftMarker,JSON.stringify({imported,draft:true,pricePending:true,photosPending:true})]);
  await client.query('COMMIT');
  console.info('[catalog] manifold drafts imported',Object.keys(imported).length);
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}

/** Explicit operator request: persist existing WG/T25 configuration on the two real offers.
 * Single transaction, row locks, only optionGroups/description, no recreation of deleted rows.
 * The marker prevents later deployments from overwriting manual edits. */
export async function persistManifoldWastegateOptions(){
 await ensure();
 const client=await getDbPool().connect();
 const marker='manual_catalog_update:rpm_manifold_wg:2026-11-26';
 try{
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(9382761)');
  const previous=await client.query('SELECT 1 FROM rpm_shop_settings WHERE key=$1',[marker]);
  if(previous.rowCount){await client.query('COMMIT');return}
  const result=await client.query<{id:number;data:CatalogItem}>(`SELECT id,data FROM rpm_catalog c
   WHERE ((id=32 AND data->>'sku'='RPM-00032') OR (id=33 AND data->>'sku'='RPM-00033'))
   AND lower(trim(data->>'brand'))='rpm custom' AND data->>'category'='Kolektory'
   AND NOT EXISTS(SELECT 1 FROM rpm_catalog_deleted d WHERE d.id=c.id)
   ORDER BY id FOR UPDATE`);
  const updated:string[]=[];
  for(const row of result.rows){
   const item=withManifoldOptions(row.data);
   const patch={optionGroups:item.optionGroups,description:item.description};
   if(JSON.stringify(row.data.optionGroups)!==JSON.stringify(patch.optionGroups)||row.data.description!==patch.description){
    await client.query('UPDATE rpm_catalog SET data=data||$2::jsonb,updated_at=NOW() WHERE id=$1',[row.id,JSON.stringify(patch)]);
   }
   updated.push(row.data.sku);
  }
  await client.query('INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES($1,$2::jsonb,NOW())',[marker,JSON.stringify({skus:updated,fields:['optionGroups','description']})]);
  await client.query('COMMIT');
  console.info('[catalog] persisted manifold WG options',updated);
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
