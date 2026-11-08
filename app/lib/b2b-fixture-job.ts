import {createHash} from 'node:crypto';
import type {ProcurementPlan} from './procurement-plan';
import {groupSupplierPurchases} from './procurement-export';

export type B2BJobLine={
 sourceLine:number;
 supplierSku:string;
 name:string;
 quantity:number;
 expectedPurchaseNetPLN:number;
 expectedShippingNetPLN:number;
 options:Record<string,string>;
 requiresVariantReview:boolean;
};
export type B2BFixtureJob={
 schemaVersion:1;
 mode:'fixture-only';
 orderId:string;
 supplier:'fmic'|'mtuning';
 procurementFingerprint:string;
 jobId:string;
 currency:'PLN';
 lines:B2BJobLine[];
 estimatedNetTotalPLN:number;
 manualApprovalRequired:true;
 caveat:string;
};

/**
 * Validated instruction set for an OFFLINE Playwright fixture only.
 * No contact details, supplier credentials, addresses, cart URLs or
 * production checkout capabilities are present in the job.
 */
export function createB2BFixtureJob(
 plan:ProcurementPlan,supplier:'fmic'|'mtuning'
):B2BFixtureJob{
 if(!/^[1-9][0-9]{0,17}$/.test(plan.orderId)||
  !/^[a-f0-9]{64}$/.test(plan.fingerprint)){
  throw new Error('Nieprawidłowy identyfikator zamówienia lub szkicu');
 }
 if(supplier!=='fmic'&&supplier!=='mtuning')throw new Error('Nieznany dostawca');
 const group=groupSupplierPurchases(plan).find(g=>g.supplier===supplier);
 if(!group||group.lines.length>30)throw new Error('Brak pozycji dostawcy lub przekroczony limit');
 const lines=group.lines.map(line=>{
  if(line.purchaseNet===null||line.shippingNet===null||!line.supplierSku||
   line.qty<1||line.qty>50||!Number.isSafeInteger(line.qty)||
   !Number.isFinite(line.purchaseNet)||line.purchaseNet<0||
   !Number.isFinite(line.shippingNet)||line.shippingNet<0||
   line.supplierSku.length>120||line.name.length>200){
   throw new Error('Niepełne lub niepoprawne dane oferty w zatwierdzonym planie');
  }
  const options=line.options??{};
  if(Object.entries(options).length>20||Object.entries(options).some(([key,val])=>
   typeof key!=='string'||key.length>100||typeof val!=='string'||val.length>200)){
   throw new Error('Nieprawidłowa konfiguracja produktu');
  }
  return {
   sourceLine:line.index+1,supplierSku:line.supplierSku,
   name:(line.offerName??line.name).slice(0,200),
   quantity:line.qty,
   expectedPurchaseNetPLN:line.purchaseNet,
   expectedShippingNetPLN:line.shippingNet,
   options,
   requiresVariantReview:line.requiresVariantCheck,
  };
 });
 const jobId=createHash('sha256').update(
  'rpm-b2b-fixture-v1:'+plan.orderId+':'+supplier+':'+plan.fingerprint
 ).digest('hex');
 return {
  schemaVersion:1,mode:'fixture-only',orderId:plan.orderId,
  supplier,procurementFingerprint:plan.fingerprint,jobId,currency:'PLN',
  lines,estimatedNetTotalPLN:group.estimatedNetTotal,
  manualApprovalRequired:true,
  caveat:'TYLKO SYMULACJA LOKALNA. Nie loguje do B2B, nie dodaje produktów do prawdziwego koszyka ani nie składa zamówień.',
 };
}
