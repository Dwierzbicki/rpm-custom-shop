import {expectedJobId} from './validate.mjs';

export function exampleJob(){
 const draft={
  schemaVersion:1,mode:'fixture-only',orderId:'12345',supplier:'fmic',
  procurementFingerprint:'a'.repeat(64),
  currency:'PLN',
  lines:[
   {sourceLine:1,supplierSku:'FMIC-WG-001',name:'Wastegate testowy',
    quantity:2,expectedPurchaseNetPLN:150,expectedShippingNetPLN:12,
    options:{Typ:'V-Band'},requiresVariantReview:true},
   {sourceLine:2,supplierSku:'FMIC-TURBO-002',name:'Turbina testowa',
    quantity:1,expectedPurchaseNetPLN:700,expectedShippingNetPLN:20,
    options:{},requiresVariantReview:false},
  ],
  estimatedNetTotalPLN:1044,manualApprovalRequired:true,
  caveat:'TYLKO SYMULACJA LOKALNA. Bez połączenia z dostawcą, bez prawdziwego koszyka, bez zamówień.',
 };
 return {...draft,jobId:expectedJobId(draft)};
}
