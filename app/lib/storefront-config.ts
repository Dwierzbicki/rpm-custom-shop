/** Shared storefront configuration; extracted from the main client component. */
export type View='home'|'catalog'|'product'|'cart'|'checkout'|'garage'|'guides';
export const FMIC_CATEGORY_DESCRIPTIONS=['Filtry, rury, kolektory','Chłodnice, wentylatory','Pompy, wtryski, regulatory','Kolektory, downpipe, wydechy','Tarcze, zaciski, koła','Zawieszenie, dyferencjały','Turbosprężarki, części silnika','ECU, czujniki, wiązki','Fotele, pasy, kierownice','Kosmetyki, chemia','Osprzęt i akcesoria'] as const;
export const FMIC_CATEGORY_ICONS=['intake','cooling','fuel','exhaust','brakes','drivetrain','turbo','ecu','seat','detail','other'] as const;
export const POWER_ENGINES=[{id:'m50',make:'BMW',name:'SERIA M50',subtitle:'R6 / 2.0–2.5 l',versions:[{id:'m50b20',name:'M50B20',detail:'2.0 l'},{id:'m50b25',name:'M50B25',detail:'2.5 l'}]},{id:'m52',make:'BMW',name:'SERIA M52',subtitle:'R6 / 2.0–2.8 l',versions:[{id:'m52b20',name:'M52B20',detail:'2.0 l'},{id:'m52b25',name:'M52B25',detail:'2.5 l'},{id:'m52b28',name:'M52B28',detail:'2.8 l'}]},{id:'m54',make:'BMW',name:'SERIA M54',subtitle:'R6 / 2.2–3.0 l',versions:[{id:'m54b22',name:'M54B22',detail:'2.2 l'},{id:'m54b25',name:'M54B25',detail:'2.5 l'},{id:'m54b30',name:'M54B30',detail:'3.0 l'}]},{id:'2jz',make:'TOYOTA',name:'2JZ',subtitle:'R6 / 3.0 l',versions:[{id:'2jz-ge',name:'2JZ-GE',detail:'3.0 l / wolnossący'},{id:'2jz-gte',name:'2JZ-GTE',detail:'3.0 l / fabrycznie turbo'}]}] as const;
// MotoLab offered project bands, not engine strength ratings. Other BMW limits are provisional.
export const POWER_RANGES=[{min:250,max:400},{min:400,max:550},{min:550,max:700},{min:700,max:850}];
const bands=(...ends:number[])=>ends.slice(1).map((max,i)=>({min:ends[i],max}));
export const ENGINE_POWER_RANGES:Readonly<Record<string,readonly {min:number;max:number}[]>>={
 m50b20:bands(250,350,450),m50b25:bands(250,400,550,700),
 m52b20:bands(250,350,450),m52b25:bands(250,400,500,600),m52b28:bands(250,400,550,650),
 m54b22:bands(250,350,450),m54b25:bands(250,400,500,600),m54b30:bands(250,400,550,700),
 '2jz-ge':bands(250,400,550,700,850,1000),'2jz-gte':bands(250,400,550,700,850,1000)
};
export function powerRangesFor(version:string){return Object.prototype.hasOwnProperty.call(ENGINE_POWER_RANGES,version)?ENGINE_POWER_RANGES[version]:[]}
export const approvedPowerRange=(version:string)=>['m54b30','2jz-ge','2jz-gte'].includes(version);

export const categories=['Wszystkie','Kolektory','Turbo','Intercoolery','Wastegate','Osprzęt','Elektronika','Paliwo'];
export const phonePrefixes=[["PL","+48"],["DE","+49"],["GB","+44"],["NL","+31"],["FR","+33"],["IT","+39"],["ES","+34"],["AT","+43"],["BE","+32"],["SE","+46"],["NO","+47"],["DK","+45"],["FI","+358"],["CZ","+420"],["SK","+421"],["LT","+370"],["LV","+371"],["EE","+372"],["CH","+41"],["US","+1"],["IE","+353"],["PT","+351"],["RO","+40"],["HU","+36"],["UA","+380"]];
