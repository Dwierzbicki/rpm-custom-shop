// Hand-reviewed reference numbers, not stock, pricing, or fitment approvals.
export type OemReference={number:string;variant:string;source:string};
const rod323='https://www.realoem.com/bmw/enUS/showparts?diagId=11_9902&id=AM33-USA-09-2000-E46-BMW-323i';
const rod330='https://www.realoem.com/bmw/enUS/showparts?diagId=11_9913&id=AW51-EUR---E46-BMW-330i';
const main323='https://www.realoem.com/bmw/enUS/showparts?diagId=11_9901&id=AM33-USA-09-2000-E46-BMW-323i';
const main330='https://www.realoem.com/bmw/enUS/showparts?diagId=11_9901&id=AW51-EUR-08-2001-E46-BMW-330i';
const rings323='https://www.realoem.com/bmw/enUS/showparts?diagId=11_1336&id=AM38-MEX-07-2000-E46-BMW-323i';
const rods=(source:string):OemReference[]=>[
 {number:'11241284850',variant:'STD · 45.00 mm · blue',source},
 {number:'11241284849',variant:'STD · 45.00 mm · red',source},
 {number:'11241284852',variant:'44.75 mm (+0.25) · blue',source}
];
const mains=(source:string):OemReference[]=>[
 {number:'11211706847',variant:'STD · 60.00 mm · yellow',source},
 {number:'11211706848',variant:'STD · 60.00 mm · green',source},
 {number:'11211706849',variant:'STD · 60.00 mm · white',source}
];
const references:Record<string,Record<string,OemReference[]>>={
 m52b25tu:{'bearings-rod':rods(rod323),'bearings-main':mains(main323),rings:[
  {number:'11251437077',variant:'(0)',source:rings323},
  {number:'11251437078',variant:'(00)',source:rings323},
  {number:'11251437079',variant:'(+0.25)',source:rings323}
 ]},
 m54b30:{'bearings-rod':rods(rod330),'bearings-main':mains(main330)}
};
/** Never fall back to another engine or suggest stock rings for forged pistons. */
export function oemReferences(version:string,slot:string,internals:string):OemReference[]{
 if(slot==='rings'&&internals==='forged')return [];
 if(!Object.hasOwn(references,version))return [];
 const table=references[version];
 return Object.hasOwn(table,slot)?table[slot]:[];
}

/** Localize display text without changing OEM identifiers or source values. */
export function localizedOemVariant(variant:string,en:boolean):string{
 if(en)return variant;
 const colors:Record<string,string>={blue:'niebieska',red:'czerwona',yellow:'żółta',green:'zielona',white:'biała'};
 return variant.replace(/\b(blue|red|yellow|green|white)\b/g,color=>colors[color]).replace(/(\d)\.(\d)/g,'$1,$2');
}
