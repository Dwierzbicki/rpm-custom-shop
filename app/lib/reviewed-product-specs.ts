// Curated seed records. Never infer a variant from a similar title or SKU prefix.
import {getDbPool} from './db';
import type {TechnicalField} from './fmic-technical';
export type ReviewedProductSpec={fields:TechnicalField[];sources:{label:string;url:string;scope:string}[];description?:string};
const seeds=[
  {
    "sku": "102167108",
    "ar": "0,82",
    "flange": "T3",
    "name": "Turbosprężarka Pulsar PSR PTE 6266E 735HP .82 T3 Wlot 3\" V-Band Wylot Łożyska Kulkowe",
    "source": "https://fmic.eu/377508-turbocharger-pulsar-psr-pte-6266e-735hp-82-t3-inlet-3-v-band-outlet-ball-bearings-102167108.html",
    "label": "FMIC"
  },
  {
    "sku": "102167111",
    "ar": "0,63",
    "flange": "T3",
    "name": "Turbosprężarka Pulsar PSR PTE 6266E 735HP .63 T3 Wlot 3\" V-Band Wylot Łożyska Kulkowe",
    "source": "https://fmic.eu/377507-turbocharger-pulsar-psr-pte-6266e-735hp-63-t3-inlet-3-v-band-outlet-ball-bearings-102167111.html",
    "label": "FMIC"
  },
  {
    "sku": "102167107",
    "ar": "0,96",
    "flange": "T4",
    "name": "Turbosprężarka Pulsar PSR PTE 6266E 735HP .96 T4 Wlot 3\" V-Band Wylot Łożyska Kulkowe",
    "source": "https://torquelab.eu/products/pulsar-turbo-6266e-ball-bearing-turbo-up-to-735hp-psr-102167107",
    "label": "Torque Lab"
  }
];
const manufacturer='https://pulsarturbo.com/product/pte-6266-ball-bearing-turbo-up-to-735hp/';
const verifiedDate='2026-11-25';
function seedData(seed:typeof seeds[number]):ReviewedProductSpec{
 return {
  description:'Pulsar 6266E to turbosprężarka z podwójnym łożyskowaniem kulkowym. Producent deklaruje maksymalną moc silnika 735 HP. Ten wariant ma wlot obudowy turbiny '+seed.flange+', A/R '+seed.ar+' oraz wyjście V-band 3 cale. Dobór do silnika wymaga uwzględnienia planowanego przepływu i konfiguracji układu.',
  fields:[
   {key:'power',label:'Deklarowana moc maksymalna',value:'735 HP'},
   {key:'compressor_wheel',label:'Wirnik ssący',value:'62 × 82,2 mm'},
   {key:'turbine_wheel',label:'Wirnik wydechowy',value:'66,1 × 74,17 mm'},
   {key:'bearing',label:'Łożyskowanie',value:'Podwójne kulkowe'},
   {key:'turbine_inlet',label:'Wlot muszli wydechowej',value:seed.flange},
   {key:'ar',label:'A/R',value:seed.ar},
   {key:'turbine_outlet',label:'Wylot turbiny',value:'V-band 3″'},
   {key:'oil_feed',label:'Zasilanie olejem',value:'1/8-27 NPSF'}
  ],
  sources:[
   {label:'Pulsar Turbo Systems',url:manufacturer,scope:'Dokumentacja producenta: 6266E i lista wariantów'},
   {label:seed.label,url:seed.source,scope:'Potwierdzenie indeksu i wariantu '+seed.sku}
  ]
 };
}
let setup:Promise<void>|undefined;
export function setupReviewedProducts():Promise<void>{
 if(!setup)setup=(async()=>{
  const db=getDbPool();
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_verified_product_data (
   sku text PRIMARY KEY,
   catalog_name text NOT NULL,
   manufacturer text NOT NULL,
   verified_at date NOT NULL,
   status text NOT NULL CHECK(status IN ('verified','revoked','review')),
   data jsonb NOT NULL,
   updated_at timestamptz NOT NULL DEFAULT NOW()
  )`);
  for(const seed of seeds){
   await db.query(`INSERT INTO rpm_verified_product_data(sku,catalog_name,manufacturer,verified_at,status,data)
    SELECT sku,name,'Pulsar',$3::date,'verified',$4::jsonb FROM rpm_fmic_catalog
    WHERE sku=$1 AND name=$2 ON CONFLICT(sku) DO NOTHING`,
    [seed.sku,seed.name,verifiedDate,JSON.stringify(seedData(seed))]);
  }
 })().catch(e=>{setup=undefined;throw e});
 return setup;
}
export async function reviewedProductSpec(sku:string,name:string):Promise<ReviewedProductSpec|undefined>{
 await setupReviewedProducts();
 const result=await getDbPool().query(
  "SELECT data FROM rpm_verified_product_data WHERE sku=$1 AND catalog_name=$2 AND status='verified'",[sku,name]);
 return result.rows[0]?.data;
}
