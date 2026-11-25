import {NextResponse} from 'next/server';
import {authorizedBasic,signSiteSession,safeReturnPath,SITE_COOKIE} from '../lib/site-lock';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"};
function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c))}
function page(next:string,failed=false){return new NextResponse(`<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RPM Custom — dostęp testowy</title><style>*{box-sizing:border-box}body{margin:0;background:#10141b;color:#f4f6fa;font:15px system-ui;min-height:100dvh;display:grid;place-items:center;padding:20px}main{width:min(390px,100%);background:#1c222c;border:1px solid #39414d;border-radius:16px;padding:30px}h1{font-size:25px;margin:0}h1 span{color:#e3385b}p{color:#aeb9c8;line-height:1.5}label{display:block;margin-top:16px}input,button{width:100%;font:inherit;padding:12px;border-radius:8px;margin-top:6px}input{border:1px solid #465161;background:#121820;color:white}button{border:0;background:#e3385b;color:white;font-weight:700;margin-top:22px;cursor:pointer}.error{color:#ff9ab0}</style><main><h1>RPM <span>CUSTOM</span></h1><p>Sklep w przygotowaniu. Zaloguj się, aby uzyskać dostęp testowy.</p>${failed?'<p class="error" role="alert">Nieprawidłowy login lub hasło.</p>':''}<form method="post" action="/site-access"><input type="hidden" name="next" value="${escapeHtml(next)}"><label>Login<input name="username" autocomplete="username" required maxlength="200"></label><label>Hasło<input name="password" type="password" autocomplete="current-password" required maxlength="200"></label><button type="submit">Zaloguj się</button></form></main></html>`,{status:failed?403:200,headers})}
export async function GET(request:Request){if(process.env.SITE_LOCK_ENABLED!=='1')return NextResponse.redirect(new URL('/',request.url));return page(safeReturnPath(new URL(request.url).searchParams.get('next')))}
export async function POST(request:Request){
 if(process.env.SITE_LOCK_ENABLED!=='1')return NextResponse.redirect(new URL('/',request.url),303);
 const user=process.env.SITE_LOCK_USERNAME??process.env.ADMIN_USERNAME,password=process.env.SITE_LOCK_PASSWORD??process.env.ADMIN_PASSWORD,secret=process.env.ADMIN_SESSION_SECRET;
 if(!user||!password||!secret||secret.length<32)return new NextResponse('Site access not configured',{status:503,headers});
 const origin=request.headers.get('origin');
 const allowed=new Set(['https://rpmcustom.pl','https://www.rpmcustom.pl','https://rpm-custom-shop.onrender.com']);
 if(process.env.NODE_ENV!=='production')allowed.add(new URL(request.url).origin);
 if(!origin||!allowed.has(origin))return new NextResponse('Niedozwolone pochodzenie formularza. Otwórz stronę bezpośrednio na rpmcustom.pl.',{status:403,headers});
 let form:FormData;try{form=await request.formData()}catch{return new NextResponse('Invalid form',{status:400,headers})}
 const next=safeReturnPath(String(form.get('next')??'')),u=String(form.get('username')??''),p=String(form.get('password')??'');
 if(u.length>200||p.length>200||!(await authorizedBasic('Basic '+Buffer.from(u+':'+p).toString('base64'),user,password)))return page(next,true);
 const expires=String(Date.now()+86400000),signature=await signSiteSession(expires,secret,user,password);
 const response=new NextResponse(null,{status:303,headers:{Location:next}});
 response.headers.set('Cache-Control','private, no-store');response.cookies.set(SITE_COOKIE,expires+'.'+signature,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:86400});return response;
}
