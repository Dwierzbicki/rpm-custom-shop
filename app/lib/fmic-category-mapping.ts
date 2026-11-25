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
export function mapFmicProductCategory(sourcePath:string,name:string):FmicCategoryMatch{
 const match=mapFmicCategory(sourcePath);
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
