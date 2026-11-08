import {Pool} from 'pg';

/**
 * One lazily initialized PostgreSQL pool per Node.js process.
 * All catalog, account, order and supplier modules share the same pool.
 * The global reference survives module reloads in development.
 */
const runtime=globalThis as typeof globalThis & {rpmDbPool?:Pool};

export function getDbPool():Pool {
 const connectionString=process.env.DATABASE_URL;
 if(!connectionString)throw new Error('DATABASE_URL missing');
 if(!runtime.rpmDbPool){
  runtime.rpmDbPool=new Pool({
   connectionString,
   max:10,
   ssl:process.env.DATABASE_SSL==='require'?{rejectUnauthorized:true}:undefined,
  });
 }
 return runtime.rpmDbPool;
}
