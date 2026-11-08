import {createHash} from 'node:crypto';
import type {SupplierCsvPreview,SupplierCsvRow} from '../../src/lib/supplier-csv-preview';
import type {SupplierOffer} from './supplier-matching';

export type SupplierFeedOptions={
 supplier:'fmic'|'mtuning';
 shippingNet:number;
 leadDays:number;
 pricesNetPLNConfirmed:boolean;
};
type OfferDraft=Omit<SupplierOffer,'id'>;
export type SupplierFeedIssue={line:number;message:string};
export type FeedAction='create'|'update'|'unchanged';
export type SupplierFeedPlan={
 fingerprint:string;
 issues:SupplierFeedIssue[];
 totalIssues:number;
 counts:{create:number;update:number;unchanged:number};
 sample:Array<{line:number;sku:string;name:string;purchaseNet:number;available:boolean;action:FeedAction;matchStatus:SupplierOffer['matchStatus']}>;
 changes:OfferDraft[];
 canImport:boolean;
};

export function validSupplierFeedOptions(input:unknown):input is SupplierFeedOptions{
 if(!input||typeof input!=='object'||Array.isArray(input))return false;
 const x=input as Record<string,unknown>;
 return (x.supplier==='fmic'||x.supplier==='mtuning')
  &&typeof x.shippingNet==='number'&&Number.isFinite(x.shippingNet)&&x.shippingNet>=0&&x.shippingNet<=1_000_000
  &&Number.isInteger(x.leadDays)&&Number(x.leadDays)>=0&&Number(x.leadDays)<=365
  &&typeof x.pricesNetPLNConfirmed==='boolean';
}
function norm(value:string):string{return value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'')}
function numericPrice(row:SupplierCsvRow){return Number(row.price.replace(/\s/g,'').replace(',','.'))}
function offerEqual(a:OfferDraft,b:OfferDraft):boolean{
 return a.supplier===b.supplier&&a.supplierSku===b.supplierSku
 &&a.brand===b.brand&&a.mpn===b.mpn&&a.ean===b.ean&&a.name===b.name
 &&a.variant===b.variant&&a.purchaseNet===b.purchaseNet&&a.shippingNet===b.shippingNet
 &&a.currency===b.currency&&a.available===b.available&&a.leadDays===b.leadDays
 &&a.productId===b.productId&&a.matchStatus===b.matchStatus;
}

/**
 * Turns a vendor CSV preview into safe offers. No database or catalog writes.
 * Previously confirmed product links survive routine cost/stock updates.
 * Changes to their identity fields require manual review, not blind relinking.
 */
export function planSupplierFeed(preview:SupplierCsvPreview,existing:SupplierOffer[],options:SupplierFeedOptions):SupplierFeedPlan{
 const issues:SupplierFeedIssue[]=[
  ...preview.errors.map(e=>({line:e.line,message:e.message})),
  ...preview.duplicates.map(e=>({line:e.line,message:'Duplikat '+e.key+' (pierwszy w wierszu '+e.firstLine+')'})),
 ];
 const lookup=new Map<string,SupplierOffer>();
 for(const offer of existing){
  const key=offer.supplierSku.toUpperCase();
  if(lookup.has(key))issues.push({line:1,message:'W bazie istnieją oferty różniące się tylko wielkością liter SKU: '+offer.supplierSku});
  else lookup.set(key,offer);
 }
 const observed=new Set<string>();
 const changes:OfferDraft[]=[];
 const counts={create:0,update:0,unchanged:0};
 const sample:SupplierFeedPlan['sample']=[];
 if(!preview.headers.some(h=>['stock','quantity','qty','stan','ilosc'].includes(h))){
  issues.push({line:1,message:'Brak kolumny stanu magazynowego (stock / stan). Dostępność musi być potwierdzona.'});
 }
 if(!preview.headers.some(h=>['sku','symbol','kod','product_code','indeks'].includes(h))){
  issues.push({line:1,message:'Import do bazy wymaga SKU dostawcy. EAN lub MPN bez SKU wystarcza wyłącznie do podglądu.'});
 }
 for(const row of preview.rows){
  const sku=row.sku.trim(),upper=sku.toUpperCase();
  if(!sku||sku.length>120){issues.push({line:row.line,message:'Brak SKU lub przekroczono 120 znaków'});continue}
  if(observed.has(upper)){issues.push({line:row.line,message:'Powtórzone SKU w feedzie: '+sku});continue}
  observed.add(upper);
  if(!row.stock||!/^\d+$/.test(row.stock)){
   issues.push({line:row.line,message:'Brak jednoznacznego stanu magazynowego dla '+sku});continue;
  }
  if([row.name,row.brand,row.mpn,row.ean,row.variant].some(s=>s.length>200)){
   issues.push({line:row.line,message:'Długość nazwy lub identyfikatora przekracza 200 znaków'});continue;
  }
  const price=numericPrice(row);
  if(!Number.isFinite(price)||price<=0||price>10_000_000){
   issues.push({line:row.line,message:'Cena netto poza zakresem 0–10 000 000 PLN'});continue;
  }
  const previous=lookup.get(upper);
  const pick=(key:'brand'|'ean'|'mpn'|'variant'):string=>row[key]||previous?.[key]||'';
  if(previous?.matchStatus==='confirmed'){
   const identityChanged=(['brand','ean','mpn','variant'] as const).some(k=>
    !!row[k]&&norm(row[k])!==norm(previous[k]));
   if(identityChanged){
    issues.push({line:row.line,message:'SKU '+sku+' zmieniło EAN, MPN, markę lub wariant — sprawdź ręcznie powiązanie z produktem'});continue;
   }
  }
  const offer:OfferDraft={
   supplier:options.supplier,supplierSku:previous?.supplierSku??sku,name:row.name,
   brand:pick('brand'),ean:pick('ean'),mpn:pick('mpn'),variant:pick('variant'),
   purchaseNet:price,shippingNet:options.shippingNet,currency:'PLN',
   available:Number(row.stock)>0,leadDays:options.leadDays,
   productId:previous?.productId??null,matchStatus:previous?.matchStatus??'unmatched',
  };
  const action:FeedAction=!previous?'create':offerEqual(offer,previous)?'unchanged':'update';
  counts[action]++;
  if(action!=='unchanged')changes.push(offer);
  if(sample.length<25)sample.push({line:row.line,sku,name:offer.name,purchaseNet:price,available:offer.available,action,matchStatus:offer.matchStatus});
 }
 const relevant=existing
  .map(o=>({id:o.id,supplier:o.supplier,supplierSku:o.supplierSku,brand:o.brand,mpn:o.mpn,ean:o.ean,
   name:o.name,variant:o.variant,purchaseNet:o.purchaseNet,shippingNet:o.shippingNet,currency:o.currency,
   available:o.available,leadDays:o.leadDays,productId:o.productId,matchStatus:o.matchStatus}))
  .sort((a,b)=>a.supplierSku.localeCompare(b.supplierSku));
 const fingerprint=createHash('sha256')
  .update(JSON.stringify({preview,existing:relevant,options}),'utf8').digest('hex');
 return {fingerprint,issues:issues.slice(0,50),totalIssues:issues.length,counts,sample,changes,
  canImport:options.pricesNetPLNConfirmed&&issues.length===0&&preview.rows.length>0};
}
