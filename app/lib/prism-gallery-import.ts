import {createHash} from 'node:crypto';
import {getDbPool} from './db';

// Exact gallery identities from Allegro offer 18688035757 (PRISM ZZZ135).
const paths=[
 '11d3a8/17f70e2049fdac52966dd3ce3615/Korbowody-kute-PRISM-BMW-M50-M52-135mm',
 '11b4d5/d9bea61147bcbac9e68afcc1d77b/Korbowody-kute-PRISM-BMW-M50-M52-135mm-Stan-opakowania-oryginalne',
 '11dcb2/db907ce344d79585d2e20531cee9/Korbowody-kute-PRISM-BMW-M50-M52-135mm-Numer-katalogowy-czesci-ZZZ135',
 '111575/6235ade64286ab9bbf54cac7d592/Korbowody-kute-PRISM-BMW-M50-M52-135mm-Producent-czesci-PRISM',
 '116125/9acca04d48a9bcf51b1d01a9a5ad/Korbowody-kute-PRISM-BMW-M50-M52-135mm-Typ-samochodu-Samochody-osobowe',
 '1158d9/6d2fbe3048cbad9dda8b68ef0e59/Korbowody-kute-PRISM-BMW-M50-M52-135mm-Kod-taryfy-celnej-84099100',
 '1102ba/957b43334ca9a160c054e0bf913a',
 '1170ae/91e0a0444bc0a5b982330ab2f372',
 '11f136/870bb55a4b71a08c039a9ca5dea8'
];
const marker='manual_catalog_import:prism_zzz135_gallery:2026-11-25';
export async function importPrismGallery(){
 const db=getDbPool();
 const done=await db.query('SELECT 1 FROM rpm_shop_settings WHERE key=$1',[marker]);
 if(done.rowCount)return;
 const product=await db.query("SELECT id, data FROM rpm_catalog WHERE id=31 AND data->>'sku'='RPM-00031' AND lower(data->>'brand')='prism' AND data->'attributes'->>'Numer katalogowy'='ZZZ135' AND data->>'visible'='false' AND data->'images'='[]'::jsonb");
 if(!product.rowCount)return;
 const cloud=process.env.CLOUDINARY_CLOUD_NAME,key=process.env.CLOUDINARY_API_KEY,secret=process.env.CLOUDINARY_API_SECRET;
 if(!cloud||!key||!secret)throw Error('Cloudinary configuration missing');
 async function upload(path:string,index:number){
  for(const size of ['original','s720']){
   const file='https://a.allegroimg.com/'+size+'/'+path;
   const timestamp=String(Math.floor(Date.now()/1000)),folder='rpm-custom/products',public_id='prism-zzz135-allegro-18688035757-'+String(index+1).padStart(2,'0');
   const params={folder,overwrite:'true',public_id,timestamp};
   const signature=createHash('sha1').update(Object.entries(params).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('&')+secret).digest('hex');
   const form=new FormData();form.set('file',file);form.set('api_key',key!);form.set('signature',signature);for(const [k,v] of Object.entries(params))form.set(k,v);
   try{
    const r=await fetch('https://api.cloudinary.com/v1_1/'+encodeURIComponent(cloud!)+'/image/upload',{method:'POST',body:form,signal:AbortSignal.timeout(12000)});
    const data=await r.json();
    if(r.ok&&typeof data.secure_url==='string'&&data.secure_url.startsWith('https://res.cloudinary.com/'+cloud+'/image/upload/')&&Math.max(Number(data.width),Number(data.height))>=600&&data.resource_type==='image')return data.secure_url as string;
   }catch{/* try the verified image identity at the 720-pixel size */}
  }
  throw Error('PRISM gallery image '+(index+1)+' failed');
 }
 // No public product mutation until all nine assets have been imported.
 const urls:string[]=[];
 for(let i=0;i<paths.length;i+=3)urls.push(...await Promise.all(paths.slice(i,i+3).map((p,j)=>upload(p,i+j))));
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(9382761)');
  const updated=await client.query("UPDATE rpm_catalog SET data=jsonb_set(data,'{images}',$1::jsonb),updated_at=NOW() WHERE id=31 AND data->>'sku'='RPM-00031' AND lower(data->>'brand')='prism' AND data->'attributes'->>'Numer katalogowy'='ZZZ135' AND data->>'visible'='false' AND data->'images'='[]'::jsonb",[JSON.stringify(urls)]);
  if(updated.rowCount)await client.query('INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES($1,$2::jsonb,NOW()) ON CONFLICT(key) DO NOTHING',[marker,JSON.stringify({id:31,source:'https://allegro.pl/oferta/18688035757',count:urls.length})]);
  await client.query('COMMIT');
  console.info('[catalog] PRISM gallery '+(updated.rowCount?'imported: '+urls.length:'unchanged'));
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
