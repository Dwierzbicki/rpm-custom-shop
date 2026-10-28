import {NextResponse} from 'next/server';
import {getCatalog,saveCatalog,createCatalog,deleteCatalog,CatalogItem} from '../../../lib/catalog-db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({products:await getCatalog()},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Baza danych niedostępna. Sprawdź DATABASE_URL.'},{status:503})}}
function validOptions(groups:unknown):boolean {
 if(groups===undefined)return true;
 if(!Array.isArray(groups)||groups.length>12)return false;
 const ids=new Set<string>();
 for(const group of groups){
  if(!group||typeof group!=='object')return false;
  const g=group as Record<string,unknown>;
  if(typeof g.id!=='string'||!/^[a-zA-Z0-9_-]{1,60}$/.test(g.id)||ids.has(g.id))return false;
  ids.add(g.id);
  if(typeof g.name!=='string'||!g.name.trim()||g.name.length>100||typeof g.required!=='boolean')return false;
  if(!Array.isArray(g.options)||g.options.length<1||g.options.length>30)return false;
  const optionIds=new Set<string>();
  for(const option of g.options){
   if(!option||typeof option!=='object')return false;
   const o=option as Record<string,unknown>;
   if(typeof o.id!=='string'||!/^[a-zA-Z0-9_-]{1,60}$/.test(o.id)||optionIds.has(o.id))return false;
   optionIds.add(o.id);
   if(typeof o.label!=='string'||!o.label.trim()||o.label.length>100)return false;
   if(typeof o.price!=='number'||!Number.isFinite(o.price)||o.price<0||o.price>1000000)return false;
  }
 }
 return true;
}
function valid(input:Partial<CatalogItem>){return validOptions(input.optionGroups)&&(!input.images||(Array.isArray(input.images)&&input.images.length<=10&&input.images.every(url=>typeof url==='string'&&url.length<1200&&/^https:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/image\/upload\//.test(url))))&&typeof input.name==='string'&&!!input.name.trim()&&input.name.length<=200&&typeof input.price==='number'&&Number.isFinite(input.price)&&input.price>=0&&input.price<=10000000&&typeof input.description==='string'&&input.description.length<=10000&&typeof input.brand==='string'&&input.brand.length<=120&&typeof input.category==='string'&&input.category.length<=80&&typeof input.engine==='string'&&input.engine.length<=120&&['available','order','unavailable'].includes(input.stockStatus??'')&&typeof input.leadTime==='string'&&input.leadTime.length<=200&&typeof input.visible==='boolean'}
function allowed(request:Request){const origin=request.headers.get('origin');const host=request.headers.get('host');try{return !origin||!!host&&new URL(origin).host===host}catch{return false}}
export async function PATCH(request:Request){try{
 const origin=request.headers.get('origin');const host=request.headers.get('host');if(origin&&(!host||new URL(origin).host!==host))return NextResponse.json({error:'Niedozwolone pochodzenie żądania'},{status:403});
 const contentType=request.headers.get('content-type')||'';if(!contentType.includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
 const input=await request.json() as Partial<CatalogItem>;
 const current=(await getCatalog()).find(p=>p.id===input.id);
 if(!current)return NextResponse.json({error:'Nieznany produkt'},{status:404});
 if(!valid(input))return NextResponse.json({error:'Niepoprawne dane produktu'},{status:400});
 const updated:CatalogItem={...current,name:input.name!.trim(),price:input.price!,description:input.description!,brand:input.brand!,category:input.category!,engine:input.engine!,stockStatus:input.stockStatus!,leadTime:input.leadTime!,visible:input.visible!,images:input.images??current.images??[],optionGroups:input.optionGroups??current.optionGroups??[]};
 await saveCatalog(updated);return NextResponse.json({product:updated},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Nie udało się zapisać produktu'},{status:500})}}

export async function POST(request:Request){try{
 if(!allowed(request))return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
 if(!(request.headers.get('content-type')||'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
 const input=await request.json() as Partial<CatalogItem>;
 if(!valid(input)||typeof input.configurable!=='boolean')return NextResponse.json({error:'Niepoprawne dane produktu'},{status:400});
 const {name,brand,category,price,engine,configurable,description,stockStatus,leadTime,visible,images,optionGroups}=input;
 const product=await createCatalog({name:name!.trim(),brand:brand!,category:category!,price:price!,engine:engine!,configurable,description:description!,stockStatus:stockStatus!,leadTime:leadTime!,visible,images:images??[],optionGroups:optionGroups??[]});
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
