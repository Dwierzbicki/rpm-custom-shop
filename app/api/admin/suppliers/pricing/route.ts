import {NextResponse} from 'next/server';
import {getPricingRules,savePricingRules} from '../../../../lib/supplier-pricing-db';
import {validPricingRules} from '../../../../lib/supplier-pricing';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({pricing:await getPricingRules()},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Błąd pobierania cennika'},{status:503})}}
export async function PUT(request:Request){try{const origin=request.headers.get('origin'),host=request.headers.get('host');if(!origin||!host||new URL(origin).host!==host)return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});if(!(request.headers.get('content-type')||'').includes('application/json'))return NextResponse.json({error:'Wymagany JSON'},{status:415});const pricing=(await request.json())?.pricing;if(!validPricingRules(pricing))return NextResponse.json({error:'Niepoprawne reguły cenowe'},{status:400});await savePricingRules(pricing);return NextResponse.json({pricing})}catch{return NextResponse.json({error:'Błąd zapisu'},{status:500})}}
