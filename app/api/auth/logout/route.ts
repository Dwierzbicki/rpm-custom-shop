import {NextRequest,NextResponse} from 'next/server';
import {CUSTOMER_COOKIE} from '../../../lib/customer-auth';
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');
 if(origin&&new URL(origin).origin!==request.nextUrl.origin)return NextResponse.json({error:'Forbidden'},{status:403});
 const response=NextResponse.json({ok:true});
 response.cookies.set(CUSTOMER_COOKIE,'',{path:'/',maxAge:0,httpOnly:true,sameSite:'lax'});
 return response;
}
