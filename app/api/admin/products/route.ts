import {NextResponse} from 'next/server';
import {getCatalog,saveCatalog,createCatalog,deleteCatalog,CatalogItem} from '../../../lib/catalog-db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({products:await getCatalog()},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Baza danych niedostępna. Sprawdź DATABASE_URL.'},{status:503})}}
function valid(input:Partial<CatalogItem>){return typeof input.name==='string'&&!!input.name.trim()&&input.name.length<=200&&typeof input.price==='number'&&Number.isFinite(input.price)&&input.price>=0&&input.price<=10000000&&typeof input.description==='string'&&input.description.length<=10000&&typeof input.brand==='string'&&input.brand.length<=120&&typeof input.category==='string'&&input.category.length<=80&&typeof input.engine==='string'&&input.engine.length<=120&&['available','order','unavailable'].includes(input.stockStatus??'')&&typeof input.leadTime==='string'&&input.leadTime.length<=200&&typeof input.visible==='boolean'}
function allowed(request:Request){const origin=request.headers.get('origin');const host=request.headers.get('host');try{return !origin||!!host&&new URL(origin).host===host}catch{return false}}
export async function PATCH(request:Request){try{
 const origin=request.headers.get('origin');const host=request.headers.get('host');if(origin&&(!host||new URL(origin).host!==host))return NextResponse.json({error:'Niedozwolone pochodzenie żądania'},{status:403});
 const contentType=request.headers.get('content-type')||'';if(!contentType.includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
 const input=await request.json() as Partial<CatalogItem>;
 const current=(await getCatalog()).find(p=>p.id===input.id);
 if(!current)return NextResponse.json({error:'Nieznany produkt'},{status:404});
 if(!valid(input))return NextResponse.json({error:'Niepoprawne dane produktu'},{status:400});
 const updated:CatalogItem={...current,name:input.name!.trim(),price:input.price!,description:input.description!,brand:input.brand!,category:input.category!,engine:input.engine!,stockStatus:input.stockStatus!,leadTime:input.leadTime!,visible:input.visible!};
 await saveCatalog(updated);return NextResponse.json({product:updated},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Nie udało się zapisać produktu'},{status:500})}}

export async function POST(request:Request){try{
 if(!allowed(request))return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
 if(!(request.headers.get('content-type')||'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
 const input=await request.json() as Partial<CatalogItem>;
 if(!valid(input)||typeof input.configurable!=='boolean')return NextResponse.json({error:'Niepoprawne dane produktu'},{status:400});
 const {name,brand,category,price,engine,configurable,description,stockStatus,leadTime,visible}=input;
 const product=await createCatalog({name:name!.trim(),brand:brand!,category:category!,price:price!,engine:engine!,configurable,description:description!,stockStatus:stockStatus!,leadTime:leadTime!,visible});
 return NextResponse.json({product},{status:201});
}catch{return NextResponse.json({error:'Nie udało się dodać produktu'},{status:500})}}
export async function DELETE(request:Request){try{
 if(!allowed(request))return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
 if(!(request.headers.get('content-type')||'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
 const {id}=await request.json();
 if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'Niepoprawne ID'},{status:400});
 if(!(await getCatalog()).some(p=>p.id===id))return NextResponse.json({error:'Nieznany produkt'},{status:404});
 await deleteCatalog(id);return NextResponse.json({success:true});
}catch{return NextResponse.json({error:'Nie udało się usunąć produktu'},{status:500})}}
