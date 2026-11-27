import {NextResponse} from 'next/server';
import {powerRangesFor} from '../../../lib/storefront-config';
import {listKnowledge} from '../../../lib/motolab-knowledge-db';
import {buildEvidenceFor,evidenceVersions} from '../../../lib/motolab-build-evidence';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const version=new URL(request.url).searchParams.get('version')??'';
 if(!powerRangesFor(version).length)return NextResponse.json({error:'Invalid engine'},{status:400});
 try{
  const results=await Promise.all(evidenceVersions(version).map(version=>listKnowledge('engine',{page:1,query:'',status:'approved',version})));
  return NextResponse.json({references:buildEvidenceFor(results.flatMap(r=>r.records),version),hasMore:results.some(r=>r.hasMore)},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'References unavailable'},{status:503})}
}
