import {NextResponse} from 'next/server';
export async function POST(request:Request){
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
 const response=NextResponse.json({ok:true});
 response.cookies.set('rpm_admin_session','',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});
 return response;
}
