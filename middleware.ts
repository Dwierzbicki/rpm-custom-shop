import {NextRequest,NextResponse} from 'next/server';
export function middleware(request:NextRequest){
 const username=process.env.ADMIN_USERNAME;
 const password=process.env.ADMIN_PASSWORD;
 if(!username||!password)return new NextResponse('Panel niedostępny: skonfiguruj ADMIN_USERNAME i ADMIN_PASSWORD.',{status:503});
 const auth=request.headers.get('authorization');
 if(auth?.startsWith('Basic ')){
  try{
   const decoded=atob(auth.slice(6));
   const separator=decoded.indexOf(':');
   if(separator>0&&decoded.slice(0,separator)===username&&decoded.slice(separator+1)===password)return NextResponse.next();
  }catch{}
 }
 return new NextResponse('Wymagane logowanie administratora.',{status:401,headers:{'WWW-Authenticate':'Basic realm="RPM Custom Admin", charset="UTF-8"','Cache-Control':'no-store'}});
}
export const config={matcher:['/admin/:path*','/api/admin/:path*']};
