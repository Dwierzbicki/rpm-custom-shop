// Reference-only pilot. A source position identifies a part, not necessarily every individual hole.
export const families = [
 {name:'BMW M50 NV', versions:['M50B20','M50B25']},
 {name:'BMW M50 VANOS', versions:['M50B20TU','M50B25TU']},
 {name:'BMW M52', versions:['M52B20','M52B25','M52B28']},
 {name:'BMW M52TU', versions:['M52B20TU','M52B25TU','M52B28TU']},
 {name:'BMW M54', versions:['M54B22','M54B25','M54B30']},
 {name:'BMW S52', versions:['S52B32']},
 {name:'BMW S54', versions:['S54B32','S54B32 CSL']},
 {name:'Toyota 2JZ-GE', versions:['2JZ-GE Non-VVT-i','2JZ-GE VVT-i']},
 {name:'Toyota 2JZ-GTE', versions:['2JZ-GTE Non-VVT-i','2JZ-GTE VVT-i']},
] as const;
export type Localized={pl:string;en:string};
const l=(pl:string,en:string):Localized=>({pl,en});
export type Part={catalogStatus?:'discontinued';key?:string;unavailableReason?:Localized;unit?:'piece'|'set';oem:string;dimension:string;dimensionStatus?:'partial';name:Localized;sku?:string;technicalEvidence?:string};
export type Usage={partKey?:string;quantityUnit?:'piece'|'set';position:string;oem:string;quantity:number;location:Localized;mountingEvidence?:string;torque?:string;torqueSource?:string;replacement?:'always'|'inspect'|'not-applicable';hotspots?:{x:number;y:number}[]};
export type Diagram={profileId?:string;sourceId?:string;id:string;engine:string;vehicle:string;title:Localized;source:string;image?:{path:string;rightsEvidence:string};usages:Usage[]};
export const M54_REFERENCE_INDEX='https://www.realoem.com/bmw/en/partgrp?id=ET56-EUR-11-2001-E46-BMW-330i&mg=11';
const bolt=l('Śruba z podkładką','Bolt with washer');
const referenceParts:Part[]=[
 {oem:'07119905391',dimension:'M8 × 55-U1',name:bolt},
 {oem:'07119906675',dimension:'M8 × 70-Z1-ZNS3',name:bolt},
 {oem:'07119905696',dimension:'M8 × 100 – 8.8',name:l('Śruba sześciokątna','Hex bolt')},
 {oem:'32416852469',dimension:'M14 × 1,5 × 26',name:l('Śruba drążona','Hollow bolt')},
 {oem:'32411093596',dimension:'A14 × 20-CUSN',name:l('Pierścień uszczelniający','Sealing ring')},
 {oem:'07129904544',dimension:'M6 × 30-ZNNIV SI',name:l('Szpilka','Stud')},
 {oem:'07119942283',dimension:'5 H8 × 14',name:l('Kołek ustalający','Dowel pin')},
 {oem:'07119900486',dimension:'M6 × 32-Z1',name:bolt},
 {oem:'07119900487',dimension:'M6 × 62-Z1',name:bolt},
 {oem:'07119905739',dimension:'M8 × 22',name:bolt},
 {oem:'07119904524',dimension:'M6 × 16-U1-8.8',name:bolt},
 {oem:'07119905857',dimension:'M10 × 1-LH',name:l('Nakrętka z lewym gwintem','Left-hand-thread nut')},
 {oem:'11111740345',dimension:'M10 × 92',name:l('Śruba podpory wału','Main bearing cap bolt')},
 {oem:'11111703878',dimension:'M12 × 1,5',name:l('Korek gwintowany bloku','Threaded block plug')},
 {oem:'07119904539',dimension:'M14 × 1,5-ZNNIV',name:l('Korek spustowy płynu chłodniczego','Coolant drain plug')},
 {oem:'07119963200',dimension:'A14 × 18-AL',name:l('Podkładka aluminiowa korka płynu','Coolant drain plug aluminium washer')},
 {oem:'11121740065',dimension:'M10 × 110',unit:'set',name:l('Komplet śrub głowicy','Cylinder head bolt set')},
 {oem:'11127550856',dimension:'',name:l('Podkładka śruby głowicy','Cylinder head bolt washer')},
 {oem:'11121726397',dimension:'M6 × 50',name:l('Śruba Torx','Torx bolt')},
 {oem:'11247589671',dimension:'M9 × 47',name:l('Śruba korbowodu','Connecting rod bolt')},
 {oem:'11241280833',dimension:'7,5 × 11,2 mm',name:l('Kołek ustalający korbowodu','Connecting rod locating dowel')},
 {oem:'11137535106',dimension:'M12 × 16',name:l('Korek spustowy oleju','Oil drain plug')},
 {oem:'07119963151',dimension:'A12 × 17-CU',name:l('Podkładka uszczelniająca korka','Drain plug sealing washer')},
 {oem:'11121738607',dimension:'M6',name:l('Nakrętka pokrywy zaworów','Valve cover cap nut')},
 {oem:'11121738608',dimension:'M6',name:l('Nakrętka pokrywy zaworów','Valve cover cap nut')},
 {oem:'11127838077',dimension:'',name:l('Podkładka mocowania pokrywy','Valve cover mounting washer')},
 {oem:'11131740000',dimension:'M6; L do pomiaru / length pending',dimensionStatus:'partial',name:l('Śruba miski olejowej','Oil pan bolt'),technicalEvidence:'E46 330Ci M54 TIS 11 13 2AZ identifies oil-pan-to-block thread M6 and class 8.8; exact OEM bolt length not listed, verify specific position 05: https://workshop-manuals.com/bmw/3_series_e46/330ci_m54_conver/4_tightening_torques/11__engine_%28m54%29/13__oil_sump/2_azd__oil_pan/ ; 21 pieces with blank dimension: https://www.realoem.com/bmw/enUS/showparts?diagId=11_9918&id=AN56-EUR-03_2000_E46_BMW_330i'},
 {oem:'11131435807',dimension:'M6 × 64',name:l('Śruba z podkładką','Bolt with washer')},
 {oem:'11131435806',dimension:'M6 × 100',name:l('Śruba z podkładką','Bolt with washer')},
 {oem:'07119904992',dimension:'M8 × 20-U1-8.8',name:l('Śruba z podkładką','Bolt with washer')},
 {oem:'07119905544',dimension:'M6-8-ZNNIV SI',name:l('Nakrętka z podkładką','Nut with washer')},
 {oem:'11121720729',dimension:'M6 × 70',name:l('Śruba Torx','Torx bolt'),catalogStatus:'discontinued'},
 {oem:'11121720731',dimension:'M6 × 100',name:l('Śruba Torx','Torx bolt'),catalogStatus:'discontinued'},
 {oem:'11721742644',dimension:'',name:l('Nakrętka samohamowna','Self-locking nut')},
 {oem:'07129908132',dimension:'M8 × 35 – 8.8 ZN',name:l('Szpilka','Stud')},
 {oem:'07129903135',dimension:'M10 × 40',name:l('Szpilka','Stud')},
 {oem:'11111703836',dimension:'M24 × 1,5',name:l('Korek gwintowany','Threaded plug')},
 {"oem":"07119934460","dimension":"C22 × 1,5","name":{"pl":"Pierścień zabezpieczający sworzeń","en":"Piston pin circlip"}},
 {"oem":"11211720633","dimension":"M18 × 1,5; L do pomiaru / length pending","name":{"pl":"Centralna śruba wału","en":"Crankshaft central bolt"},"dimensionStatus":"partial","technicalEvidence":"BMW TIS E46 330i M54, 11 23 2AZ: M18×1.5, replace screw. https://workshop-manuals.com/bmw/3_series_e46/330i_m54_sal/4_tightening_torques/11__engine_%28m54%29/23__vibration_damper/1_azd__vibration_damper/ ; OEM identity and qty: https://www.realoem.com/bmw/enUS/showparts?diagId=11_9954&id=AN56-EUR-09-2001-E46-BMW-330i ; aftermarket FEBI 33619 listing gives overall length 138 mm and thread length 109 mm, not a confirmed OEM under-head length: https://www.auto-doc.ie/car-parts/oem/11211720633"},
 {"oem":"11231288660","dimension":"","name":{"pl":"Podkładka śruby centralnej","en":"Crankshaft bolt washer"}},
 {"oem":"11617545279","dimension":"M7","name":{"pl":"Nakrętka kołnierzowa","en":"Flange nut"}},
 {"oem":"07129901481","dimension":"M7 × 95","name":{"pl":"Szpilka łoża wałka","en":"Camshaft bearing ledge stud"}},
 {"oem":"07119951480","dimension":"5 × 6,5","name":{"pl":"Wpust czółenkowy","en":"Woodruff key"}},
 {"oem":"11311748817","dimension":"","name":{"pl":"Sworzeń prowadnicy rozrządu","en":"Timing guide bearing bolt"}},
 {"oem":"11311703718","dimension":"","name":{"pl":"Sworzeń szyny napinającej","en":"Tensioning rail bearing bolt"}},
 {"oem":"07119963418","dimension":"A26 × 31-AL","name":{"pl":"Pierścień uszczelniający napinacza","en":"Tensioner sealing washer"}},
 {"oem":"07129904553","dimension":"AM6-8-ZNNIV SI","name":{"pl":"Nakrętka z podkładką","en":"Nut with washer"}},
 {"oem":"11361748745","dimension":"","name":{"pl":"Śruba pasowana VANOS","en":"VANOS fit bolt"}},
 {"oem":"11361433513","dimension":"","name":{"pl":"Zaślepka VANOS","en":"VANOS blind plug"}},
 {"oem":"11361438338","dimension":"","name":{"pl":"Korek z pierścieniem uszczelniającym","en":"Screw plug with sealing ring"}},
 {"oem":"11121726238","dimension":"Ø 10,5 mm","name":{"pl":"Kołek ustalający","en":"Locating dowel"}},
 {"oem":"11117524470","dimension":"Ø 14,5 mm","name":{"pl":"Kołek ustalający","en":"Locating dowel"}},
 {"oem":"11121726243","dimension":"Ø 13,5 mm","name":{"pl":"Kołek ustalający","en":"Locating dowel"}},
 {"oem":"07119913975","dimension":"M6 × 28-Z1","name":{"pl":"Śruba z podkładką","en":"Bolt with washer"}},
 {"oem":"11141744147","dimension":"M8 × 32-Z1","name":{"pl":"Śruba z podkładką","en":"Bolt with washer"}},
 {"oem":"13627545338","dimension":"M6 × 16-ZNNIV SI","name":{"pl":"Śruba dyszy olejowej","en":"Oil jet screw"}},
 {"oem":"11111714541","dimension":"Ø 11,5 mm","name":{"pl":"Zaślepka bloku","en":"Block blind plug"}},
 {"oem":"07119904525","dimension":"M6 × 40-ZNNIV SI","name":{"pl":"Śruba z podkładką","en":"Bolt with washer"}},
 {"oem":"11311736326","dimension":"M6 × 20","name":{"pl":"Śruba Torx","en":"Torx bolt"}},
 {"oem":"11361436675","dimension":"M7×1 × 16 / M6×1 × 8 (ref.)","name":{"pl":"Szpilka koła wałka ssącego","en":"Intake sprocket stud"},"dimensionStatus":"partial","technicalEvidence":"OEM identity/3 pieces: https://www.realoem.com/bmw/enUS/showparts?diagId=11_9910&id=AW51-EUR---E46-BMW-330i ; supplier listing by exact OEM gives two threaded lengths and 10 mm hex but calls part exhaust rather than intake; dimensions provisional, verify actual OEM: https://www.pantritrading.com/bmw/bmw-m52-m54-engine-exhaust-vanos-timing-gear-stud-bolt-11361436675.html"},
 {"oem":"07119900910","dimension":"M6-10-PHR","name":{"pl":"Nakrętka sześciokątna","en":"Hex nut"}},
 {"oem":"07119904526","dimension":"M6 × 55-Z1","name":{"pl":"Śruba z podkładką","en":"Bolt with washer"}},
 {"oem":"11361432373","dimension":"M7 / M6; L do pomiaru / length pending","name":{"pl":"Szpilka koła wałka wydechowego","en":"Exhaust sprocket stud"},"dimensionStatus":"partial","technicalEvidence":"Supplier reproduction describes M7 cam end and M6 nut end; lengths and pitch not independently verified. https://www.probsten-tech.de/produkt/orig-m52tum54-stiftschraube-11361432373/ ; identity: https://www.realoem.com/bmw/enUS/showparts?diagId=11_9916&id=AW51-EUR---E46-BMW-330i"},
 {"oem":"11361432752","dimension":"M7 × 18","name":{"pl":"Śruba Torx","en":"Torx bolt"}},
 {"oem":"11341461405","dimension":"Ø 6 mm","name":{"pl":"Zamek zaworu","en":"Valve collet"}},
 {"oem":"11121713264","dimension":"Ø9,5 mm","name":{"pl":"Kołek ustalający","en":"Locating dowel"}},
 {"oem":"11121718856","dimension":"M7/M6 × 29,5","name":{"pl":"Szpilka redukcyjna pokrywy zaworów","en":"Stepped valve cover stud"},"catalogStatus":"discontinued"},
 {"oem":"07119937293","dimension":"Ø28 mm","name":{"pl":"Zaślepka głowicy","en":"Head plug"}},
 {"oem":"07119919031","dimension":"M24 × 1,5","name":{"pl":"Korek gwintowany","en":"Threaded plug"}},
 {"oem":"11127568039","dimension":"M8 × 1","name":{"pl":"Korek gwintowany","en":"Threaded plug"}},
 {"oem":"11121703712","dimension":"M18 × 1,5","name":{"pl":"Korek z uszczelnieniem","en":"Sealed plug"}},
 {"oem":"11121733403","dimension":"Ø22 mm","name":{"pl":"Zaślepka","en":"Plug"}},
 {"oem":"11121432349","dimension":"Ø18 mm","name":{"pl":"Zaślepka","en":"Plug"}},
 {"oem":"07119904393","dimension":"M10 × 1-ST-ZNS3","name":{"pl":"Korek gwintowany","en":"Threaded plug"}},
 {"oem":"11121427243","dimension":"Ø10 mm","name":{"pl":"Zaślepka","en":"Plug"}},
 {"oem":"11361436272","dimension":"","name":{"pl":"Szpilka zespołu VANOS","en":"VANOS assembly stud"}},
 {"oem":"11361436313","dimension":"M7","name":{"pl":"Nakrętka kołnierzowa","en":"Flange nut"}},
 {"oem":"07119934625","dimension":"21 × 1 mm","name":{"pl":"Pierścień zabezpieczający","en":"Retaining ring"}},
 {"oem":"11411703950","dimension":"","name":{"pl":"Tulejka dystansowa","en":"Spacer bush"},"catalogStatus":"discontinued"},
 {"oem":"11411722839","dimension":"","name":{"pl":"Kołek ustalający pompy","en":"Pump locating dowel"}},
 {"oem":"07119904517","dimension":"M6 × 12-U1-8.8","name":{"pl":"Śruba z podkładką","en":"Bolt with washer"}},
];
const u=(position:string,oem:string,quantity:number,pl:string,en:string):Usage=>({position,oem,quantity,location:l(pl,en)});
const referenceDiagrams:Diagram[]=[
 {id:'11_9921',engine:'M54B30',vehicle:'BMW E46 330i · AW51 EUR',title:l('Podstawa filtra oleju','Oil filter housing'),source:'https://www.realoem.com/bmw/enUS/showparts?diagId=11_9921&id=AW51-EUR---E46-BMW-330i',usages:[
  u('07','07119905391',3,'Mocowanie podstawy filtra oleju; grupa śrub 55 mm.','Oil filter housing mounting; 55 mm bolt group.'),
  u('08','07119906675',2,'Mocowanie podstawy filtra oleju; grupa śrub 70 mm.','Oil filter housing mounting; 70 mm bolt group.'),
  u('09','07119905696',1,'Mocowanie podstawy filtra oleju; śruba 100 mm.','Oil filter housing mounting; 100 mm bolt.'),
  u('10','32411093596',2,'Uszczelnienie połączenia przy śrubie drążonej.','Sealing rings at the hollow-bolt connection.'),
  u('11','32416852469',1,'Połączenie przewodu olejowego z podstawą filtra.','Oil line connection at the filter housing.'),
 ]},
 {id:'11_9907',engine:'M54B30',vehicle:'BMW E46 330i · AW51 EUR',title:l('Dolna obudowa rozrządu','Lower timing cover'),source:'https://www.realoem.com/bmw/enUS/showparts?diagId=11_9907&id=AW51-EUR---E46-BMW-330i',usages:[
  u('02','07129904544',4,'Szpilki dolnej obudowy rozrządu.','Lower timing cover studs.'),
  u('03','07119942283',2,'Ustalenie dolnej obudowy rozrządu.','Lower timing cover locating pins.'),
  u('07','07119900486',10,'Mocowanie dolnej obudowy rozrządu; grupa 32 mm.','Lower timing cover mounting; 32 mm group.'),
  u('08','07119900487',4,'Mocowanie dolnej obudowy rozrządu; grupa 62 mm.','Lower timing cover mounting; 62 mm group.'),
 ]},
 {id:'11_9953',engine:'M54B30',vehicle:'BMW E46 330i · AN56 EUR · 09/2001',title:l('Pompa oleju i napęd','Oil pump and drive'),source:'https://www.realoem.com/bmw/enUS/showparts?diagId=11_9953&id=AN56-EUR-09-2001-E46-BMW-330i',usages:[
  u('08','07119905739',1,'Zespół pompy oleju i smoka; pozycja 08.','Oil pump and pickup assembly; position 08.'),
  u('09','07119905391',3,'Zespół pompy oleju; pozycja 09, śruby 55 mm.','Oil pump assembly; position 09, 55 mm bolts.'),
  u('10','07119904524',3,'Zespół pompy oleju; pozycja 10, śruby 16 mm.','Oil pump assembly; position 10, 16 mm bolts.'),
  u('11','07119905857',1,'Mocowanie koła napędowego pompy oleju; lewy gwint.','Oil pump sprocket fastening; left-hand thread.'),
  {"position":"16","oem":"07119934625","quantity":1,"location":{"pl":"Zabezpieczenie w zespole zaworu pompy.","en":"Pump valve assembly retainer."}},
  {"position":"15","oem":"11411703950","quantity":1,"location":{"pl":"Zespół zaworu pompy; wymiar niepodany.","en":"Pump valve assembly; size not listed."}},
  {"position":"17","oem":"11411722839","quantity":1,"location":{"pl":"Kołek w zespole pompy; nie jest potwierdzeniem śrub jej pokrywy.","en":"Pump assembly dowel; does not establish cover bolt specification."}},
 ]},
 // Selected reference examples only, not a bulk copy of the source catalogue.
 {id:'11_9905',engine:'M54B30',vehicle:'BMW E46 330i · EN52 EUR · 05/2001',title:l('Blok silnika','Engine block'),source:'https://www.realoem.com/bmw/enUS/showparts?diagId=11_9905&id=EN52-EUR-05_2001_E46_BMW_330i',usages:[
  u('02','11111740345',14,'Mocowanie podpór łożysk głównych wału korbowego do bloku.','Main bearing cap fastening to the cylinder block.'),
  u('03','11111703878',2,'Gwintowane zamknięcie otworów bloku; dokładne otwory do weryfikacji.','Threaded closure of block openings; exact openings pending verification.'),
  u('04','07119904539',1,'Korek spustowy płynu chłodniczego w bloku; pozycja 04.','Block coolant drain plug; position 04.'),
  u('05','07119963200',1,'Podkładka uszczelniająca korka płynu; pozycja 05.','Coolant drain plug sealing washer; position 05.'),
  {"position":"06","oem":"11121726238","quantity":6,"location":{"pl":"Kołki zespołu bloku; nie sumować automatycznie z pokrywą tylną.","en":"Block locating dowels; do not automatically add rear cover quantities."}},
  {"position":"07","oem":"11117524470","quantity":2,"location":{"pl":"Kołki zespołu bloku; dokładne otwory do potwierdzenia.","en":"Block locating dowels; exact holes pending."}},
  {"position":"08","oem":"11121726243","quantity":2,"location":{"pl":"Kołki zespołu bloku; dokładne otwory do potwierdzenia.","en":"Block locating dowels; exact holes pending."}},
  u('09','07129908132',1,'Szpilka 35 mm zespołu bloku; dokładny otwór nieustalony.','35 mm stud in block assembly; exact hole unverified.'),
  u('10','07129903135',1,'Szpilka 40 mm zespołu bloku; dokładny otwór nieustalony.','40 mm stud in block assembly; exact hole unverified.'),
  u('11','11111703836',1,'Korek M24 w bloku; dokładny kanał do potwierdzenia.','M24 plug in block; exact passage pending.'),
  u('13','07119905739',16,'Mocowanie płyt wsporczych bloku; pozycja 13.','Block support plate fastening; position 13.'),
 ]},
 {id:'11_9908',engine:'M54B30',vehicle:'BMW E46 330i · AW51 EUR',title:l('Głowica i mocowania','Cylinder head fasteners'),source:'https://www.realoem.com/bmw/enUS/showparts?diagId=11_9908&id=AW51-EUR---E46-BMW-330i',usages:[
  {...u('05','11121740065',1,'Główne mocowanie głowicy do bloku. Jednostka katalogowa: komplet, nie jedna śruba.','Main cylinder head-to-block fastening. Catalogue unit: one set, not one bolt.'),quantityUnit:'set'},
  u('06','11127550856',14,'Podkładki pod główne śruby głowicy.','Washers under the main cylinder head bolts.'),
  u('07','11121726397',1,'Śruba M6×50 w zespole głowicy; dokładny otwór wymaga potwierdzenia.','M6×50 bolt in cylinder head assembly; exact hole pending verification.'),
  u('08','11121720729',1,'Śruba Torx 70 mm; dokładny otwór i następca OEM niepotwierdzone.','70 mm Torx bolt; exact hole and supersession unverified.'),
  u('09','11121720731',1,'Śruba Torx 100 mm; dokładny otwór i następca OEM niepotwierdzone.','100 mm Torx bolt; exact hole and supersession unverified.'),
  u('12','11721742644',2,'Nakrętki zespołu głowicy, poz. 12; dokładne połączenie do potwierdzenia.','Head assembly nuts, position 12; exact joint pending.'),
 ]},
 {id:'11_9913',engine:'M54B30',vehicle:'BMW E46 330i · ET56 EUR · 11/2001',title:l('Korbowody','Connecting rods'),source:'https://www.realoem.com/bmw/en/showparts?diagId=11_9913&id=ET56-EUR-11-2001-E46-BMW-330i',usages:[
  u('03','11241280833',12,'Ustalenie położenia stopy korbowodu; pozycja 03.','Connecting rod cap location; position 03.'),
  u('04','11247589671',12,'Mocowanie stopy korbowodu do korbowodu; 12 szt. według katalogu.','Connecting rod cap fastening; 12 pieces per catalogue.'),
 ]},
 {id:'11_9918',engine:'M54B30',vehicle:'BMW E46 330i · AN56 EUR · 03/2000',title:l('Miska olejowa','Oil pan'),source:'https://www.realoem.com/bmw/enUS/showparts?diagId=11_9918&id=AN56-EUR-03_2000_E46_BMW_330i',usages:[
  u('02','07129904544',3,'Szpilki zespołu miski olejowej; dokładne otwory do weryfikacji.','Oil pan assembly studs; exact holes pending verification.'),
  u('03','11137535106',1,'Gwintowany otwór spustowy miski olejowej.','Threaded oil pan drain opening.'),
  u('04','07119963151',1,'Uszczelnienie pod korkiem spustowym oleju.','Seal underneath the oil drain plug.'),
  u('05','11131740000',21,'Grupa mocowań miski, poz. 05; wymiar i otwory do potwierdzenia.','Oil pan fastener group, position 05; size and holes pending.'),
  u('06','11131435807',2,'Śruby 64 mm zespołu miski; otwory do potwierdzenia.','64 mm oil pan assembly bolts; holes pending.'),
  u('07','11131435806',2,'Śruby 100 mm zespołu miski; otwory do potwierdzenia.','100 mm oil pan assembly bolts; holes pending.'),
  u('13','07119904992',1,'Mocowanie zespołu rurki bagnetu; punkt do potwierdzenia.','Dipstick assembly fastening; exact point pending.'),
  u('16','07119905544',3,'Nakrętki zespołu czujnika poziomu oleju.','Oil level sensor assembly nuts.'),
 ]},
 {id:'11_9911',engine:'M54B30',vehicle:'BMW E46 330i · sedan EUR · wariant pokrywy do sprawdzenia',title:l('Pokrywa zaworów','Valve cover'),source:'https://bmwfans.info/parts-catalog/E46-Sedan/Europe/330i-M54/browse/engine/cylinder_head_cover/',usages:[
  u('05','11121738607',11,'Jedna grupa nakrętek M6 pokrywy; pozycja 05.','One group of M6 valve cover nuts; position 05.'),
  u('06','11127838077',15,'Podkładki mocowań pokrywy zaworów.','Valve cover mounting washers.'),
  u('08','11121738608',4,'Druga grupa nakrętek M6 pokrywy; pozycja 08.','Second group of M6 valve cover nuts; position 08.'),
 ]},
 {"id":"ref-pistons-2002","engine":"M54B30","vehicle":"BMW E46 330i · sedan USA · 2002 (rok modelowy)","title":{"pl":"Tłoki i sworznie","en":"Pistons and pins"},"source":"https://www.bmwpartsdeal.com/parts-list/2002-bmw-330i-sedan_e46/engine/crankshaft_pistons.html","usages":[{"position":"02","oem":"07119934460","quantity":12,"location":{"pl":"Zabezpieczenie sworzni; 2 na tłok.","en":"Piston pin retention; two per piston."}}]},
 {"id":"ref-crank-hub-2002","engine":"M54B30","vehicle":"BMW E46 330i · sedan USA · 2002 (rok modelowy)","title":{"pl":"Centralne mocowanie wału","en":"Crankshaft central fastening"},"source":"https://www.bmwpartsdeal.com/parts-list/2002-bmw-330i-sedan_e46/engine/belt_drive_vibration_damper.html","usages":[{"position":"02","oem":"11211720633","quantity":1,"location":{"pl":"Centralne mocowanie na czole wału; wymiar do potwierdzenia.","en":"Central fastener at crankshaft nose; dimensions pending."}},{"position":"03","oem":"11231288660","quantity":1,"location":{"pl":"Podkładka centralnego mocowania wału.","en":"Washer at crankshaft central fastening."}}]},
 {"id":"11_9925","engine":"M54B30","vehicle":"BMW E46 330i · ET55 EUR · 01/2002","title":{"pl":"Głowica – łoża, szpilki pokrywy i zaślepki","en":"Head – bearing ledges, cover studs and plugs"},"source":"https://www.realoem.com/bmw/enUS/showparts?diagId=11_9925&id=ET55-EUR-01-2002-E46-BMW-330i","usages":[{"position":"03","oem":"11121713264","quantity":4,"location":{"pl":"Zespół łoży wałków; pozycja 03.","en":"Bearing ledge assembly; position 03."}},{"position":"04","oem":"11617545279","quantity":28,"location":{"pl":"Łączna ilość dla zespołu głowicy; bez osobnego doliczania wałków.","en":"Combined head assembly quantity; do not add separate cam counts."}},{"position":"08","oem":"11121713264","quantity":4,"location":{"pl":"Zespół głowicy; pozycja 08, odrębna od 03 w źródle.","en":"Head assembly; position 08, distinct from 03 in source."}},{"position":"09","oem":"07129901481","quantity":28,"location":{"pl":"Zespół łoży wałków; ilość łączna, rozdział do potwierdzenia.","en":"Bearing ledge assembly; combined quantity, allocation pending."}},{"position":"10","oem":"11121718856","quantity":14,"location":{"pl":"Mocowanie pokrywy; dodatkowa szpilka M6×30 ma ilość X w schemacie pokrywy, nie doliczono.","en":"Valve cover fastening; additional M6×30 stud has quantity X in cover diagram and is not added."}},{"position":"17","oem":"07119937293","quantity":1,"location":{"pl":"Zaślepka zespołu głowicy.","en":"Cylinder head closure."}},{"position":"18","oem":"07119919031","quantity":1,"location":{"pl":"Korek zespołu głowicy.","en":"Cylinder head threaded closure."}},{"position":"19","oem":"11127568039","quantity":1,"location":{"pl":"Korek zespołu głowicy.","en":"Cylinder head threaded closure."}},{"position":"20","oem":"11121703712","quantity":2,"location":{"pl":"Zamknięcie gwintowane głowicy.","en":"Cylinder head threaded closure."}},{"position":"21","oem":"11121733403","quantity":1,"location":{"pl":"Zaślepka głowicy.","en":"Cylinder head closure."}},{"position":"22","oem":"11121432349","quantity":2,"location":{"pl":"Zaślepka głowicy.","en":"Cylinder head closure."}},{"position":"23","oem":"07119904393","quantity":1,"location":{"pl":"Korek głowicy.","en":"Cylinder head threaded closure."}},{"position":"27","oem":"11121427243","quantity":5,"location":{"pl":"Zaślepki głowicy.","en":"Cylinder head closures."}}]},
 {"id":"11_9900","engine":"M54B30","vehicle":"BMW E46 330i · sedan USA · 2002 (rok modelowy)","title":{"pl":"Dolny napęd rozrządu","en":"Lower timing drive"},"source":"https://www.bmwpartsdeal.com/parts-list/2002-bmw-330i-sedan_e46/engine/timing_timing_chain_lower_p.html","usages":[{"position":"03","oem":"07119951480","quantity":2,"location":{"pl":"Ustalenie napędu na wale; nie sumować z diagramem koła pasowego.","en":"Location of drive components on crankshaft; do not sum with pulley diagram."}},{"position":"06","oem":"11311748817","quantity":2,"location":{"pl":"Sworznie zespołu prowadnicy łańcucha głównego.","en":"Primary timing chain guide bearing bolts."}},{"position":"08","oem":"11311703718","quantity":1,"location":{"pl":"Sworzeń zespołu szyny napinającej.","en":"Tensioning rail bearing bolt."}},{"position":"10","oem":"07119963418","quantity":1,"location":{"pl":"Uszczelnienie napinacza głównego.","en":"Primary chain tensioner seal."}}]},
 {"id":"11_9909","engine":"M54B30","vehicle":"BMW E46 330i · ET56 EUR · 04/2001","title":{"pl":"VANOS – wybrane mocowania","en":"VANOS – selected fasteners"},"source":"https://www.realoem.com/bmw/enUS/showparts?diagId=11_9909&id=ET56-EUR-04_2001_E46_BMW_330i","usages":[{"position":"07","oem":"13627545338","quantity":2,"location":{"pl":"Mocowanie w zespole VANOS; dokładny otwór i przynależność do osprzętu do weryfikacji.","en":"VANOS assembly fastening; exact hole and scope pending."}},{"position":"08","oem":"07129904553","quantity":6,"location":{"pl":"Nakrętki zespołu VANOS; dokładne punkty do potwierdzenia.","en":"VANOS assembly nuts; exact points pending."}},{"position":"09","oem":"11361748745","quantity":2,"location":{"pl":"Śruby pasowane zespołu VANOS; dokładne punkty do potwierdzenia.","en":"VANOS fit bolts; exact points pending."}},{"position":"10","oem":"11361433513","quantity":2,"location":{"pl":"Zaślepki zespołu VANOS.","en":"VANOS assembly blind plugs."}},{"position":"11","oem":"11361438338","quantity":2,"location":{"pl":"Korki zespołu VANOS z uszczelnieniem.","en":"VANOS assembly sealing plugs."}},{"position":"13","oem":"11361436272","quantity":1,"location":{"pl":"Szpilka przy uchwycie; przypisanie do elektrozaworów niepotwierdzone.","en":"Stud near holder; solenoid allocation not confirmed."}},{"position":"14","oem":"11361436313","quantity":1,"location":{"pl":"Mocowanie zespołu VANOS; dokładny punkt do potwierdzenia.","en":"VANOS assembly fastening; exact point pending."}},{"position":"16","oem":"32416852469","quantity":2,"location":{"pl":"Cały przewód olejowy; ilość zawiera koniec przy filtrze.","en":"Entire oil line; quantity includes filter-housing end."}},{"position":"17","oem":"32411093596","quantity":4,"location":{"pl":"Cały przewód olejowy; nie dodawać osobno uszczelnień podstawy filtra.","en":"Entire oil line; do not add filter-housing seals separately."}}]},
 {"id":"11_9906","engine":"M54B30","vehicle":"BMW E46 330i · EV53 USA","title":{"pl":"Mocowania bloku i tylnej pokrywy","en":"Block and rear cover fasteners"},"source":"https://www.realoem.com/bmw/en/showparts?diagId=11_9906&id=EV53-USA---E46-BMW-330i","usages":[{"position":"03","oem":"07119913975","quantity":4,"location":{"pl":"Mocowanie zespołu pokryw bloku; dokładne otwory do potwierdzenia.","en":"Block cover assembly fastening; exact holes pending."}},{"position":"04","oem":"11141744147","quantity":2,"location":{"pl":"Mocowanie zespołu pokryw bloku; grupa M8.","en":"Block cover assembly fastening; M8 group."}},{"position":"12","oem":"13627545338","quantity":6,"location":{"pl":"Mocowanie dysz natrysku oleju na tłoki.","en":"Piston cooling oil jet fastening."}},{"position":"13","oem":"11111714541","quantity":1,"location":{"pl":"Zaślepka w zespole bloku; kanał do potwierdzenia.","en":"Block assembly plug; passage pending."}},{"position":"22","oem":"07119904517","quantity":1,"location":{"pl":"Osłona oleju – pozycja 22.","en":"Oil deflector – position 22."}},{"position":"23","oem":"07119905739","quantity":8,"location":{"pl":"Osłona oleju – grupa 23; sprawdzić pokrycie z grupą 13 bloku, nie sumować automatycznie.","en":"Oil deflector group 23; check overlap with block group 13 before aggregation."}}]},
 {"id":"11_9910","engine":"M54B30","vehicle":"BMW E46 330i · AW51 EUR","title":{"pl":"Górny rozrząd – strona ssąca","en":"Upper timing – intake side"},"source":"https://www.realoem.com/bmw/enUS/showparts?diagId=11_9910&id=AW51-EUR---E46-BMW-330i","usages":[{"position":"04","oem":"07119904525","quantity":2,"location":{"pl":"Mocowanie w zespole górnego rozrządu; otwory do potwierdzenia.","en":"Upper timing fastening; exact holes pending."}},{"position":"05","oem":"07119904524","quantity":1,"location":{"pl":"Mocowanie w zespole górnego rozrządu; pozycja 05.","en":"Upper timing assembly fastening; position 05."}},{"position":"06","oem":"11311736326","quantity":2,"location":{"pl":"Śruby zespołu górnego rozrządu; przypisanie do napinacza wymaga potwierdzenia.","en":"Upper timing bolts; tensioner allocation pending."}},{"position":"09","oem":"11361436675","quantity":3,"location":{"pl":"Mocowanie koła wałka ssącego.","en":"Intake sprocket fastening."}},{"position":"13","oem":"07119900910","quantity":3,"location":{"pl":"Zespół koła wałka ssącego.","en":"Intake sprocket assembly."}},{"position":"14","oem":"07119904526","quantity":1,"location":{"pl":"Zespół górnego rozrządu; dokładne połączenie do potwierdzenia.","en":"Upper timing assembly; exact joint pending."}}]},
 {"id":"11_9916","engine":"M54B30","vehicle":"BMW E46 330i · AW51 EUR","title":{"pl":"Górny rozrząd – strona wydechowa","en":"Upper timing – exhaust side"},"source":"https://www.realoem.com/bmw/enUS/showparts?diagId=11_9916&id=AW51-EUR---E46-BMW-330i","usages":[{"position":"02","oem":"11361432373","quantity":3,"location":{"pl":"Mocowanie koła wałka wydechowego.","en":"Exhaust sprocket fastening."}},{"position":"05","oem":"11361432752","quantity":3,"location":{"pl":"Zespół koła wałka wydechowego; dokładne otwory do potwierdzenia.","en":"Exhaust sprocket assembly; exact holes pending."}},{"position":"10","oem":"07119900910","quantity":3,"location":{"pl":"Zespół koła wałka wydechowego.","en":"Exhaust sprocket assembly."}}]},
 {"id":"ref-valve-keepers","engine":"M54B30","vehicle":"BMW E46 330i · sedan EUR LHD · 05/2003","title":{"pl":"Zabezpieczenia zaworów","en":"Valve retainers"},"source":"https://bmwfans.info/parts-catalog/E46-Sedan/Europe/330i-M54/L-N/may2003/browse/engine/valve_timing_gear_cam_shaft/","usages":[{"position":"09","oem":"11341461405","quantity":48,"location":{"pl":"Dwie połówki zamka na zawór; 24 zawory.","en":"Two collet halves per valve; 24 valves."}}]},
];
// Scope: assembled engine only. External mounts and unconfirmed peripheral joints
// remain in historical reference data but never enter the customer set.
// Head position 12 is withheld until its exact installation is established.
const excludedPreviewPositions=new Set(['11_9908:12','11_9918:13','11_9918:16','11_9921:10','11_9921:11','11_9909:07']);
export const diagrams:Diagram[]=referenceDiagrams.map(d=>({...d,usages:d.usages.filter(u=>!excludedPreviewPositions.has(d.id+':'+u.position))})).filter(d=>d.usages.length);
const includedOem=new Set(diagrams.flatMap(d=>d.usages.map(u=>u.oem)));
export const parts:Part[]=referenceParts.filter(p=>includedOem.has(p.oem));
export const partByOem=(oem:string)=>parts.find(p=>p.oem===oem);
export const diagramsFor=(engine:string)=>diagrams.filter(d=>d.engine===engine);
const searchText=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[×x]/g,'x').replace(/\s+/g,'');
export const matches=(p:Part,u:Usage,q:string)=>searchText([p.oem,p.dimension,p.name.pl,p.name.en,u.location.pl,u.location.en,u.position].join(' ')).includes(searchText(q.trim()));
export function searchEngineParts(diagrams:Diagram[],parts:Part[],query:string){
 if(!query.trim())return [];
 const map=new Map(parts.map(p=>[p.key??p.oem,p]));
 return diagrams.flatMap(diagram=>diagram.usages.flatMap(usage=>{const part=map.get(usage.partKey??usage.oem);return part&&matches(part,usage,query)?[{diagram,usage,part}]:[]}));
}
export function canSell(p:Part,u:Usage){
 return Boolean(p.dimension.trim()&&p.dimensionStatus!=='partial'&&p.sku&&p.technicalEvidence?.trim()&&u.mountingEvidence?.trim()&&Boolean(u.torque?.trim())===Boolean(u.torqueSource?.trim())&&u.replacement);
}
export function hasLicensedImage(d:Diagram){
 return Boolean(d.image?.rightsEvidence.trim()&&/^\/engine-hardware\/licensed\/[a-zA-Z0-9._-]+\.(png|webp|jpg|jpeg)$/.test(d.image.path));
}
export type Offer={id:number;sku:string;price:number;url:string};
