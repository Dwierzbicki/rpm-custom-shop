import {NextRequest,NextResponse} from 'next/server';
import {createPublicKey,verify} from 'node:crypto';
import {CUSTOMER_COOKIE,OAUTH_COOKIE,decodeSigned,encodeSigned} from '../../../../lib/customer-auth';
import {upsertCustomer} from '../../../../lib/customer-db';
export const runtime='nodejs';
async function verifyGoogleIdToken(jwt:string,clientId:string,nonce:string){
 const parts=jwt.split('.');if(parts.length!==3)throw Error('Invalid token');
 const header=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
 const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
 if(header.alg!=='RS256'||typeof header.kid!=='string')throw Error('Unsupported token');
 if(!['accounts.google.com','https://accounts.google.com'].includes(payload.iss)||payload.aud!==clientId||payload.nonce!==nonce||typeof payload.exp!=='number'||payload.exp*1000<Date.now()||payload.email_verified!==true||typeof payload.sub!=='string'||!payload.sub)throw Error('Invalid token claims');
 const jwksResponse=await fetch('https://www.googleapis.com/oauth2/v3/certs',{cache:'no-store'});
 if(!jwksResponse.ok)throw Error('Unable to validate token');
 const jwks=await jwksResponse.json() as {keys:Array<Record<string,unknown>>};
 const jwk=jwks.keys.find(key=>key.kid===header.kid&&key.kty==='RSA');
 if(!jwk)throw Error('Unknown signing key');
 const key=createPublicKey({key:jwk as import('node:crypto').JsonWebKey,format:'jwk'});
 if(!verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),key,Buffer.from(parts[2],'base64url')))throw Error('Invalid signature');
 return {provider:'google' as const,providerId:payload.sub,email:typeof payload.email==='string'?payload.email:'',name:typeof payload.name==='string'?payload.name:''};
}
export async function GET(request:NextRequest){
 const url=new URL('/login',request.url);
 const state=request.nextUrl.searchParams.get('state'),code=request.nextUrl.searchParams.get('code');
 const raw=decodeSigned(request.cookies.get(OAUTH_COOKIE)?.value);
 const fail=()=>{url.searchParams.set('error','google');const response=NextResponse.redirect(url);response.cookies.delete(OAUTH_COOKIE);return response};
 if(!raw||!state||!code)return fail();
 try{
  const saved=JSON.parse(raw) as {state:string;verifier:string;nonce:string;exp:number};
  if(saved.state!==state||saved.exp<Date.now()||typeof saved.verifier!=='string')return fail();
  const clientId=process.env.GOOGLE_CLIENT_ID,clientSecret=process.env.GOOGLE_CLIENT_SECRET;
  if(!clientId||!clientSecret)return fail();
  const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,code,code_verifier:saved.verifier,grant_type:'authorization_code',redirect_uri:request.nextUrl.origin+'/api/auth/google/callback'}),cache:'no-store'});
  if(!tokenResponse.ok)return fail();
  const tokens=await tokenResponse.json() as {id_token?:string};
  if(!tokens.id_token)return fail();
  const profile=await verifyGoogleIdToken(tokens.id_token,clientId,saved.nonce);
  const customer=await upsertCustomer(profile);
  const response=NextResponse.redirect(new URL('/account',request.url));
  response.cookies.delete(OAUTH_COOKIE);
  response.cookies.set(CUSTOMER_COOKIE,encodeSigned(JSON.stringify({id:customer.id,exp:Date.now()+7*86400000})),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:7*86400});
  return response;
 }catch{return fail()}
}
