import {getDbPool} from './db';
import {setupFmicCatalog} from './fmic-catalog-db';

let setup:Promise<unknown>|undefined;
export async function setupEnrichment(){
 if(!setup)setup=(async()=>{await setupFmicCatalog();return getDbPool().query(`CREATE TABLE IF NOT EXISTS rpm_fmic_enrichment (
 sku text PRIMARY KEY REFERENCES rpm_fmic_catalog(sku) ON DELETE CASCADE,
 source_url text NOT NULL, data jsonb NOT NULL, fetched_at timestamptz NOT NULL DEFAULT NOW()
 ); CREATE TABLE IF NOT EXISTS rpm_fmic_product_descriptions (sku text PRIMARY KEY REFERENCES rpm_fmic_catalog(sku) ON DELETE CASCADE, description text NOT NULL DEFAULT '', brand text NOT NULL DEFAULT '', published boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT NOW()); ALTER TABLE rpm_fmic_product_descriptions ADD COLUMN IF NOT EXISTS technical jsonb; ALTER TABLE rpm_fmic_product_descriptions ADD COLUMN IF NOT EXISTS publication_origin text;`)})().catch(e=>{setup=undefined;throw e});
 await setup;
}
type Obj=Record<string,unknown>;
const obj=(x:unknown):Obj|null=>x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Obj:null;
const str=(x:unknown,max=500)=>typeof x==='string'?x.trim().slice(0,max):'';
export function extractProduct(html:string,sku:string){
 const nodes:Obj[]=[];
 function visit(x:unknown,depth=0){
 if(depth>12||nodes.length>1000)return;
 if(Array.isArray(x)){for(const item of x)visit(item,depth+1);return}
 const o=obj(x);if(!o)return;
 nodes.push(o);if(o['@graph'])visit(o['@graph'],depth+1);if(o.mainEntity)visit(o.mainEntity,depth+1);
 }
 for(const match of html.matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)){
 try{visit(JSON.parse(match[1]))}catch{}
 }
 const product=nodes.find(n=>(Array.isArray(n['@type'])?n['@type'].includes('Product'):n['@type']==='Product')&&str(n.sku).toLowerCase()===sku.toLowerCase());
 if(!product)throw Error('Brak danych strukturalnych Product z dokładnie zgodnym SKU');
 const brand=typeof product.brand==='string'?str(product.brand):str(obj(product.brand)?.name);
 const offers=(Array.isArray(product.offers)?product.offers:[product.offers]).map(obj).filter((o):o is Obj=>!!o).slice(0,10).map(o=>({price:typeof o.price==='number'?String(o.price):str(o.price),currency:str(o.priceCurrency),availability:str(o.availability)}));
 const properties=(Array.isArray(product.additionalProperty)?product.additionalProperty:[]).map(obj).filter((o):o is Obj=>!!o).slice(0,100).map(o=>({name:str(o.name),value:typeof o.value==='number'?String(o.value):str(o.value,1000),unit:str(o.unitText)})).filter(o=>o.name&&o.value);
 const images=(Array.isArray(product.image)?product.image:[product.image]).map(x=>typeof x==='string'?x:str(obj(x)?.url)).filter(x=>{try{return new URL(x).protocol==='https:'}catch{return false}}).slice(0,20);
 return {sku,brand,name:str(product.name,1000),description:str(product.description,30000),mpn:str(product.mpn),offers,properties,images};
}
export async function inspectProduct(sku:string,options:{persist?:boolean}={}){
 await setupEnrichment();
 const db=getDbPool();
 const result=await db.query("SELECT sku,data->>'url' AS url FROM rpm_fmic_catalog WHERE sku=$1",[sku]);
 const row=result.rows[0];if(!row)throw Error('Nie znaleziono SKU');
 const url=new URL(row.url);
 if(url.origin!=='https://fmic.pl'||url.username||url.password)throw Error('Nieobsługiwany adres źródłowy');
 const response=await fetch(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{'User-Agent':'RPMCustomCatalog/1.0 (supplier catalog pilot)'}});
 if(!response.ok||!response.body)throw Error('FMIC HTTP '+response.status);
 if(!response.headers.get('content-type')?.includes('text/html'))throw Error('Odpowiedź nie jest HTML');
 const reader=response.body.getReader(),decoder=new TextDecoder();let html='',size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>5*1024*1024)throw Error('HTML przekracza limit 5 MiB');html+=decoder.decode(value,{stream:true})}html+=decoder.decode()}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
 const data=extractProduct(html,sku);
 if(options.persist!==false)await db.query('INSERT INTO rpm_fmic_enrichment(sku,source_url,data) VALUES($1,$2,$3) ON CONFLICT(sku) DO UPDATE SET source_url=EXCLUDED.source_url,data=EXCLUDED.data,fetched_at=NOW()',[sku,url.href,JSON.stringify(data)]);
 return {sku,source_url:url.href,data};
}
