import {NextRequest,NextResponse} from 'next/server';
import {CUSTOMER_COOKIE,customerFromCookie} from '../../../lib/customer-auth';
import {getCustomer} from '../../../lib/customer-db';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 const session=customerFromCookie(request.cookies.get(CUSTOMER_COOKIE)?.value);
 if(!session)return NextResponse.json({user:null},{headers:{'Cache-Control':'no-store'}});
 try{const user=await getCustomer(session.id);return NextResponse.json({user},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({user:null},{status:503})}
}
