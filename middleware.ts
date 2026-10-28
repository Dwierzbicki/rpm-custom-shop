import {NextRequest,NextResponse} from 'next/server';
const COOKIE='rpm_admin_session';
async function sign(value:string,secret:string){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
export async function middleware(request:NextRequest){
 const path=request.nextUrl.pathname;
 const username=process.env.ADMIN_USERNAME,password=process.env.ADMIN_PASSWORD;
 const secret=process.env.ADMIN_SESSION_SECRET;
 if(!username||!password||!secret||secret.length<32)return new NextResponse('Admin unavailable: configure ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SESSION_SECRET (32+ characters).',{status:503});
 const token=request.cookies.get(COOKIE)?.value??'';
 let authenticated=false;
 const parts=token.split('.');
 if(parts.length===2&&/^\d{10,13}$/.test(parts[0])&&/^[a-f0-9]{64}$/.test(parts[1])){
  const expires=Number(parts[0]);
  if(expires>Date.now()&&expires<Date.now()+86400001){
   const expected=await sign(parts[0]+':'+username+':'+password,secret);
   let diff=0;for(let i=0;i<64;i++)diff|=expected.charCodeAt(i)^parts[1].charCodeAt(i);
   authenticated=diff===0;
  }
 }
 if(path==='/admin/login'||path==='/api/admin/login'){
  if(authenticated&&path==='/admin/login')return NextResponse.redirect(new URL('/admin/overview',request.url));
  return NextResponse.next();
 }
 if(!authenticated){
  if(path.startsWith('/api/'))return NextResponse.json({error:'Wymagane logowanie administratora'},{status:401});
  const url=new URL('/admin/login',request.url);
  return NextResponse.redirect(url);
 }
 return NextResponse.next();
}
export const config={matcher:['/admin/:path*','/api/admin/:path*']};
