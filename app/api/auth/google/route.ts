import {NextRequest,NextResponse} from 'next/server';
import {createHash} from 'node:crypto';
import {encodeSigned,newNonce,OAUTH_COOKIE} from '../../../lib/customer-auth';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 const clientId=process.env.GOOGLE_CLIENT_ID;
 if(!clientId)return NextResponse.json({error:'Logowanie Google nie jest jeszcze skonfigurowane'},{status:503});
 const state=newNonce(),verifier=newNonce(),nonce=newNonce();
 const origin=(process.env.APP_URL||'').trim().replace(/\/$/,'');
 if(!/^https:\/\/[^/]+$/i.test(origin))return NextResponse.json({error:'APP_URL musi zawierać publiczny adres HTTPS sklepu'},{status:503});
 const challenge=createHash('sha256').update(verifier).digest('base64url');
 const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
 url.searchParams.set('client_id',clientId);
 url.searchParams.set('redirect_uri',origin+'/api/auth/google/callback');
 url.searchParams.set('response_type','code');
 url.searchParams.set('scope','openid email profile');
 url.searchParams.set('state',state);
 url.searchParams.set('nonce',nonce);
 url.searchParams.set('code_challenge',challenge);
 url.searchParams.set('code_challenge_method','S256');
 url.searchParams.set('prompt','select_account');
 const response=NextResponse.redirect(url);
 response.cookies.set(OAUTH_COOKIE,encodeSigned(JSON.stringify({state,verifier,nonce,exp:Date.now()+600000})),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:600});
 return response;
}
