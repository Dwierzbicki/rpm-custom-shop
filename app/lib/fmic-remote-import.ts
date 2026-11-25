import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {join} from 'node:path';
import {getDbPool} from './db';
import {setupFmicCatalog,stageFmicBatch,type FmicRow} from './fmic-catalog-db';

export async function importFmicRemote(){
 const url=process.env.FMIC_FEED_URL;
 if(!url||new URL(url).origin!=='https://fmic.eu')throw new Error('FMIC_FEED_URL is not configured');
 await setupFmicCatalog();
 const client=await getDbPool().connect();
 let child:ReturnType<typeof spawn>|undefined;
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  await client.query('BEGIN');
  const lock=await client.query('SELECT pg_try_advisory_xact_lock(27391,1) AS acquired');
  if(!lock.rows[0].acquired)throw new Error('Another FMIC import is running');
  const settings=await client.query('SELECT discount FROM rpm_fmic_settings WHERE id=1');
  child=spawn(process.env.PYTHON_BIN||'python3',[join(process.cwd(),'scripts/fmic-feed-inspect.py'),'-','--jsonl','--discount',String(settings.rows[0].discount)],{stdio:['pipe','pipe','pipe']});
  const proc=child;
  const done=new Promise<number|null>((resolve,reject)=>{proc.once('error',reject);proc.once('close',resolve)});
  done.catch(()=>{});
  timer=setTimeout(()=>proc.kill(),12*60*1000);
  let diagnostics='';
  proc.stderr!.on('data',chunk=>{diagnostics=(diagnostics+String(chunk)).slice(-4096)});
  proc.stdin!.on('error',()=>proc.kill());
  const response=await fetch(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10*60*1000)});
  if(!response.ok||!response.body)throw new Error('FMIC feed HTTP '+response.status);
  const {Readable}=await import('node:stream');
  const {pipeline}=await import('node:stream/promises');
  const input=pipeline(Readable.fromWeb(response.body as import('node:stream/web').ReadableStream),proc.stdin!);
  input.catch(()=>proc.kill());
  let batch:FmicRow[]=[],count=0;
  for await(const line of createInterface({input:proc.stdout!,crlfDelay:Infinity})){
   batch.push(JSON.parse(line));
   if(batch.length===1000){count+=await stageFmicBatch(batch,client);batch=[]}
  }
  if(batch.length)count+=await stageFmicBatch(batch,client);
  await input;
  const code=await done;
  if(code!==0||!count){console.error('FMIC parser report',diagnostics);throw new Error('Feed validation failed; import rolled back')}
  await client.query('COMMIT');
  return {imported:count,published:0};
 }catch(e){child?.kill();await client.query('ROLLBACK').catch(()=>{});throw e}
 finally{if(timer)clearTimeout(timer);client.release()}
}
