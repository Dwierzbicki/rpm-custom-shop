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

export function fmicSearchFacets(path:string[]):Facet[]{
 const existing=fmicFacets(path);
 if(path.includes('Turbosprężarki tuningowe'))return existing;
 const defs:Facet[]=[{key:'producer',label:'Producent',expression:knownProducer}];
 const canInclude=(root:string,category?:string)=>!path.length||path[0]===root&&(path.length===1||!category||path.includes(category));
 if(canInclude('Silnik i turbo','Turbosprężarki')){
  defs.push(...turboDefs.filter(f=>f.key!=='producer').map(f=>scoped(f,'Turbosprężarki tuningowe')));
 }
 if(canInclude('Układ paliwowy','Wtryskiwacze'))defs.push(scoped(injector,'Wtryskiwacze'));
 if(canInclude('Układ wydechowy','Wastegate'))defs.push(scoped({...wastegate,label:'Średnica wastegate (mm)'},'Wastegate'));
 defs.push({key:'explicit_diameter',label:'Średnica (mm, podana w nazwie)',expression:explicitDiameter});
 return defs;
}
