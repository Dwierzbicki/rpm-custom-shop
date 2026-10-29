import {NextResponse} from 'next/server';
import {getCatalog,saveCatalog} from '../../../../lib/catalog-db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function PUT(request:Request){
 try{const origin=request.headers.get('origin'),host=request.headers.get('host');
 if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
 if(!(request.headers.get('content-type')||'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
 const body=await request.json();
 if(!Number.isSafeInteger(body.productId)||body.productId<1||![0,5,8,23].includes(body.vatPercent))return NextResponse.json({error:'Wybierz prawidłową stawkę VAT'},{status:400});
 const product=(await getCatalog()).find(p=>p.id===body.productId);
 if(!product)return NextResponse.json({error:'Nieznany produkt'},{status:404});
 await saveCatalog({...product,vatPercent:body.vatPercent});
 return NextResponse.json({ok:true,productId:product.id,vatPercent:body.vatPercent});
 }catch{return NextResponse.json({error:'Nie udało się zapisać stawki VAT'},{status:500})}
}
