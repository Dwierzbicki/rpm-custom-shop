import {NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
export const runtime='nodejs';
function safeEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export async function POST(request:Request){
 const username=process.env.ADMIN_USERNAME,password=process.env.ADMIN_PASSWORD,secret=process.env.ADMIN_SESSION_SECRET;
 if(!username||!password||!secret||secret.length<32)return NextResponse.json({error:'Brak konfiguracji administratora'},{status:503});
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
 let input;
 try{input=await request.json()}catch{return NextResponse.json({error:'Niepoprawny JSON'},{status:400})}
 if(typeof input?.username!=='string'||typeof input?.password!=='string'||input.username.length>200||input.password.length>200||!safeEqual(input.username,username)||!safeEqual(input.password,password))return NextResponse.json({error:'Nieprawidłowy login lub hasło'},{status:401});
 const expires=String(Date.now()+86400000);
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(expires+':'+username+':'+password))).toString('hex');
 const response=NextResponse.json({ok:true});
 response.cookies.set('rpm_admin_session',expires+'.'+signature,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:86400});
 return response;
}
