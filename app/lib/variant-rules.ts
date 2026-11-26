// Conservative V1: only explicit color words. No inference from identical names alone.
export const variantScopes=['colors','hel'] as const;
export type VariantScope=typeof variantScopes[number];
export type VariantDecision='pending'|'approved'|'rejected';
export type VariantFilter=VariantDecision|'conflict'|'all';
export type VariantMember={sku:string;name:string;color:string;brand:string;mpn:string;ean:string;category:string[];price:number;available:boolean};
export type VariantFamily={id:string;scope:VariantScope;rule:string;title:string;category:string[];members:VariantMember[];fingerprint:string;reviewed_fingerprint:string|null;reviewed_members:VariantMember[]|null;status:VariantFilter;present:boolean;scanned_at:string;reviewed_at:string|null};
export const colorTerms:Record<string,string>={
 czarny:'Czarny',czarna:'Czarny',czarne:'Czarny',black:'Czarny',
 niebieski:'Niebieski',niebieska:'Niebieski',niebieskie:'Niebieski',blue:'Niebieski',
 czerwony:'Czerwony',czerwona:'Czerwony',czerwone:'Czerwony',red:'Czerwony',
 zielony:'Zielony',zielona:'Zielony',zielone:'Zielony',green:'Zielony',
 pomarańczowy:'Pomarańczowy',pomarańczowa:'Pomarańczowy',pomarańczowe:'Pomarańczowy',orange:'Pomarańczowy',
 żółty:'Żółty',żółta:'Żółty',żółte:'Żółty',yellow:'Żółty',biały:'Biały',biała:'Biały',białe:'Biały',white:'Biały',
 szary:'Szary',szara:'Szary',szare:'Szary',grey:'Szary',gray:'Szary',srebrny:'Srebrny',srebrna:'Srebrny',srebrne:'Srebrny',silver:'Srebrny',
 złoty:'Złoty',złota:'Złoty',złote:'Złoty',gold:'Złoty',fioletowy:'Fioletowy',fioletowa:'Fioletowy',fioletowe:'Fioletowy',purple:'Fioletowy',
 różowy:'Różowy',różowa:'Różowy',różowe:'Różowy',pink:'Różowy',miedziany:'Miedziany',miedziana:'Miedziany',miedziane:'Miedziany',copper:'Miedziany'
};
export const helColors=[
 ['B','czarne','czarny','Czarny'],['CTR','karbonowe przezroczyste','karbon przezroczysty','Karbon przezroczysty'],
 ['FTR','fioletowe przezroczyste','fioletowy przezroczysty','Fioletowy przezroczysty'],['G','zielone','zielony','Zielony'],
 ['N','niebieskie','niebieski','Niebieski'],['NTR','niebieskie przezroczyste','niebieski przezroczysty','Niebieski przezroczysty'],
 ['P','pomarańczowe','pomarańczowy','Pomarańczowy'],['PI','różowe','różowy','Różowy'],['R','czerwone','czerwony','Czerwony'],
 ['RTR','czerwone przezroczyste','czerwony przezroczysty','Czerwony przezroczysty'],['TR','przezroczyste','przezroczysty','Przezroczysty'],
 ['W','białe','biały','Biały'],['Y','żółte','żółty','Żółty']
] as const;
export function variantStatus(decision:VariantDecision,present:boolean,fingerprint:string,reviewed:string|null):VariantFilter{
 return !present||decision!=='pending'&&fingerprint!==reviewed?'conflict':decision;
}
export function colorCandidate(name:string){
 const normalized=name.trim().replace(/\s+/g,' ');const at=normalized.lastIndexOf(' ');
 const color=colorTerms[normalized.slice(at+1).toLowerCase()];
 return at>0&&Object.hasOwn(colorTerms,normalized.slice(at+1).toLowerCase())&&color?{family:normalized.slice(0,at).toLowerCase(),color}:null;
}
