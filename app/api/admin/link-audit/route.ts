import {NextResponse} from 'next/server';
import {getDbPool} from '../../../lib/db';
import {getCatalog} from '../../../lib/catalog-db';
import {visibleCatalog} from '../../../lib/fmic-category-membership';
import {FMIC_CATEGORY_TREE,type SupplierCategory} from '../../../fmic-categories';
import {categoryPath} from '../../../category-routing';
import {productPath} from '../../../lib/product-path';
import {auditModes,type AuditMode,type AuditItem} from '../../../lib/link-audit';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const size=40;
const special=" AND (sku !~ '^[A-Za-z0-9_.-]+$' OR sku IN ('.','..',''))";
const pages=['/','/sklep','/informacje','/account','/koszyk','/garage','/motolab','/cr-calculator','/power-guides','/autopomoc'];
function categoryLinks(nodes:SupplierCategory[],parent:string[]=[]):string[]{
 return nodes.flatMap(n=>{const path=[...parent,n.name];return [categoryPath(path),...categoryLinks(n.children,path)]});
}
async function prefix(){
 const manual=(await getCatalog()).filter(p=>p.visible!==false);
 const entries:[string,string?][]=[...new Set([...pages,...categoryLinks(FMIC_CATEGORY_TREE)])].map(p=>[p]);
 for(const p of manual)entries.push([productPath(p.name,p.sku),p.sku]);
 return entries.map(([path,sku],i)=>({path,sku,cursor:String(i+1)}));
}
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const mode=params.get('mode') as AuditMode,phase=params.get('phase'),cursor=params.get('cursor')??'';
 if(!auditModes.includes(mode)||!['prefix','supplier'].includes(phase??'')||cursor.length>120||phase==='prefix'&&!/^\d{0,6}$/.test(cursor)||mode==='pages'&&phase==='supplier')return NextResponse.json({error:'Niepoprawny zakres audytu'},{status:400,headers});
 try{
  const where=visibleCatalog+(mode==='special'?special:'');
  let items:AuditItem[]=[];let total:number|undefined;
  if(phase==='prefix'){
   const all=mode==='special'?[]:await prefix();items=all.slice(Number(cursor||0),Number(cursor||0)+size);
   if(params.get('count')==='1'){
    const count=mode==='pages'?0:Number((await getDbPool().query('SELECT count(*) AS n FROM rpm_fmic_catalog WHERE '+where)).rows[0].n);
    total=all.length+count;
   }
  }else{
   const result=await getDbPool().query<{sku:string;name:string}>('SELECT sku,name FROM rpm_fmic_catalog WHERE '+where+(cursor?' AND sku>$1 ORDER BY sku LIMIT 40':' ORDER BY sku LIMIT 40'),cursor?[cursor]:[]);
   items=result.rows.map(p=>({path:productPath(p.name,p.sku),sku:p.sku,cursor:p.sku}));
  }
  return NextResponse.json({items,total},{headers});
 }catch(e){console.error('Link audit catalog batch failed',e);return NextResponse.json({error:'Nie udało się pobrać adresów'},{status:500,headers})}
}
