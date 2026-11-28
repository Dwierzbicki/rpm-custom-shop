import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import raw from './release.json';
import {validateRelease,type ReleaseCheck} from './release';
// Server-only. The manifest and approved image bytes are released atomically in Git.
let result:ReleaseCheck|undefined;
export function getHardwareRelease():ReleaseCheck{
 if(result)return result;
 const check=validateRelease(raw);
 if(!check.ok)return result=check;
 const errors:string[]=[];
 const hashes=new Map<string,string>();
 for(const d of check.release.diagrams){
  try{
   let hash=hashes.get(d.image.path);
   if(!hash){hash=createHash('sha256').update(readFileSync(join(process.cwd(),'public',d.image.path))).digest('hex');hashes.set(d.image.path,hash)}
   if(hash!==d.image.sha256)errors.push('Suma kontrolna ilustracji niezgodna: '+d.id);
  }catch{errors.push('Brak zatwierdzonej ilustracji: '+d.id)}
 }
 return result=errors.length?{ok:false,errors:errors.slice(0,100)}:check;
}
