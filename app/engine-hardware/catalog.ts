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
export type Part={catalogStatus?:'discontinued';key?:string;unavailableReason?:Localized;unit?:'piece'|'set';oem:string;dimension:string;name:Localized;sku?:string;technicalEvidence?:string};
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
 {oem:'07119904539',dimension:'M14 × 1,5-ZNNIV',name:l('Korek gwintowany bloku','Threaded block plug')},
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
 {oem:'11131740000',dimension:'',name:l('Śruba miski olejowej','Oil pan bolt')},
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
 ]},
 // Selected reference examples only, not a bulk copy of the source catalogue.
 {id:'11_9905',engine:'M54B30',vehicle:'BMW E46 330i · EN52 EUR · 05/2001',title:l('Blok silnika','Engine block'),source:'https://www.realoem.com/bmw/enUS/showparts?diagId=11_9905&id=EN52-EUR-05_2001_E46_BMW_330i',usages:[
  u('02','11111740345',14,'Mocowanie podpór łożysk głównych wału korbowego do bloku.','Main bearing cap fastening to the cylinder block.'),
  u('03','11111703878',2,'Gwintowane zamknięcie otworów bloku; dokładne otwory do weryfikacji.','Threaded closure of block openings; exact openings pending verification.'),
  u('04','07119904539',1,'Korek gwintowany bloku; pozycja 04.','Threaded block plug; position 04.'),
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
];
// Scope: assembled engine only. External mounts and unconfirmed peripheral joints
// remain in historical reference data but never enter the customer set.
// Head position 12 is withheld until its exact installation is established.
const excludedPreviewPositions=new Set(['11_9908:12','11_9918:13','11_9918:16']);
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
 return Boolean(p.sku&&p.technicalEvidence?.trim()&&u.mountingEvidence?.trim()&&u.torque?.trim()&&u.torqueSource?.trim()&&u.replacement);
}
export function hasLicensedImage(d:Diagram){
 return Boolean(d.image?.rightsEvidence.trim()&&/^\/engine-hardware\/licensed\/[a-zA-Z0-9._-]+\.(png|webp|jpg|jpeg)$/.test(d.image.path));
}
export type Offer={id:number;sku:string;price:number;url:string};
