import {NextResponse} from 'next/server';
import {Pool} from 'pg';
import {getPaymentSettings} from '../../../lib/settings-db';
import {orderMailPreview} from '../../../lib/order-email';
import type {OrderMailData} from '../../../lib/order-email';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const globalDb=globalThis as unknown as {rpmMailPreviewPool?:Pool};
function db(){if(!process.env.DATABASE_URL)throw Error('Database unavailable');return globalDb.rpmMailPreviewPool??(globalDb.rpmMailPreviewPool=new Pool({connectionString:process.env.DATABASE_URL,max:3}));}
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const id=url.searchParams.get('id')??'';
  const language=url.searchParams.get('language');
  if(!/^[1-9][0-9]{0,17}$/.test(id)||language!==null&&language!=='pl'&&language!=='en')return NextResponse.json({error:'Niepoprawne parametry'},{status:400});
  const result=await db().query<{id:string;customer:Record<string,unknown>;items:OrderMailData['items'];total:number}>('SELECT id::text,customer,items,total::float8 AS total FROM rpm_orders WHERE id=$1 LIMIT 1',[id]);
  const row=result.rows[0];
  if(!row)return NextResponse.json({error:'Nie znaleziono zamówienia'},{status:404});
  const c=row.customer;
  const shipping=c.shipping as {method?:string;cost?:number}|undefined;
  const payment=c.payment as {method?:string}|undefined;
  const shippingCost=Number(shipping?.cost??0);
  const method=payment?.method==='bank_transfer'?'bank_transfer':'pay_on_pickup';
  const settings=method==='bank_transfer'?await getPaymentSettings():null;
  const paymentInstructions=method==='bank_transfer'&&settings?{recipient:settings.transferRecipient,account:settings.bankAccount,instructions:settings.transferInstructions,title:`RPM CUSTOM - Zamowienie #${id}`}:null;
  const order:OrderMailData={
   orderId:id,language:language??(c.language==='en'?'en':'pl'),
   customerName:String(c.name??''),customerEmail:String(c.email??''),
   items:row.items,subtotal:Math.round((row.total-shippingCost)*100)/100,shippingCost,total:row.total,
   shippingMethod:shipping?.method==='pickup'?'pickup':'courier',
   paymentMethod:method,paymentInstructions
  };
  return NextResponse.json({preview:orderMailPreview(order),mode:process.env.EMAIL_MODE??'mock',note:'Podgląd nie wysyła wiadomości. Dane przelewu pochodzą z aktualnych ustawień sklepu.'},{headers:{'Cache-Control':'no-store'}});
 }catch(error){
  console.error('[order-email] admin preview error',error instanceof Error?error.name:'UnknownError');
  return NextResponse.json({error:'Nie udało się przygotować podglądu'},{status:500});
 }
}
