// Conservative name-derived attributes. Never infer an inlet from an outlet.
export type Facet={key:string;label:string;expression:string};
const producer="CASE WHEN name ~* 'Pulsar' THEN 'Pulsar' WHEN name ~* 'Garrett' THEN 'Garrett' WHEN name ~* 'JRspec' THEN 'JRspec' WHEN name ~* 'TurboSystems' THEN 'TurboSystems' WHEN name ~* 'BorgWarner' THEN 'BorgWarner' ELSE NULLIF(data->>'brand','') END";
export function fmicFacets(path:string[]):Facet[]{
 if(path.includes('Turbosprężarki tuningowe'))return [
 {key:'producer',label:'Producent',expression:producer},
 {key:'model',label:'Model turbiny',expression:"upper(substring(name from '(?i)\\m(PSR[ -]?[0-9]{3,5}[A-Z0-9]*|GTX?[0-9]{4}[A-Z0-9]*|G[0-9]{2}[- ][0-9]{3,4}|HT[DSX][0-9]{4}[A-Z0-9]*)\\M'))"},
 {key:'flange',label:'Flansza dolotowa turbiny',expression:"CASE WHEN name ~* 'T4[ ]+Twin[ ]+Scroll' THEN 'T4 Twin Scroll' WHEN name ~* 'T3[ ]+Twin[ ]+Scroll' THEN 'T3 Twin Scroll' WHEN name ~* '\\mT4\\M' THEN 'T4' WHEN name ~* '\\mT3\\M' THEN 'T3' WHEN name ~* 'V[- ]?Band[ ]+Wlot' THEN 'V-Band' END"},
 {key:'ar',label:'A/R',expression:"replace(substring(name from '(?i)([0-9]*[.,][0-9]{2})[ ]+(?:T3|T4|V[- ]?Band|[0-9]+[.,][0-9]+[^ ]*[ ]+V[- ]?Band)'),',','.')"},
 {key:'bearing',label:'Rodzaj łożysk',expression:"CASE WHEN name ~* '(kulkow|ball bearing)' THEN 'Kulkowe' WHEN name ~* '(ślizgow|slizgow|journal bearing)' THEN 'Ślizgowe' END"}
 ];
 if(path.some(x=>/wtryskiwacze/i.test(x)))return [{key:'flow',label:'Wydajność (cc/min)',expression:"substring(name from '(?i)\\m([0-9]{3,4})[ ]*(?:cc|cm3)')"}];
 if(path.some(x=>/wastegate/i.test(x)))return [{key:'diameter',label:'Średnica',expression:"substring(name from '(?i)\\m([0-9]{2})[ ]*mm\\M')"}];
 return [];
}

/** Search facets are derived from mapped product categories, never from the search term.
 * Only extract technical values in the relevant category, to avoid interpreting e.g. a
 * brake disc diameter as a wastegate diameter. All SQL expressions are server constants.
 */
