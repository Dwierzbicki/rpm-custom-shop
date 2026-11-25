import {FMIC_CATEGORY_TREE} from '../fmic-categories';
import {categoryPath} from '../category-routing';

export type FmicCategoryMatch={sourcePath:string;targetPath:string[];url:string|null;status:'exact'|'normalized'|'parent_review'|'unmapped'};

const approvedAliases:Record<string,string[]>={
  "Elektronika > CANchecked > Wyświetlacze": [
    "Elektronika",
    "CANchecked",
    "Urządzenia pomiarowe"
  ],
  "Elektronika > Wskaźniki > Wskaźniki": [
    "Elektronika",
    "Wskaźniki"
  ],
  "Napęd i zawieszenie > Zestawy skrętu > Zestawy skrętu": [
    "Napęd i zawieszenie",
    "Zestawy skrętu"
  ],
  "Układ chłodzenia > Końcówki olejowe > Push on": [
    "Układ chłodzenia",
    "Końcówki olejowe",
    "Push On"
  ],
  "Układ chłodzenia > Podstawki korki i termostaty oleju": [
    "Układ chłodzenia",
    "Podstawki, korki i termostaty oleju"
  ],
  "Układ dolotowy > Kolanka i rury nierdzewne > Spawane kolanka nierdzewne welding porn": [
    "Układ dolotowy",
    "Kolanka i rury nierdzewne",
    "Spawane kolanka nierdzewne"
  ],
  "Układ dolotowy > Łączniki silikonowe > Zatyczki do króćców podcisnienia": [
    "Układ dolotowy",
    "Łączniki silikonowe",
    "Zatyczki do króćców podciśnienia"
  ],
  "Układ dolotowy > Oil catch tank > Oil catch tank": [
    "Układ dolotowy",
    "Oil catch tank"
  ],
  "Układ paliwowy > Filtry paliwa > Filtry Paliwa": [
    "Układ paliwowy",
    "Filtry paliwa"
  ],
  "Układ paliwowy > Swirl Poty > Swirl Poty": [
    "Układ paliwowy",
    "Swirl Poty"
  ],
  "Układ paliwowy > Wtryskiwacze > Wtryskiwacze Dedykowane": [
    "Układ paliwowy",
    "Wtryskiwacze",
    "Wtryskiwacze dedykowane"
  ],
  "Układ paliwowy > Wtryskiwacze > Wtryskiwacze Uniwersalne": [
    "Układ paliwowy",
    "Wtryskiwacze",
    "Wtryskiwacze uniwersalne"
  ],
  "Układ paliwowy > Zbiorniki paliwa > Zbiorniki Paliwa": [
    "Układ paliwowy",
    "Zbiorniki paliwa"
  ]
};

