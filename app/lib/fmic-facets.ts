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