const turboPath=['Silnik i turbo','Turbosprężarki','Turbosprężarki tuningowe'];
const turboDefs=fmicFacets(turboPath);
const injector=fmicFacets(['Układ paliwowy','Wtryskiwacze'])[0];
const wastegate=fmicFacets(['Układ wydechowy','Wastegate'])[0];
const inCategory=(name:string)=>"'"+name.replace(/'/g,"''")+"' = ANY(target_category)";
const scoped=(facet:Facet,category:string):Facet=>({...facet,expression:'CASE WHEN '+inCategory(category)+' THEN '+facet.expression+' END'});
const knownProducer="CASE WHEN NULLIF(trim(data->>'brand'),'') IS NOT NULL THEN trim(data->>'brand') WHEN name ~* '\\mPulsar\\M' THEN 'Pulsar' WHEN name ~* '\\mGarrett\\M' THEN 'Garrett' WHEN name ~* '\\mJRspec\\M' THEN 'JRspec' WHEN name ~* '\\mTurboSystems\\M' THEN 'TurboSystems' WHEN name ~* '\\mBorgWarner\\M' THEN 'BorgWarner' WHEN name ~* '\\mBosch\\M' THEN 'Bosch' WHEN name ~* '\\mEcumaster\\M' THEN 'ECUMaster' WHEN name ~* '\\mTurbosmart\\M' THEN 'Turbosmart' WHEN name ~* '\\mMishimoto\\M' THEN 'Mishimoto' WHEN name ~* '\\mWiseco\\M' THEN 'Wiseco' WHEN name ~* '\\mMahle\\M' THEN 'Mahle' WHEN name ~* '\\mRecaro\\M' THEN 'Recaro' WHEN name ~* '\\mBrembo\\M' THEN 'Brembo' WHEN name ~* '\\mARP\\M' THEN 'ARP' END";
const explicitDiameter="replace(substring(name from '(?i)(?:średnica|srednica|diameter)[ ]*[:=]?[ ]*([0-9]+(?:[.,][0-9]+)?)[ ]*mm'),',','.')";


type Rule={categories:string[];facet:Facet};
const match=(pattern:string)=>"replace(substring(name from '(?i)"+pattern.replace(/'/g,"''")+"'),',','.')";
const rule=(categories:string[],key:string,label:string,expression:string):Rule=>({categories,facet:{key,label,expression}});
const mm="([0-9]{1,4}(?:[.,][0-9]{1,3})?)";
const color="CASE WHEN name ~* '\\m(czarn[yae]|black)\\M' THEN 'Czarny' WHEN name ~* '\\m(czerwon[yae]|red)\\M' THEN 'Czerwony' WHEN name ~* '\\m(niebiesk[iaie]|blue)\\M' THEN 'Niebieski' WHEN name ~* '\\m(różow[yae]|pink)\\M' THEN 'Różowy' WHEN name ~* '\\m(biał[yae]|white)\\M' THEN 'Biały' WHEN name ~* '\\m(zielon[yae]|green)\\M' THEN 'Zielony' WHEN name ~* '\\m(srebrn[yae]|silver)\\M' THEN 'Srebrny' WHEN name ~* '\\m(żółt[yae]|yellow)\\M' THEN 'Żółty' END";
const normalizedNumber=(expressions:string[])=>"trim_scale(COALESCE("+expressions.join(",")+")::numeric)::text";
const pistonBore="CASE WHEN name ~* '(tłok|piston)' AND name !~* '^Rod Set' THEN "+normalizedNumber(["\\m([0-9]{2,3}(?:[.,][0-9]{1,3})?)[ ]*mm[ ]*(?:bor|bore)\\M","\\([ ]*([0-9]{2,3}(?:[.,][0-9]{1,3})?)[ ]*mm[ ]*\\)","(?:średnica|srednica|bore)[ ]*[:=]?[ ]*([0-9]{2,3}(?:[.,][0-9]{1,3})?)[ ]*mm\\M","(?<![0-9.,+/-])([0-9]{2,3}(?:[.,][0-9]{1,3})?)[ ]*mm\\M"].map(match))+" END";
const pistonCR=normalizedNumber(["\\mCR[ ]*[:=]?[ ]*([0-9]{1,2}(?:[.,][0-9]+)?)(?:[ ]*:[ ]*1)?","compression ratio[ ]*[:=]?[ ]*([0-9]{1,2}(?:[.,][0-9]+)?)","\\m([0-9]{1,2}(?:[.,][0-9]+)?)[ ]*:[ ]*1\\M","\\m([0-9]{1,2}(?:[.,][0-9]+)?)[ ]+CR\\M"].map(match));
const rules:Rule[]=[
 ...turboDefs.filter(f=>f.key!=='producer').map(f=>({categories:['Turbosprężarki tuningowe'],facet:f})),
 rule(['Wtryskiwacze'],'flow','Wydajność wtryskiwacza (cc/min)',match('\\m([0-9]{3,4})[ ]*(?:cc|cm3)')),
 rule(['Wastegate'],'wastegate_mm','Średnica wastegate (mm)',match('\\m([0-9]{2})[ ]*mm\\M')),
 rule(['Pompy paliwa'],'pump_flow','Wydajność pompy (l/h)',match('\\m([0-9]{2,4})[ ]*(?:lph|l/h)\\M')),
 rule(['Pompy paliwa'],'fuel_e85','Kompatybilność z E85',"CASE WHEN name ~* '\\mE85\\M' THEN 'E85 (w nazwie)' END"),
 rule(['Dystanse kół'],'spacer_thickness','Grubość dystansu (mm)',match('\\m'+mm+'[ ]*mm[ ]+[0-9]{1,2}x[0-9]{2,3}')),
 rule(['Dystanse kół'],'pcd','Rozstaw śrub (PCD)',match('\\m([3-8][ ]*x[ ]*[0-9]{2,3}(?:[.,][0-9])?)\\M')),
 rule(['Dystanse kół'],'center_bore','Otwór centrujący (mm)',match('[3-8]x[0-9]{2,3}(?:[.,][0-9])?[ ]+'+mm+'[ ]*mm')),
 rule(['Łączniki silikonowe','Kolanka i rury aluminiowe','Przewody silikonowe'],'pipe_size','Wymiar przyłącza (mm)',match('\\m([0-9]{1,3}(?:[.,][0-9]+)?(?:[/][0-9]{1,3}(?:[.,][0-9]+)?)?)[ ]*mm\\M')),
 rule(['Łączniki silikonowe','Kolanka i rury aluminiowe'],'bend','Kąt kolanka',match("(?:kolanko|kolanka|redukcyjne)[ ]+(23|45|67|90|135|180)[ ]*(?:°|'|deg)")),
 rule(['Łączniki silikonowe','Kolanka i rury aluminiowe'],'pipe_length','Długość (cm)',match('\\m'+mm+'[ ]*cm\\M')),
 rule(['Łączniki silikonowe','Przewody hamulcowe HEL','Przewody sprzęgła','Nakrętki i śruby koła','Kierownice, naby i rozpinki','Dywaniki welurowe'],'color','Kolor',color),
 rule(['Kute tłoki'],'piston_bore','Średnica tłoka (mm)',pistonBore),
 rule(['Kute tłoki'],'compression','Stopień sprężania',pistonCR),
 rule(['Kute korbowody'],'rod_length','Długość korbowodu (mm)',match('\\m'+mm+'[ ]*mm\\M')),
 rule(['Kute korbowody'],'rod_type','Profil korbowodu',"CASE WHEN name ~* '\\mH[- ]?Beam\\M' THEN 'H-Beam' WHEN name ~* '\\mI[- ]?Beam\\M' THEN 'I-Beam' WHEN name ~* '\\mX[- ]?Beam\\M' THEN 'X-Beam' END"),
 rule(['Uszczelki głowicy i silnika'],'gasket_type','Typ uszczelki',"CASE WHEN name ~* 'Cut Ring' THEN 'Cut Ring' WHEN name ~* '\\mMLS\\M' THEN 'MLS' END"),
 rule(['Intercooler'],'core_dimensions','Wymiary (mm)',match('\\m([0-9]{2,4}[ ]*[x×][ ]*[0-9]{2,4}[ ]*[x×][ ]*[0-9]{1,3})[ ]*mm\\M')),
 rule(['Chłodnice oleju'],'oil_rows','Liczba rzędów',match('\\m([0-9]{1,2})[- ]*(?:rzęd|row)')),
 rule(['Nyple olejowe','Pompy paliwa','Listwy paliwowe','Regulatory ciśnienia paliwa'],'an_size','Przyłącze AN',match('\\m([0-9]{1,2})[ ]*AN\\M')),
 rule(['Aktuatory','Regulatory ciśnienia paliwa'],'pressure_psi','Ciśnienie (PSI)',match('\\m'+mm+'[ ]*PSI\\M')),
 rule(['Końcówki wydechowe'],'exhaust_mount','Średnica montażowa (mm)',match('montażowa[ ]*'+mm+'[ ]*mm')),
 rule(['Końcówki wydechowe','Kolektory wydechowe','Downpipe','Kompletne układy wydechowe'],'material','Materiał',"CASE WHEN name ~* '(nierdzew|stainless)' THEN 'Stal nierdzewna' WHEN name ~* '(karbon|carbon)' THEN 'Karbon' WHEN name ~* '(tytan|titanium)' THEN 'Tytan' END"),
 rule(['Kierownice, naby i rozpinki'],'steering_offset','Odsadzenie (mm)',match('odsadzenie[ ]*'+mm+'[ ]*mm')),
 rule(['Oleje silnikowe'],'viscosity','Lepkość SAE',"upper(substring(name from '(?i)\\m([0-9]{1,2}W[- ]?[0-9]{2})\\M'))"),
];
const volume="CASE WHEN name ~* '\\m[0-9]+(?:[.,][0-9]+)?[ ]*ml\\M' THEN replace(substring(name from '(?i)\\m([0-9]+(?:[.,][0-9]+)?)[ ]*ml\\M'),',','.') WHEN name ~* '\\m[0-9]+(?:[.,][0-9]+)?[ ]*l\\M' THEN (replace(substring(name from '(?i)\\m([0-9]+(?:[.,][0-9]+)?)[ ]*l\\M'),',','.')::numeric*1000)::text END";
// Cheap literal guard skips expensive regex when the brand is absent; original word-boundary and precedence checks remain.
export const fmicProducerExpression="CASE WHEN NULLIF(trim(data->>'brand'),'') IS NOT NULL THEN trim(data->>'brand') "+["FMIC.Pro","FMIC.EU","HEL","Menzerna","Fresso","Manley","Athena","ACL","Wagner Tuning","Ramair","PRORAM","Radium Engineering","DeatschWerks","EBC Brakes","Coolerworx","Wisefab","Supertech","Nitrous Express","Red Line","Mishimoto","IRP","AEM","XForce","Pulsar","Garrett","JRspec","TurboSystems","BorgWarner","Bosch","ECUMaster","Turbosmart","Wiseco","Mahle","Recaro","Brembo","JE Pistons","Cometic","Wilwood","TEIN","ZRP","CANchecked","Penrite","Elring","IOD Performance","Nuke Performance","King Racing","RTMG Performance","Metal Guard","ARP"].map(b=>"WHEN CASE WHEN strpos(lower(name),lower('"+b+"'))>0 THEN name ~* '\\m"+b.replace(/[.]/g,"[.]")+"\\M' ELSE false END THEN '"+b+"' ").join("")+"END";
export function fmicSearchFacets(path:string[]):Facet[]{
 const defs:Facet[]=[{key:'producer',label:'Producent',expression:fmicProducerExpression}];
 // Technical filters only for selected categories. Broad searches stay cheap.
 if(path.length>=2){
 for(const {categories,facet} of rules){
 if(categories.some(c=>path.includes(c)))defs.push({...facet,expression:"CASE WHEN ("+categories.map(inCategory).join(" OR ")+") THEN "+facet.expression+" END"});
 }
 if(path[0]==='Detailing'||path.includes('Oleje i płyny'))defs.push({key:'volume_ml',label:'Pojemność (ml)',expression:volume});
 defs.push({key:'explicit_diameter',label:'Średnica podana w nazwie (mm)',expression:explicitDiameter});
 }else if(path[0]==='Detailing')defs.push({key:'volume_ml',label:'Pojemność (ml)',expression:volume});
 return defs;
}
