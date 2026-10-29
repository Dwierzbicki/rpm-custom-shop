import {NextResponse} from 'next/server';
import {getOffers} from '../../../../lib/supplier-db';
import {bestOffer} from '../../../../lib/supplier-matching';
import {getPricingRules} from '../../../../lib/supplier-pricing-db';
import {quotePrice} from '../../../../lib/supplier-pricing';
import {getCatalog,saveCatalog} from '../../../../lib/catalog-db';
export const runtime='nodejs';export const dynamic='force-dynamic';
async function proposals(){
 const [offers,rules,products]=await Promise.all([getOffers(),getPricingRules(),getCatalog()]);
 return products.flatMap(p=>{
  const o=bestOffer(offers.filter(x=>x.productId===p.id),rules.maxLeadDays);
  if(!o)return [];
  const cost=o.purchaseNet+o.shippingNet,quote=quotePrice(cost,p.id,rules);
  const vatVerified=[0,5,8,23].includes(p.vatPercent??-1);
  const vatPercent=vatVerified?p.vatPercent!:null;
  const gross=vatPercent===null?null:Math.round(quote.price*(1+vatPercent/100)*100)/100;
  return [{productId:p.id,name:p.name,sku:p.sku,currentGross:p.price,proposedGross:gross,proposedNet:quote.price,costNet:cost,minimumNet:quote.minimum,valid:quote.valid&&vatVerified,priceValid:quote.valid,vatVerified,manual:quote.manual,supplier:o.supplier,offerId:o.id,leadDays:o.leadDays,vatPercent}];
 });
}
export async function GET(){try{return NextResponse.json({proposals:await proposals(),notice:'Publikacja wymaga potwierdzonej stawki VAT produktu. Brak domyślnego VAT.'},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Nie udało się przygotować podglądu'},{status:503})}}
export async function POST(request:Request){
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 try{if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
 if(!(request.headers.get('content-type')||'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});
 const body=await request.json();
 if(body?.confirm!=='PUBLISH_PRICE'||!Number.isSafeInteger(body.productId)||!Number.isFinite(body.expectedGross)||!Number.isFinite(body.proposedGross)||!Number.isInteger(body.expectedVatPercent))return NextResponse.json({error:'Wymagane potwierdzenie ceny'},{status:400});
 const proposal=(await proposals()).find(p=>p.productId===body.productId);
 if(!proposal||!proposal.valid||proposal.proposedGross===null||proposal.vatPercent===null||proposal.currentGross!==body.expectedGross||proposal.proposedGross!==body.proposedGross||proposal.vatPercent!==body.expectedVatPercent)return NextResponse.json({error:'Oferta, cena lub reguły uległy zmianie. Odśwież podgląd.'},{status:409});
 if(proposal.proposedGross<=0)return NextResponse.json({error:'Cena musi być dodatnia'},{status:400});
 const product=(await getCatalog()).find(p=>p.id===body.productId);
 if(!product||product.price!==body.expectedGross)return NextResponse.json({error:'Cena katalogowa zmieniła się'},{status:409});
 await saveCatalog({...product,price:proposal.proposedGross});
 return NextResponse.json({ok:true,productId:product.id,price:proposal.proposedGross});
 }catch{return NextResponse.json({error:'Nie udało się opublikować ceny'},{status:500})}
}
