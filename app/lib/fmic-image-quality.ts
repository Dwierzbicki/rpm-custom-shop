import sharp from 'sharp';
import {isMagentoPlaceholder} from './fmic-placeholder';
import {createHash} from 'node:crypto';
import {getDbPool} from './db';
// Keep native libvips allocations bounded on the 512 MiB storefront instance.
sharp.cache(false);
sharp.concurrency(1);

let auditSetup:Promise<unknown>|undefined;
export async function setupImageAudit(){
 if(!auditSetup)auditSetup=getDbPool().query(`CREATE TABLE IF NOT EXISTS rpm_fmic_image_audit (
 url TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'pending',
 checked_at TIMESTAMPTZ, hash TEXT, detail TEXT
 ); CREATE INDEX IF NOT EXISTS rpm_fmic_image_audit_status_idx ON rpm_fmic_image_audit(status,url);
 -- Confirmed Magento placeholder from storefront inspection; shared by 27 SKUs.
 INSERT INTO rpm_fmic_image_audit(url,status,checked_at,detail)
 VALUES('https://fmic.pl/media/catalog/product/A/u/AudiShortshifterPRO7_03f79d57-be25-4c89-aec7-9c0584448055.jpg','blank',NOW(),'Confirmed Magento placeholder'),
 ('https://fmic.pl/media/catalog/product/D/S/DSC_2933copy.jpg','blank',NOW(),'Confirmed Magento placeholder: Yaris GR')
 ON CONFLICT(url) DO UPDATE SET status='blank',checked_at=NOW(),detail=EXCLUDED.detail
 WHERE rpm_fmic_image_audit.status IN ('pending','review','ok')`).catch(e=>{auditSetup=undefined;throw e});
 await auditSetup;
}
export async function inspectImage(url:string){
 const parsed=new URL(url);
 if(parsed.origin!=='https://fmic.pl'||parsed.username||parsed.password)return {status:'review',hash:null,detail:'Nieobsługiwany host'};
 try{
 const response=await fetch(parsed,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(response.status===404||response.status===410)return {status:'missing',hash:null,detail:'HTTP '+response.status};
 if(!response.ok)return {status:'review',hash:null,detail:'HTTP '+response.status};
 if(!response.body)return {status:'review',hash:null,detail:'Brak odpowiedzi'};
 const reader=response.body.getReader();const parts:Buffer[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8*1024*1024)throw Error('Plik powyżej 8 MiB');parts.push(Buffer.from(value))}}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
 const bytes=Buffer.concat(parts);
 const hash=createHash('sha256').update(bytes).digest('hex');
 let pixels:Buffer;
 try{pixels=await sharp(bytes,{limitInputPixels:8000000,failOn:'error'}).flatten({background:'#ffffff'}).resize(96,96,{fit:'fill'}).toColourspace('srgb').removeAlpha().raw().toBuffer()}
 catch{return {status:'review',hash,detail:'Nie udało się zdekodować obrazu'};}
 // Only near-uniform white at every sampled pixel is hidden automatically.
 const blank=pixels.length===96*96*3&&pixels.every(v=>v>=250);
 const placeholder=isMagentoPlaceholder(pixels);
 return {status:blank||placeholder?'blank':'ok',hash,detail:placeholder?'Magento placeholder':null};
 }catch(e){return {status:'review',hash:null,detail:e instanceof Error?e.message.slice(0,180):'Błąd pobierania'}}
}
