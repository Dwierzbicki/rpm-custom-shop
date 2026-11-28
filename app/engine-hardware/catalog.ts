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
export type Part={oem:string;dimension:string;name:Localized;sku?:string;technicalEvidence?:string};
export type Usage={position:string;oem:string;quantity:number;location:Localized;mountingEvidence?:string;torque?:string;torqueSource?:string;replacement?:'always'|'inspect';hotspots?:{x:number;y:number}[]};
export type Diagram={id:string;engine:string;vehicle:string;title:Localized;source:string;image?:{path:string;rightsEvidence:string};usages:Usage[]};
const bolt=l('Śruba z podkładką','Bolt with washer');
export const parts:Part[]=[
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
];
const u=(position:string,oem:string,quantity:number,pl:string,en:string):Usage=>({position,oem,quantity,location:l(pl,en)});
export const diagrams:Diagram[]=[
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
];
export const partByOem=(oem:string)=>parts.find(p=>p.oem===oem);
export const diagramsFor=(engine:string)=>diagrams.filter(d=>d.engine===engine);
export const matches=(p:Part,u:Usage,q:string)=>[p.oem,p.dimension,p.name.pl,p.name.en,u.location.pl,u.location.en,u.position].join(' ').toLowerCase().includes(q.trim().toLowerCase());
export function canSell(p:Part,u:Usage){
 return Boolean(p.sku&&p.technicalEvidence?.trim()&&u.mountingEvidence?.trim()&&u.torque?.trim()&&u.torqueSource?.trim()&&u.replacement);
}
export function hasLicensedImage(d:Diagram){
 return Boolean(d.image?.rightsEvidence.trim()&&/^\/engine-hardware\/licensed\/[a-zA-Z0-9._-]+\.(png|webp|jpg|jpeg)$/.test(d.image.path));
}
export type Offer={id:number;sku:string;price:number;url:string};