function key(value:string){
 return value.normalize('NFKC').trim().toLocaleLowerCase('pl-PL')
 .replace(/(\d)\s*['’′º]/g,'$1°').replace(/\s+/g,' ');
}

/** Match against the actual storefront navigation, not product title guesses.
 * Parent matches are suggestions requiring approval before publication.
 */
export function mapFmicCategory(sourcePath:string):FmicCategoryMatch{
 const cleaned=sourcePath.split('>').map(p=>p.trim()).filter(Boolean);
 const alias=approvedAliases[cleaned.join(' > ')];
 const parts=alias??cleaned;
 if(parts.length>2&&key(parts[0])===key('Napęd i zawieszenie')&&key(parts[1])===key('Elementy poliuretanowe'))parts.splice(2);
 if(parts.length===3&&parts[0]==='Układ dolotowy'&&parts[1]==='Kolanka i rury nierdzewne'&&parts[2]==='Spawane kolanka nierdzewne welding porn')parts[2]='Spawane kolanka nierdzewne';
 const targetPath:string[]=[];
 let nodes=FMIC_CATEGORY_TREE;
 for(const part of parts){
  const matches=nodes.filter(node=>key(node.name)===key(part));
  if(matches.length!==1)break;
  const node=matches[0];
  targetPath.push(node.name);
  nodes=node.children;
 }
 if(!targetPath.length)return {sourcePath,targetPath,url:null,status:'unmapped'};
 const complete=targetPath.length===parts.length;
 const status=complete?(targetPath.join(' > ')===sourcePath.split('>').map(p=>p.trim()).filter(Boolean).join(' > ')?'exact':'normalized'):'parent_review';
 return {sourcePath,targetPath,url:categoryPath(targetPath),status};
}

/** Infer only unclassified supplier rows from explicit product-type prefixes. */
// Explicit SKU decisions, scoped to the reviewed supplier name and source path.
const reviewedProducts:Record<string,{name:string;source:string;target:string[]}>={
  "13256": {
    "name": "FLEXIPADS 32mm (1\") Quick Lock Soft PUR PSA Interface",
    "source": "",
    "target": [
      "Detailing",
      "Polerowanie lakieru",
      "Akcesoria polerskie"
    ]
  },
  "56005": {
    "name": "FLEXIPADS Double Sided Grip Hand Block soft/medium 70x125mm",
    "source": "",
    "target": [
      "Detailing",
      "Polerowanie lakieru",
      "Akcesoria polerskie"
    ]
  },
  "014772SP": {
    "name": "Mechaniczny system gaśniczy Sparco 4.25l",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Wyposażenie wnętrza i kierowcy",
      "Gaśnice i systemy gaśnicze"
    ]
  },
  "ACL-4C5749-STD": {
    "name": "Cam bush set ACL 4C5749-STD for Ford",
    "source": "",
    "target": [
      "Silnik i turbo",
      "Panewki"
    ]
  },
  "APASPRAY200": {
    "name": "Klej Kontaktowy w Sprayu ApaSpray 200 Apama 500ml",
    "source": "",
    "target": [
      "Pozostałe",
      "Akcesoria warsztatowe"
    ]
  },
  "APASPRAY700": {
    "name": "Mocny Uniwersalny Klej w Sprayu ApaSpray 700 Apama 500ml",
    "source": "",
    "target": [
      "Pozostałe",
      "Akcesoria warsztatowe"
    ]
  },
  "APASPRAY CLEAN": {
    "name": "Zmywacz Środek do usuwania Kleju Cytrusowy Spray Apama 500ml",
    "source": "",
    "target": [
      "Pozostałe",
      "Akcesoria warsztatowe"
    ]
  },
  "APASPRAY UNI": {
    "name": "Uniwersalny Klej w Sprayu ApaSpray Uni Apama 500ml",
    "source": "",
    "target": [
      "Pozostałe",
      "Akcesoria warsztatowe"
    ]
  },
  "BA380": {
    "name": "FLEXIPADS 75mm COTTON Metal High Gloss Finish Ball",
    "source": "",
    "target": [
      "Detailing",
      "Polerowanie lakieru",
      "Akcesoria polerskie"
    ]
  },
  "CO-390": {
    "name": "COLLINITE 390 Pre-wax Auto Polish lekko ścierny cleaner usuwa niewielkie rysy water spoty 473ml",
    "source": "",
    "target": [
      "Detailing",
      "Przygotowanie lakieru"
    ]
  },
  "CO-415": {
    "name": "COLLINITE 415 Color Up Prewax Auto Cleaner do oczyszczania lakieru 473ml",
    "source": "",
    "target": [
      "Detailing",
      "Przygotowanie lakieru"
    ]
  },
  "CO-435": {
    "name": "COLLINITE 435 Streak Fixer usuwa smugi water spoty plamy 473ml",
    "source": "",
    "target": [
      "Detailing",
      "Przygotowanie lakieru"
    ]
  },
  "CQPERL-500": {
    "name": "CAR PRO Perl do pielęgnacji skóry opon plastiku winylu gumy 500ml 0,5l",
    "source": "",
    "target": [
      "Detailing",
      "Plastiki zewnętrzne i elementy gumowe",
      "Pielęgnacja"
    ]
  },
  "FTWL_FPRYZM": {
    "name": "Podkładki pryzmowe regulacja belki FTWL BMW E21 E30 E32 E34 E36 Compact",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Śruby i akcesoria"
    ]
  },
  "GT-EXT2KG": {
    "name": "Ręczna gaśnica proszkowa GT2i 2kg",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Wyposażenie wnętrza i kierowcy",
      "Gaśnice i systemy gaśnicze"
    ]
  },
  "GT-T3X6-STRUCT-ALU": {
    "name": "GT2I Pro Aluminium Structure Only for Foldable Tent 3x6m",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Akcesoria warsztatowe"
    ]
  },
  "HS15541": {
    "name": "Naklejka Purelux Białe Logo 120 x 18 mm",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Upominki i gadżety"
    ]
  },
  "IOD-158": {
    "name": "Wiązka TCU-8HP-Y61 IOD Performance Nissan Patrol",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Elektronika",
      "Wtyczki"
    ]
  },
  "JRSPEC-WSP-100-B": {
    "name": "Wsporniki dyfuzora, splittera, lotki JRspec 100mm Czarny",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "JRSPEC-WSP-100-N": {
    "name": "Wsporniki dyfuzora, splittera, lotki JRspec 100mm Niebieski",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "JRSPEC-WSP-100-R": {
    "name": "Wsporniki dyfuzora, splittera, lotki JRspec 100mm Czerwony",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "JRSPEC-WSP-100-S": {
    "name": "Wsporniki dyfuzora, splittera, lotki JRspec 100mm Srebrny",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "JRSPEC-WSP-150-B": {
    "name": "Wsporniki dyfuzora, splittera, lotki JRspec 150mm Czarny",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "JRSPEC-WSP-150-N": {
    "name": "Wsporniki dyfuzora, splittera, lotki JRspec 150mm Niebieski",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "JRSPEC-WSP-150-R": {
    "name": "Wsporniki dyfuzora, splittera, lotki JRspec 150mm Czerwony",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "JRSPEC-WSP-150-S": {
    "name": "Wsporniki dyfuzora, splittera, lotki JRspec 150mm Srebrny",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "JRSPEC-WSP-200-N": {
    "name": "Wsporniki dyfuzora, splittera, lotki JRspec 200mm Niebieski",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "JRSPEC-WSP-200-R": {
    "name": "Wsporniki dyfuzora, splittera, lotki JRspec 200mm Czerwony",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "JRSPEC-WSP-200-S": {
    "name": "Wsporniki dyfuzora, splittera, lotki JRspec 200mm Srebrny",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "KCA409": {
    "name": "SUBARU IMPREZA 9/07-8/10",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Mocowania amortyzatorów"
    ]
  },
  "KFI24614": {
    "name": "KIT STD FIAT DOBLO 2.0L inc DMF+CSC - KFI24614",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Sprzęgło",
      "Zestawy sprzęgła"
    ]
  },
  "KJE28006": {
    "name": "Spigot Bush/Bearing - KJE28006",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Sprzęgło",
      "Clutch bearings"
    ]
  },
  "KSU23512-1A": {
    "name": "Heavy Duty Organic - KSU23512-1A",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Sprzęgło",
      "Zestawy sprzęgła"
    ]
  },
  "KSU23512-1B": {
    "name": "Heavy Duty Sprung Ceramic - KSU23512-1B",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Sprzęgło",
      "Zestawy sprzęgła"
    ]
  },
  "KSU23512-1C": {
    "name": "Heavy Duty Cushioned Ceramic - KSU23512-1C",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Sprzęgło",
      "Zestawy sprzęgła"
    ]
  },
  "MG1-FRD006": {
    "name": "Ford Mustang S550",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zawieszenie gwintowane"
    ]
  },
  "MG1-FRD008": {
    "name": "Focus RS 2016+",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zawieszenie gwintowane"
    ]
  },
  "MG1-SUB001": {
    "name": "Impreza WRX GD 5X100",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zawieszenie gwintowane"
    ]
  },
  "MG1-SUB002": {
    "name": "Impreza WRX GD 5X100",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zawieszenie gwintowane"
    ]
  },
  "MG1-SUB004": {
    "name": "Impreza WRX GD 5X100",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zawieszenie gwintowane"
    ]
  },
  "MG1-SUB005": {
    "name": "SUBARU IMPREZA 2.5T WRX/2.5T WRX",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zawieszenie gwintowane"
    ]
  },
  "MG1-SUB006": {
    "name": "BRZ ZC / FRS ZN / GT-86",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zawieszenie gwintowane"
    ]
  },
  "MG1-SUB007": {
    "name": "Subaru VA WRX/STI",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zawieszenie gwintowane"
    ]
  },
  "MMHE-F80-15": {
    "name": "Wymiennik ciepła Mishimoto BMW F80 M3/M4 2015-2020",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ chłodzenia",
      "Chłodnice wody"
    ]
  },
  "MMOC-PF-10": {
    "name": "Filtr na przewód Mishimoto AN10",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ chłodzenia",
      "Filtry oleju"
    ]
  },
  "MMOC-PF-6": {
    "name": "Filtr na przewód Mishimoto AN6",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ chłodzenia",
      "Filtry oleju"
    ]
  },
  "TS-0205-2065": {
    "name": "Ford F150 2013-2016 Relocation Adapter Kit",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ dolotowy",
      "Blow off",
      "Akcesoria"
    ]
  },
  "TS-0205-3116": {
    "name": "AN3 Straight Nipple Replacement",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ dolotowy",
      "Blow off",
      "Akcesoria"
    ]
  },
  "TS-0223-3011": {
    "name": "TS-0223-3011",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ dolotowy",
      "Blow off",
      "Akcesoria"
    ]
  },
  "TS-0223-3017": {
    "name": "TS-0223-3017",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ dolotowy",
      "Blow off",
      "Akcesoria"
    ]
  },
  "TS-0223-3019": {
    "name": "TS-0223-3019",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ dolotowy",
      "Blow off",
      "Akcesoria"
    ]
  },
  "TS-0550-3050": {
    "name": "Nypel adapter Turbosmart 1/8 NPT AN3 stal nierdzewna",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0550-3051": {
    "name": "Nypel adapter Turbosmart 1/8 NPT AN4 stal nierdzewna",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0550-3053": {
    "name": "Nypel adapter Turbosmart prosty 1/8 NPT Pushloc 1/4 stal nierdzewna",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0550-3054": {
    "name": "Nypel adapter Turbosmart 90' 1/8 NPT Pushloc 1/4 stal nierdzewna",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0550-3055": {
    "name": "Nypel adapter Turbosmart t-piece 1/8 NPT Pushloc 1/4 stal nierdzewna",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0600-3005": {
    "name": "6.3mm x 100mm 1/4\" UNF Clevis\"",
    "source": "Produkty bez kategorii",
    "target": [
      "Silnik i turbo",
      "Turbosprężarki",
      "Aktuatory"
    ]
  },
  "TS-0600-3006": {
    "name": "6.3mm x 125mm 1/4\" UNF Clevis\"",
    "source": "Produkty bez kategorii",
    "target": [
      "Silnik i turbo",
      "Turbosprężarki",
      "Aktuatory"
    ]
  },
  "TS-0600-3007": {
    "name": "6.3mm x 80mm M6 Clevis",
    "source": "Produkty bez kategorii",
    "target": [
      "Silnik i turbo",
      "Turbosprężarki",
      "Aktuatory"
    ]
  },
  "TS-0600-3008": {
    "name": "6.3mm x 100mm M6 Clevis",
    "source": "Produkty bez kategorii",
    "target": [
      "Silnik i turbo",
      "Turbosprężarki",
      "Aktuatory"
    ]
  },
  "TS-0600-3009": {
    "name": "6.3mm x 125mm M6 Clevis",
    "source": "Produkty bez kategorii",
    "target": [
      "Silnik i turbo",
      "Turbosprężarki",
      "Aktuatory"
    ]
  },
  "USA-RAD-17-0011": {
    "name": "T4E Header Set for Lotus 2ZZ-GE 06+ Radium Engineering",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Układ wydechowy",
      "Kolektory wydechowe"
    ]
  },
  "VWR190006": {
    "name": "RacingLine Billet Oil Dipstick for EA855 2.5 TFSI DAZA DAZC DNWA DXHA",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Układ chłodzenia",
      "Bagnety oleju"
    ]
  },
  "VWR190008": {
    "name": "RacingLine Billet Oil Dipstick for Audi VW 1.0 TSI 1.4 TSI EA211",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Układ chłodzenia",
      "Bagnety oleju"
    ]
  },
  "VWR19G701": {
    "name": "RacingLine Billet Oil Dipstick for 1.8 2.0 TSI EA888.3 2.0 TSI EA888.4",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Układ chłodzenia",
      "Bagnety oleju"
    ]
  },
  "VWR810000": {
    "name": "Racingline Rear Wiper Delete for Audi A3 S3 VW Golf Tiguan EA113 EA888",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "VWR810002": {
    "name": "Racingline Hood Gas Strut for Volkswagen VW Golf MK8",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Pozostałe",
      "Części nadwozia"
    ]
  },
  "W44040": {
    "name": "BMW 3 SERIES 5/83-3/91",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Mocowania amortyzatorów"
    ]
  },
  "WF136_100A": {
    "name": "Rear Lower Link Wisefab WF136_100A",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Wahacze regulowane i drążki"
    ]
  },
  "WF136UP_100A": {
    "name": "Rear Upper Link Wisefab WF136UP_100A",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Wahacze regulowane i drążki"
    ]
  },
  "WF140_500RA": {
    "name": "Front V2 Top Mount Right Wisefab WF140_500RA",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Mocowania amortyzatorów"
    ]
  },
  "WF360_500A": {
    "name": "Top Mount Wisefab WF360_500A",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Mocowania amortyzatorów"
    ]
  },
  "WF366_600A": {
    "name": "Rear Toelink Mount Wisefab WF366_600A",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Wahacze regulowane i drążki"
    ]
  },
  "WF451_100LA": {
    "name": "Rear Knuckle Left Wisefab WF451_100LA",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zwrotnice"
    ]
  },
  "WF451_100RA": {
    "name": "Rear Knuckle Right Wisefab WF451_100RA",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zwrotnice"
    ]
  },
  "WF860_500RA": {
    "name": "Front Top Mount Right Wisefab WF860_500RA",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Mocowania amortyzatorów"
    ]
  },
  "WF8611_710LA": {
    "name": "Rear Knuckle Add-On Left Wisefab WF8611_710LA",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zwrotnice"
    ]
  },
  "WF8611_710RA": {
    "name": "Rear Knuckle Add-On Right Wisefab WF8611_710RA",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zwrotnice"
    ]
  },
  "WFE82_500A": {
    "name": "Front Top Mount Wisefab WFE82_500A",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Mocowania amortyzatorów"
    ]
  },
  "WINTERS-2943-31": {
    "name": "Output Flange Corvette-Style 2943-31",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Dyferencjały Winters"
    ]
  },
  "WINTERS-5840": {
    "name": "Aluminum Housing Center Section 5840",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Dyferencjały Winters"
    ]
  },
  "WINTERS-7398": {
    "name": "Steel Ball Gear Cover Stud 5/16” Diameter 7398",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Dyferencjały Winters"
    ]
  },
  "Winters-8252BL": {
    "name": "Billet Gear Cover SR8252B",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Dyferencjały Winters"
    ]
  },
  "WSK-FRD003": {
    "name": "FORD FOCUS HATCHBACK+SEDAN 1.5+1.6 ECOBOOST/1.5+1.6TDCi",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-FRD004": {
    "name": "FORD FOCUS HATCHBACK 2.0ST",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-FRD005": {
    "name": "Mustang GT S197",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-FRD006": {
    "name": "FORD MUSTANG S550 FASTBACK/CONVERTIBLE GT 5.0 V8",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-FRD007": {
    "name": "FORD MUSTANG S550 FASTBACK/CONVERTIBLE 2.3/3.7 V6",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-FRD008": {
    "name": "Focus RS 2016+",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-MAZ001": {
    "name": "MAZDA MX5 1.8/2.0 + ROADSTER - COUPE",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-MAZ002": {
    "name": "MIATA ND",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-MIT001": {
    "name": "MITSUBISHI LANCER SEDAN+SPORTBACK 1.8",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-MIT002": {
    "name": "MITSUBISHI LANCER EVOLUTION MR",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-NIS001": {
    "name": "NISSAN 350Z ROADSTER + COUPE",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-OPL001": {
    "name": "OPEL ASTRA 1.6/1.8/1.7TD",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-OPL002": {
    "name": "OPEL ASTRA 5DR. 2.0T/1.7CDTi/1.9CDTi (not for IDS)",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-REN001": {
    "name": "RENAULT CLIO II SPORT 2.0 16V + FACELIFT",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-REN002": {
    "name": "RENAULT CLIO III HATCHBACK SPORT 2.0 CUP",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-REN003": {
    "name": "RENAULT CLIO III HATCHBACK SPORT FACELIFT 2.0 CUP",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-SUB001": {
    "name": "SUBARU IMPREZA 2.0T WRX",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-SUB002": {
    "name": "SUBARU IMPREZA + STATIONWAGON",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-SUB004": {
    "name": "SUBARU IMPREZA 2.5 WRX",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-SUB005": {
    "name": "SUBARU IMPREZA 2.5T WRX/2.5T WRX",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-SUB006": {
    "name": "BRZ ZC / FRS ZN / GT-86",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-SUB007": {
    "name": "STI - VA",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-SUB008": {
    "name": "WRX - VA",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-VWN001": {
    "name": "V/W GOLF V 1.4TSi/2.0FSi/1.6TDi/1.9TDi/2.0SDi",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-VWN002": {
    "name": "V/W GOLF V 2.0 GTi",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-VWN003": {
    "name": "V/W GOLF VI 2.0TSi GTi",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-VWN004": {
    "name": "V/W POLO 1.4TSi Blue GT/1.4TSi GTi/1.8TSi GTi",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-VWN005": {
    "name": "V/W GOLF VII HATCHBACK GTi/GTD",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "WSK-VWN006": {
    "name": "VW GOLF VII HATCHBACK R",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  },
  "BMC01": {
    "name": "Wiązka do kontrolera PWM - moduł Varex",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Przepustnica wydechu"
    ]
  },
  "MMFT-16ORB-34BK": {
    "name": "Nypel Mishimoto AN16ORB na 3/4\" Aluminiowy Czarny",
    "source": "Produkty bez kategorii",
    "target": [
      "Pozostałe",
      "Złączki i uszczelnienia"
    ]
  },
  "MMFT-CHKVLV-34": {
    "name": "Zawór jednokierunkowy Mishimoto 3/4\" (19mm)",
    "source": "Produkty bez kategorii",
    "target": [
      "Pozostałe",
      "Złączki i uszczelnienia"
    ]
  },
  "MZR-HEADRAIN-RB": {
    "name": "Adapter Spływu Głowicy MZR Garage Nissan Skyline Stagea RB20 RB25 RB26",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Układ chłodzenia",
      "Adaptery układu smarowania"
    ]
  },
  "RTMG-901-0536": {
    "name": "Konwenter ciśnienia skrzynka próżniowa RTMG Performance dla VW Golf MK5 1.4 TSI",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Silnik i turbo",
      "Turbosprężarki",
      "Dodatki"
    ]
  },
  "RTMG-901-0711": {
    "name": "RTMG Performance DSG DQ200 Original Mechatronic Repair Set",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Części skrzyni biegów"
    ]
  },
  "THOR-ECHO": {
    "name": "Additional component ECHO Thor",
    "source": "Pozostałe > Pozostałe",
    "target": [
      "Układ wydechowy",
      "Elektroniczne systemy wydechowe"
    ]
  },
  "TS-0401-3006": {
    "name": "FPR/OPR Mounting Bracket/Clip Replacement",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ paliwowy",
      "Regulatory ciśnienia paliwa",
      "Akcesoria"
    ]
  },
  "TS-0505-2007": {
    "name": "1/16NPT Male-1/8NPT Female Fit",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0505-2008": {
    "name": "1/16NPT Male - -3AN Flare Fit",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0505-2009": {
    "name": "1/16NPT Male - -4AN Flare fit",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0505-3007": {
    "name": "74mm Locking Collar",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0505-3008": {
    "name": "74mm Collar Tool",
    "source": "Produkty bez kategorii",
    "target": [
      "Pozostałe",
      "Akcesoria warsztatowe"
    ]
  },
  "TS-0505-3009": {
    "name": "1/16NPT 6mm Hose Tail Fittings + Blanks",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0550-3008": {
    "name": "6mm Hose Tail Fittings & Blanks",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0550-3012": {
    "name": "Slave Collar / Heatshield",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-0550-3057": {
    "name": "Czujnik HE Turbosmart",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  },
  "TS-9001-1006": {
    "name": "TS Silicon Hose Gauge",
    "source": "Produkty bez kategorii",
    "target": [
      "Układ dolotowy",
      "Łączniki silikonowe",
      "Przewody podciśnienia"
    ]
  },
  "USA-RAD-14-0291": {
    "name": "AN6 ORB to 8.5mm Barb Radium Engineering",
    "source": "",
    "target": [
      "Pozostałe",
      "Złączki i uszczelnienia"
    ]
  },
  "USA-RAD-18-0043": {
    "name": "O-Ring Multipack 6AN 8AN 10AN FKM Radium Engineering",
    "source": "",
    "target": [
      "Pozostałe",
      "Złączki i uszczelnienia"
    ]
  },
  "USA-RAD-18-0043-06": {
    "name": "O-Ring 5 Pack 6AN FKM Radium Engineering",
    "source": "",
    "target": [
      "Pozostałe",
      "Złączki i uszczelnienia"
    ]
  },
  "USA-RAD-18-0043-08": {
    "name": "O-Ring 5 Pack 8AN FKM Radium Engineering",
    "source": "",
    "target": [
      "Pozostałe",
      "Złączki i uszczelnienia"
    ]
  },
  "USA-RAD-18-0043-10": {
    "name": "O-Ring 5 Pack 10AN FKM Radium Engineering",
    "source": "",
    "target": [
      "Pozostałe",
      "Złączki i uszczelnienia"
    ]
  },
  "WF229_100A": {
    "name": "Front E90 Steering Rack Conversion Kit Wisefab WF229_100A",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Elementy układu kierowniczego"
    ]
  },
  "WF346_100A": {
    "name": "Rear Knuckle Front Bushing Wisefab WF346_100A",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Zwrotnice"
    ]
  },
  "WF359_120A": {
    "name": "Front Rack Relocation Jig Assembly Wisefab WF359_120A",
    "source": "",
    "target": [
      "Pozostałe",
      "Akcesoria warsztatowe"
    ]
  },
  "WF366_800": {
    "name": "Rear Skid Plate Wisefab WF366_800",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Śruby i akcesoria"
    ]
  },
  "WF700_907": {
    "name": "ID20 OD35 Spherical Bearing Housing M16x1.5 Wisefab WF700_907",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Śruby i akcesoria"
    ]
  },
  "WF809_100A": {
    "name": "Front E90 Steering Rack Conversion Kit Wisefab WF809_100A",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Elementy układu kierowniczego"
    ]
  },
  "WF860_700A_LHD": {
    "name": "Front Steering Rack Support Left Wisefab WF860_700A_LHD",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Elementy układu kierowniczego"
    ]
  },
  "WF860_840A": {
    "name": "Front GT86 IS Rack Insert Assembly Wisefab WF860_840A",
    "source": "",
    "target": [
      "Napęd i zawieszenie",
      "Elementy układu kierowniczego"
    ]
  },
  "WFR80_400A": {
    "name": "Front Steering Rack Template Wisefab WFR80_400A",
    "source": "",
    "target": [
      "Pozostałe",
      "Akcesoria warsztatowe"
    ]
  },
  "WFR80_400A-RHD": {
    "name": "Front Steering Rack Template RHD Right Wisefab WFR80_400A-RHD",
    "source": "",
    "target": [
      "Pozostałe",
      "Akcesoria warsztatowe"
    ]
  }
};
export function mapFmicProductCategory(sourcePath:string,name:string,sku?:string):FmicCategoryMatch{
 const match=mapFmicCategory(sourcePath);
 const reviewed=sku&&Object.prototype.hasOwnProperty.call(reviewedProducts,sku)?reviewedProducts[sku]:undefined;
 if(reviewed&&key(reviewed.name)===key(name)&&reviewed.source===sourcePath&&['unmapped','parent_review'].includes(match.status)){
  const validated=mapFmicCategory(reviewed.target.join(' > '));
  if(validated.status==='exact')return {...validated,sourcePath,status:'normalized'};
 }
 if(match.status!=='unmapped'||!['','default category','produkty bez kategorii'].includes(key(sourcePath)))return match;
 const title=key(name);
 let path:string[]|undefined;
 if(/^zestaw sprzęgła(?:\s|$)/u.test(title))path=['Napęd i zawieszenie','Sprzęgło','Zestawy sprzęgła'];
 else if(/^dystanse (?:przykręcane|przelotowe)(?:\s|$)/u.test(title))path=['Hamulce i koła','Dystanse kół'];
 else if(/^xtreme flywheel(?:\s|$)/u.test(title))path=['Napęd i zawieszenie','Sprzęgło','Koła zamachowe'];
 else if(/^sprzęgło xtreme clutch(?:\s|$)/u.test(title))path=['Napęd i zawieszenie','Sprzęgło'];
 else if(/^zestaw zawieszenia b12(?:\s|$)/u.test(title))path=['Napęd i zawieszenie','Amortyzatory i sprężyny'];
 if(!path){
  const rules:[string,string[]][]=[
  [
    "^(?:kompletny zestaw sprzęgła|clutch kit|clutck kit|kit including (?:dual mass |single mass )?flywheel)",
    [
      "Napęd i zawieszenie",
      "Sprzęgło",
      "Zestawy sprzęgła"
    ]
  ],
  [
    "^(?:koło zamachowe|(?:lightweight chromoly|chromoly|ductile iron) flywheel|flywheel|f/w cast iron)\\b",
    [
      "Napęd i zawieszenie",
      "Sprzęgło",
      "Koła zamachowe"
    ]
  ],
  [
    "przewód sprzęgła hel",
    [
      "Napęd i zawieszenie",
      "Sprzęgło",
      "Przewody sprzęgła"
    ]
  ],
  [
    "^(?:\\d+mm )?xtreme (?:heavy duty|outback|performance|race|xtra heavy duty|multi plate)",
    [
      "Napęd i zawieszenie",
      "Sprzęgło"
    ]
  ],
  [
    "^(?:kute tłoki|tłoki (?:manley|silnika wiseco))",
    [
      "Silnik i turbo",
      "Kute tłoki"
    ]
  ],
  [
    "^(?:wyczynowe szpilki głowicy|śruby korbowodów arp)",
    [
      "Silnik i turbo",
      "Śruby i szpilki ARP"
    ]
  ],
  [
    "^pasek rozrządu",
    [
      "Silnik i turbo",
      "Rozrząd",
      "Paski rozrządu"
    ]
  ],
  [
    "^listwa paliwowa",
    [
      "Układ paliwowy",
      "Listwy paliwowe"
    ]
  ],
  [
    "^zestaw wtryskiwaczy",
    [
      "Układ paliwowy",
      "Wtryskiwacze"
    ]
  ],
  [
    "^wkład filtra paliwa",
    [
      "Układ paliwowy",
      "Filtry paliwa",
      "Wkłady filtrów"
    ]
  ],
  [
    "^turbine housing turbosmart",
    [
      "Silnik i turbo",
      "Turbosprężarki",
      "Muszle wydechowe"
    ]
  ],
  [
    "^turbosprężarka pulsar",
    [
      "Silnik i turbo",
      "Turbosprężarki",
      "Turbosprężarki tuningowe"
    ]
  ],
  [
    "^turbosmart .*turbocharger (?:gasket|.*weld flange)",
    [
      "Silnik i turbo",
      "Turbosprężarki",
      "Flansze i uszczelki"
    ]
  ],
  [
    "^ts-1 turbocharger v-band clamp",
    [
      "Silnik i turbo",
      "Turbosprężarki",
      "Dodatki"
    ]
  ],
  [
    "^(?:membrana aktuatora iwg|genv iwg spring replacement)",
    [
      "Silnik i turbo",
      "Turbosprężarki",
      "Aktuatory"
    ]
  ],
  [
    "^(?:membrana wastegate|króćce wastegate|gen-?v wg\\d+.*(?:replacement|valve|collar)|wg\\d+.*(?:replacement|collar))",
    [
      "Układ wydechowy",
      "Wastegate",
      "Akcesoria"
    ]
  ],
  [
    "^(?:wastegate turbosmart|gas valve actuator turbosmart)",
    [
      "Układ wydechowy",
      "Wastegate"
    ]
  ],
  [
    "^(?:adapter flansza blow off|flansza blow off)",
    [
      "Układ dolotowy",
      "Blow off",
      "Adaptery Blow off"
    ]
  ],
  [
    "^(?:membrana blow off|zestaw o-ringów blow off|zestaw sprężyn blow off|turbosmart bov .*replacement|bov .*replacement|bov .*upgrade)",
    [
      "Układ dolotowy",
      "Blow off",
      "Akcesoria"
    ]
  ],
  [
    "^blow off bov turbosmart.*(?:boostgate|ebg)",
    [
      "Układ wydechowy",
      "Wastegate"
    ]
  ],
  [
    "^blow off bov turbosmart",
    [
      "Układ dolotowy",
      "Blow off"
    ]
  ],
  [
    "^(?:flansza wydechowa|uszczelka wydechu)",
    [
      "Układ wydechowy",
      "Flansze i uszczelki"
    ]
  ],
  [
    "^flansza egr",
    [
      "Silnik i turbo",
      "Flansze EGR"
    ]
  ],
  [
    "^downpipe ",
    [
      "Układ wydechowy",
      "Downpipe"
    ]
  ],
  [
    "^układ wydechowy xforce",
    [
      "Układ wydechowy",
      "Kompletne układy wydechowe"
    ]
  ],
  [
    "^tłumik dedykowany",
    [
      "Układ wydechowy",
      "Tłumiki sportowe",
      "Tłumiki dedykowane"
    ]
  ],
  [
    "^tłumik przelotowy",
    [
      "Układ wydechowy",
      "Tłumiki sportowe",
      "Tłumiki przelotowe"
    ]
  ],
  [
    "^tłumik (?:okrągły|owalny)",
    [
      "Układ wydechowy",
      "Tłumiki sportowe"
    ]
  ],
  [
    "^x-pipe ",
    [
      "Układ wydechowy",
      "X-Pipe i Y-Pipe"
    ]
  ],
  [
    "^(?:chłodnica oleju skrzyni|zestaw chłodnicy oleju skrzyni)",
    [
      "Układ chłodzenia",
      "Chłodnice oleju",
      "Przekładniowe"
    ]
  ],
  [
    "^(?:chłodnica oleju|zestaw chłodnicy oleju silnikowego)",
    [
      "Układ chłodzenia",
      "Chłodnice oleju"
    ]
  ],
  [
    "^uniwersalna chłodnica wody",
    [
      "Układ chłodzenia",
      "Chłodnice wody"
    ]
  ],
  [
    "^zestaw przewodów silikonowych .*układ",
    [
      "Układ chłodzenia",
      "Przewody silikonowe"
    ]
  ],
  [
    "^oil pressure regulator turbosmart",
    [
      "Układ chłodzenia",
      "Regulator ciśnienia oleju"
    ]
  ],
  [
    "^(?:dedykowany układ dolotowy|dolot powietrza greddy)",
    [
      "Układ dolotowy",
      "Filtry powietrza",
      "Dedykowane zestawy dolotowe"
    ]
  ],
  [
    "^(?:sportowy filtr powietrza|filtr powietrza)",
    [
      "Układ dolotowy",
      "Filtry powietrza"
    ]
  ],
  [
    "^(?:sportfah?rwerk b12|zestaw sprężyn pro-kit|sprężyna pojedyncza|pro-kit )",
    [
      "Napęd i zawieszenie",
      "Amortyzatory i sprężyny"
    ]
  ],
  [
    "(?:control arm|suspension arm|tie rod).*wisefab",
    [
      "Napęd i zawieszenie",
      "Wahacze regulowane i drążki"
    ]
  ],
  [
    "drift angle lock kit.*wisefab",
    [
      "Napęd i zawieszenie",
      "Zestawy skrętu"
    ]
  ],
  [
    "czujnik zużycia klocków hamulcowych",
    [
      "Hamulce i koła",
      "Pozostałe"
    ]
  ],
  [
    "^sparco .*harness",
    [
      "Wyposażenie wnętrza i kierowcy",
      "Pasy bezpieczeństwa"
    ]
  ],
  [
    "ręcznik z mikrofibry do osuszania",
    [
      "Detailing",
      "Akcesoria",
      "Ręczniki do osuszania"
    ]
  ],
  [
    "^flexipads .*futro polerskie",
    [
      "Detailing",
      "Polerowanie lakieru",
      "Futra polerskie"
    ]
  ],
  [
    "^flexipads .*gąbka polerska",
    [
      "Detailing",
      "Polerowanie lakieru",
      "Pady polerskie"
    ]
  ],
  [
    "^flexipads .*applicators",
    [
      "Detailing",
      "Akcesoria",
      "Aplikatory"
    ]
  ],
  [
    "^orange mamba nitrile gloves",
    [
      "Pozostałe",
      "Rękawiczki ochronne"
    ]
  ]
];
  rules.push(...([["^filtr oleju greddy",["Układ chłodzenia","Filtry oleju"]],["^billet turbo oil feed filter",["Układ chłodzenia","Filtry oleju"]],["(?:outer cv joint assembly|halfshaft kit).*wisefab",["Napęd i zawieszenie","Półosie i przeguby"]],["^adapter wtryskiwacza",["Układ paliwowy","Wtryskiwacze"]],["^oem fuel rail adapter fittings",["Układ paliwowy","Listwy paliwowe"]],["^czujnik ciśnienia paliwa",["Elektronika","Wskaźniki","Czujniki"]],["^fpr injector holder",["Układ paliwowy","Wtryskiwacze"]],["^(?:fpr mounting bracket|mocowanie regulatora ciśnienia paliwa)",["Układ paliwowy","Regulatory ciśnienia paliwa","Akcesoria"]],["^(?:elektroniczny boost kontroler|eb2 .*replacement head unit|ebs head unit replacement)",["Elektronika","Zawory EBC i N75"]],["^gauge electric egt",["Elektronika","Wskaźniki"]],["^(?:estraight gate replacement sensor|gen-v e-gate motor replacement|genv egate sensor replacement|gen-v .*diaphragm replacement tool|gen-v spring change assistance|gen-v wg45 inlet v-band|wg 35 psi conversion kit)",["Układ wydechowy","Wastegate","Akcesoria"]],["^turbosmart .*bg50 boostgate (?:trumpet|aluminium weld flange)",["Układ wydechowy","Wastegate","Akcesoria"]],["^turbosmart .* (?:turbo mount|oil drain|extended oil drain)",["Silnik i turbo","Turbosprężarki","Dodatki"]],["^clevis suit iwg75|^iwg75 evo hood kit",["Silnik i turbo","Turbosprężarki","Aktuatory"]],["^bov (?:60mm trumpet replace|ford f150 .*map adapter|race port v-band|universal cel plug)",["Układ dolotowy","Blow off","Akcesoria"]],["^bov power port w/ sensor cap",["Układ dolotowy","Blow off"]],["^nyple do oil catch tank",["Układ dolotowy","Oil catch tank","Akcesoria"]],["^rtmg performance .*flywheel",["Napęd i zawieszenie","Sprzęgło","Koła zamachowe"]],["^rtmg performance .*clutch kit",["Napęd i zawieszenie","Sprzęgło","Zestawy sprzęgła"]],["^rtmg performance .*clutch pack",["Napęd i zawieszenie","Sprzęgło"]],["^complete (?:conversion incl smf|kit incl dmf)",["Napęd i zawieszenie","Sprzęgło","Zestawy sprzęgła"]],["^clutch alignment tool",["Pozostałe","Akcesoria warsztatowe"]],["^clutch pro -",["Napęd i zawieszenie","Sprzęgło"]],["^sportfahwerk b12",["Napęd i zawieszenie","Amortyzatory i sprężyny"]],["^winters .*wałek dyferencjału",["Napęd i zawieszenie","Dyferencjały Winters"]],["^adbl hybrid glass",["Detailing","Pielęgnacja szyb","Mycie szyb"]],["^adbl vampire liquid",["Detailing","Felgi i opony","Mycie felg"]],["^adbl puffy towel",["Detailing","Akcesoria","Ręczniki do osuszania"]],["^adbl caremitt|^flexipads .*wash.*mitt",["Detailing","Akcesoria","Rękawice i gąbki"]],["^car pro ceriglass",["Detailing","Pielęgnacja szyb"]],["^car pro cquartz",["Detailing","Zabezpieczenie lakieru","Powłoki ceramiczne i kwarcowe"]],["^car pro reset szampon|^collinite .*szampon",["Detailing","Mycie samochodu","Szampony"]],["^collinite .*powłoka ceramiczna",["Detailing","Zabezpieczenie lakieru","Powłoki ceramiczne i kwarcowe"]],["^collinite .*quick detailer",["Detailing","Zabezpieczenie lakieru","Quick detailery"]],["^collinite .*metal wax",["Detailing","Metal i chrom"]],["^collinite .*leather and vinyl wax",["Detailing","Czyszczenie i pielęgnacja wnętrza"]],["^collinite .*dressing do opon|^finish kare .*tire dressing",["Detailing","Felgi i opony","Dressingi do opon"]],["^collinite .* (?:auto wax|cleaner wax|insulator wax|fleetwax|carnauba paste wax)",["Detailing","Zabezpieczenie lakieru","Woski i sealanty"]],["^flexipads .*talerz mocujący|^flexipads .*backing pad|^flexipads .*polishing ball",["Detailing","Polerowanie lakieru","Akcesoria polerskie"]],["^(?:menzerna .*ściereczka z mikrofibry|cobra .*microfiber)",["Detailing","Akcesoria"]],["^nextzett .*gummi pflege",["Detailing","Plastiki zewnętrzne i elementy gumowe","Pielęgnacja"]]] as [string,string[]][]));
  path=rules.find(([pattern])=>new RegExp(pattern,'u').test(title))?.[1];
 }
 if(!path)return match;
 const validated=mapFmicCategory(path.join(' > '));
 return validated.status==='exact'?{...validated,sourcePath,status:'normalized'}:match;
}
