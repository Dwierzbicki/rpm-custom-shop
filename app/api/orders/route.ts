import {availablePaymentMethods,PaymentMethod} from '../../lib/payment-settings';
import {getShippingSettings,getPaymentSettings} from '../../lib/settings-db';
import {isShippingMethod,shippingQuote} from '../../lib/shipping';
import {NextResponse} from 'next/server';
import {Pool} from 'pg';
import {getCatalog} from '../../lib/catalog-db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const globalDb=globalThis as unknown as {rpmOrdersPool?:Pool};
function db(){if(!process.env.DATABASE_URL)throw Error('Database unavailable');return globalDb.rpmOrdersPool??(globalDb.rpmOrdersPool=new Pool({connectionString:process.env.DATABASE_URL,max:4}));}
type IncomingLine={productId:number;qty:number;options?:Record<string,string>};
function validText(value:unknown,max:number){return typeof value==='string'&&value.trim().length>0&&value.trim().length<=max;}
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin'),host=request.headers.get('host');
  if(origin&&(!host||new URL(origin).host!==host))return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
  if(!(request.headers.get('content-type')??'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
  const body=await request.json();
  const customer=body?.customer;
  if(!customer||!validText(customer.name,120)||!validText(customer.email,200)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)||!validText(customer.city,120)||!validText(customer.postalCode,20)||!validText(customer.address,240))return NextResponse.json({error:'Sprawdź dane kontaktowe'},{status:400});
  const type=customer.type==='company'?'company':'private';
  if(customer.type!==undefined&&customer.type!=='company'&&customer.type!=='private')return NextResponse.json({error:'Niepoprawny typ klienta'},{status:400});
  if(customer.phone!==undefined&&(typeof customer.phone!=='string'||customer.phone.length>30||!/^\\+?[0-9 ()-]{7,30}$/.test(customer.phone.trim())))return NextResponse.json({error:'Niepoprawny telefon'},{status:400});
  if(type==='company'&&(!validText(customer.company,160)||typeof customer.nip!=='string'||!/^\\d{10}$/.test(customer.nip)))return NextResponse.json({error:'Podaj nazwę firmy i 10-cyfrowy NIP'},{status:400});
  if(customer.notes!==undefined&&(typeof customer.notes!=='string'||customer.notes.length>1000))return NextResponse.json({error:'Uwagi są zbyt długie'},{status:400});
  const shippingMethod=body?.shippingMethod??'courier';
  if(!isShippingMethod(shippingMethod))return NextResponse.json({error:'Wybierz poprawny sposób dostawy'},{status:400});
  const paymentMethod=body?.paymentMethod as PaymentMethod;
  const payments=await getPaymentSettings();
  if(!availablePaymentMethods(payments,shippingMethod).includes(paymentMethod))return NextResponse.json({error:'Wybierz dostępną metodę płatności'},{status:400});
  const lines=body?.lines as IncomingLine[];
  if(!Array.isArray(lines)||lines.length<1||lines.length>30)return NextResponse.json({error:'Niepoprawny koszyk'},{status:400});
  const catalog=await getCatalog();
  const items=[] as {productId:number;sku:string;name:string;qty:number;unitPrice:number;options:Record<string,string>}[];
  for(const line of lines){
   if(!Number.isSafeInteger(line.productId)||!Number.isSafeInteger(line.qty)||line.qty<1||line.qty>50)return NextResponse.json({error:'Niepoprawna ilość'},{status:400});
   const p=catalog.find(p=>p.id===line.productId&&p.visible!==false&&p.stockStatus!=='unavailable');
   if(!p)return NextResponse.json({error:'Produkt jest niedostępny'},{status:409});
   const supplied=line.options??{};
   if(typeof supplied!=='object'||Array.isArray(supplied))return NextResponse.json({error:'Niepoprawne opcje'},{status:400});
   const groups=(p.optionGroups??[]).filter(g=>g.id!=='rpm-wastegate');
   let extra=0;
   const verified:Record<string,string>={};
   if(groups.length){
    for(const group of groups){
     const chosen=supplied[group.name];
     const opt=group.options.find(o=>o.label===chosen);
     if(group.required&&!opt)return NextResponse.json({error:'Wybierz wymagane opcje: '+group.name},{status:400});
     if(opt){verified[group.name]=opt.label;extra+=opt.price;}
    }
    const flange=groups.find(g=>g.id==='rpm-flange');
    if(flange){
     const chosen=flange.options.find(o=>o.label===supplied[flange.name]);
     if(chosen)verified.Wastegate=chosen.id.endsWith('-twin')?'2× WG':'1× WG';
    }
   }else if(p.configurable)return NextResponse.json({error:'Konfiguracja produktu wymaga potwierdzenia'},{status:409});
   items.push({productId:p.id,sku:p.sku,name:p.name,qty:line.qty,unitPrice:Math.round((p.price+extra)*100)/100,options:verified});
  }
  const total=Math.round(items.reduce((sum,item)=>sum+item.unitPrice*item.qty,0)*100)/100;
  const shippingSettings=await getShippingSettings();
  if(shippingMethod==='pickup'&&!shippingSettings.pickupEnabled||shippingMethod==='courier'&&!shippingSettings.courierEnabled)return NextResponse.json({error:'Wybrany sposób dostawy jest niedostępny'},{status:400});
  const shipping=shippingQuote(shippingMethod,total,shippingSettings);
  const grandTotal=Math.round((total+shipping.cost)*100)/100;
  await db().query('CREATE TABLE IF NOT EXISTS rpm_orders (id BIGSERIAL PRIMARY KEY, customer JSONB NOT NULL, items JSONB NOT NULL, total NUMERIC(12,2) NOT NULL, status TEXT NOT NULL DEFAULT \'new\', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  const saved=await db().query<{id:string}>('INSERT INTO rpm_orders(customer,items,total) VALUES($1::jsonb,$2::jsonb,$3) RETURNING id',[JSON.stringify({type,name:customer.name.trim(),email:customer.email.trim(),phone:customer.phone?.trim()??'',company:type==='company'?customer.company.trim():'',nip:type==='company'?customer.nip.trim():'',city:customer.city.trim(),postalCode:customer.postalCode.trim(),address:customer.address.trim(),notes:customer.notes?.trim()??'',shipping,payment:{method:paymentMethod,status:'pending'}}),JSON.stringify(items),grandTotal]);
  const orderId=saved.rows[0].id;
  const paymentInstructions=paymentMethod==='bank_transfer'?{recipient:payments.transferRecipient,account:payments.bankAccount,instructions:payments.transferInstructions,title:`RPM CUSTOM - Zamowienie #${orderId}`} : null;
  return NextResponse.json({orderId,total:grandTotal,subtotal:total,shipping,items,payment:{method:paymentMethod,status:'pending'},paymentInstructions,status:'new'},{status:201});
 }catch{return NextResponse.json({error:'Nie udało się zapisać zgłoszenia. Spróbuj ponownie.'},{status:500});}
}
