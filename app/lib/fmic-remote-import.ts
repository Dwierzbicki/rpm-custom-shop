import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {join} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {getDbPool} from './db';
import {setupFmicCatalog,stageFmicBatch,type FmicRow} from './fmic-catalog-db';

export type ImportProgress={phase:'download'|'processing'|'commit';count:number;percent:number|null;bytes:number};
export async function importFmicRemote(report:(p:ImportProgress)=>void=()=>{}){
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
  child=spawn(process.env.PYTHON_BIN||'python3',[join(process.cwd(),'scripts/fmic-feed-inspect.py'),'-','--jsonl','--allow-invalid-identity','--discount',String(settings.rows[0].discount)],{stdio:['pipe','pipe','pipe']});
  const proc=child;
  const done=new Promise<number|null>((resolve,reject)=>{proc.once('error',reject);proc.once('close',resolve)});
  done.catch(()=>{});
  timer=setTimeout(()=>proc.kill(),12*60*1000);
  let diagnostics='';
  proc.stderr!.on('data',chunk=>{diagnostics=(diagnostics+String(chunk)).slice(-4096)});
  proc.stdin!.on('error',()=>proc.kill());
  const response=await fetch(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10*60*1000)});
  if(!response.ok||!response.body)throw new Error('FMIC feed HTTP '+response.status);
  const reader=response.body.getReader();
  const total=Number(response.headers.get('content-length'));
  const known=total>0&&(!response.headers.get('content-encoding')||response.headers.get('content-encoding')==='identity');
  let bytes=0,count=0,last=0;
  const progress=(phase:ImportProgress['phase'],force=false)=>{if(force||Date.now()-last>=500){last=Date.now();report({phase,count,bytes,percent:known?Math.min(99,Math.floor(bytes/total*100)):null})}};
  progress('download',true);
  async function* chunks(){
   try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;progress('processing');yield Buffer.from(value)}}
   finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
  }
  const input=pipeline(chunks(),proc.stdin!);
  input.catch(()=>proc.kill());
  let batch:FmicRow[]=[];
  for await(const line of createInterface({input:proc.stdout!,crlfDelay:Infinity})){
   batch.push(JSON.parse(line));
   if(batch.length===1000){count+=await stageFmicBatch(batch,client);batch=[];progress('processing',true)}
  }
  if(batch.length)count+=await stageFmicBatch(batch,client);
  await input;
  const code=await done;
  if(code!==0||!count){console.error('FMIC parser report',diagnostics);throw new Error('Feed validation failed; import rolled back')}
  const summary=JSON.parse(diagnostics);
  const skipped=Number(summary.counts?.invalid??0);
  if(summary.counts?.valid!==count||!Number.isInteger(skipped)||skipped<0)throw new Error('Feed report mismatch');
  console.info('FMIC import validation',JSON.stringify(summary));
  progress('commit',true);
  await client.query('COMMIT');
  return {imported:count,skipped,published:0};
 }catch(e){child?.kill();await client.query('ROLLBACK').catch(()=>{});throw e}
 finally{if(timer)clearTimeout(timer);client.release()}
}
