/** First catalogue discovery rule. It produces candidates, not fitment approvals.
 * Brand is inferred only from explicit product naming or known supplier SKU families.
 * Keep accessory and vehicle-specific parts out, even when supplier categories are broad. */
export type DiscoveryRow={sku:string;name:string;brand?:string|null;source?:string|null;proposed_gross?:number|string|null};
export type DiscoveredPart={sku:string;name:string;brand:string;slot:string;reason:[string,string];injectorPackSize?:1|6;injectorFlowCc?:number;pumpFlowLph?:number;turbo?:TurboCatalogueData;piston?:PistonCatalogueData;enginePart?:EnginePartData;source?:string;cataloguePrice?:number};
export function discoverBov(row:DiscoveryRow):DiscoveredPart|null{
 const name=row.name.normalize('NFKC').toLowerCase(),sku=row.sku;
 if(!sku||sku.length>120||!name||name.length>500)return null;
 if(/\b(style|replica|spring|cap|plug|diaphragm|adapter|supercharger|turbodiesel|sensor|flange|only)\b|sprężyn|membran|flansz|uszczel|zestaw napraw|pokryw|króciec/i.test(name))return null;
 let brand='';
 if(/^USA-TIAL-/.test(sku)&&/\btial\s+q(?:r)?\b/.test(name)&&/blow.off/.test(name))brand='TiAL';
 else if(/\bpulsar\s+psr\b/.test(name)&&/\b(bov|blow.off)\b/.test(name)&&/\b(50\s*mm|valve)\b/.test(name))brand='Pulsar';
 else if(/\brtmg\b/.test(name)&&/universal blow off valve/.test(name))brand='RTMG Performance';
 else if(/\bturbosmart\b/.test(name)&&/\b(bov|blow.off)\b/.test(name)&&/\b(universal|race port (?:female )?gen\s*v|plumb back (?:32|38)mm|supersonic)\b/.test(name)&&!/(ford|nissan|subaru|fiat|mazda|porsche|audi|bmw|volkswagen|mercedes|mitsubishi|toyota|honda|hyundai|kia|suzuki|renault|peugeot|skoda|seat|opel|volvo)\b/.test(name))brand='Turbosmart';
 else if(/\bproperfekt\b/.test(name)&&/^VLV-BO-PP-/.test(sku)&&/\b(bov|blow.off)\b/.test(name))brand='Properfekt';
 else if(/^BOV-/.test(sku)&&(/fmic\.eu/.test(name)||/uniwersalny zawór blow off/.test(name)))brand='FMIC.EU';
 if(!brand)return null;
 return {sku,name:row.name,brand,slot:'bov',reason:['Katalog: kompletny zawór z grupy uniwersalnej; dobierz typ recyrkulacji, przepływ, sprężynę i flanszę. Nie jest potwierdzeniem dopasowania.','Catalogue: complete universal valve candidate; verify recirculation, flow, spring and flange. Not a fitment approval.']};
}

/** Conservative category + product-name rules. Newly discovered parts never
 * become an automatic recommendation on their own. */
export function discoverPart(row:DiscoveryRow,category:string[]):DiscoveredPart|null{
 if(category.join('/')==='Układ dolotowy/Blow off/Blow offy uniwersalne')return discoverBov(row);
 const name=row.name.normalize('NFKC').toLowerCase(),sku=row.sku;
 if(!sku||sku.length>120||!name||name.length>500)return null;
 if(/\b(style|replica|spring|cap|plug|diaphragm|adapter|replacement|bracket|element only|carburetor)\b|sprężyn|membran|uszczel|zestaw napraw|dedykowan|wkład wymienny|mocowanie|niskie ciśnienie|low pressure|gaźnik/i.test(name))return null;
 const result=(slot:DiscoveredPart['slot'],brand:string,reason:[string,string]):DiscoveredPart=>({sku,name:row.name,brand,slot,reason});
 if(category.join('/')==='Układ paliwowy/Regulatory ciśnienia paliwa/Regulatory ciśnienia paliwa'){
  const brand=/^USA-ARE-/.test(sku)&&/aeromotive.*\befi\b/.test(name)?'Aeromotive':/^NP-/.test(sku)&&/nuke performance.*\bfpr100[smx]\b/.test(name)?'Nuke Performance':/^TS-0404-/.test(sku)&&/turbosmart.*\bfpr(?:6|8|10|12)(?:m)?\b/.test(name)?'Turbosmart':'';
  return brand?result('regulator',brand,['Alternatywa EFI. Potwierdź regulację 1:1, zakres ciśnienia, paliwo, przepływ powrotu i porty przed montażem.','EFI alternative. Confirm 1:1 reference, pressure range, fuel, return flow and ports before installation.']):null;
 }
 if(category.join('/')==='Układ paliwowy/Filtry paliwa'){
  if(/\b(ford|subaru|porsche|nissan|bmw|toyota|honda|audi|mazda|mitsubishi|saab|volkswagen)\b/.test(name))return null;
  const brand=/deatschwerks.*in.line fuel filter/.test(name)?'DeatschWerks':/aeromotive/.test(name)&&/fuel filter|filtr paliwa/.test(name)?'Aeromotive':/radium engineering/.test(name)&&/^filtr paliwa z wkładem/.test(name)?'Radium Engineering':/turbosmart/.test(name)&&/^filtr paliwa/.test(name)?'Turbosmart':'';
  const microns=name.match(/\b(10|100)\s*(?:um|µm|μm|micron|mikron)\b/)?.[1];
  if(!brand||!microns)return null;
  return result(microns==='10'?'fuel-post-filter':'fuel-pre-filter',brand,[microns==='10'?'Filtr dokładny za pompą: potwierdź wkład, paliwo, ciśnienie, przepływ i porty.':'Filtr wstępny przed pompą zewnętrzną: potwierdź wymagania pompy, przepływ, paliwo i porty.',microns==='10'?'Post-pump fine filter: confirm element, fuel, pressure, flow and ports.':'External pump pre-filter: confirm pump requirements, flow, fuel and ports.']);
 }
 if(category.join('/')==='Układ dolotowy/Intercooler/Uniwersalne'){
  const brand=/^mmint-u/i.test(sku)&&/intercooler uniwersalny mishimoto/.test(name)?'Mishimoto':/^ic/.test(sku.toLowerCase())&&/\bintercooler\b/.test(name)&&/jrspec/.test(name)?'JRspec':/^ic/i.test(sku)&&/\bintercooler\b/.test(name)&&/fmic\.eu/.test(name)?'FMIC.EU':'';
  if(!brand||/rdzeń|core only|orurowanie|mocowan|przewód|zestaw montażowy/.test(name))return null;
  return result('intercooler',brand,['Uniwersalny intercooler do indywidualnego doboru. Sprawdź wydajność dla celu mocy, gabaryty, króćce i spadek ciśnienia.','Universal intercooler for individual sizing. Verify capacity for target power, dimensions, ports and pressure drop.']);
 }
 return null;
}


/** Nominal catalogue dimensions in the order written by the supplier.
 * Never infer dimensions from SKU, a model name or an unrelated port size. */
export function intercoolerDimensions(name:string):[number,number,number]|null{
 const match=name.match(/\b(\d{2,4})\s*[x×]\s*(\d{2,4})\s*[x×]\s*(\d{2,4})\s*mm\b/i);
 if(!match)return null;
 const dimensions:[number,number,number]=[Number(match[1]),Number(match[2]),Number(match[3])];
 return dimensions.every(n=>n>0)?dimensions:null;
}
export function intercoolerDimensionOptions(names:string[]):string[]{
 const unique=new Map<string,[number,number,number]>();
 for(const name of names){const d=intercoolerDimensions(name);if(d)unique.set(d.join('×'),d)}
 return [...unique.entries()].sort(([,a],[,b])=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]).map(([key])=>key);
}


/** On-demand discovery for catalogue gaps. Only approved category paths can
 * be searched, and a candidate is never proof of application or suitability. */
const sensorCategories=[['Elektronika','Ecumaster','Czujniki i akcesoria'],['Elektronika','Wskaźniki','Czujniki']];
export const extraDiscoveryPaths:Record<string,string[][]>={
 filter:[['Układ dolotowy','Filtry powietrza','Filtry stożkowe']],
 injectors:[['Układ paliwowy','Wtryskiwacze','Wtryskiwacze uniwersalne']],
 pump:[['Układ paliwowy','Pompy paliwa','Uniwersalne pompy paliwa']],
 throttle:[['Układ dolotowy','Przepustnice']],
 'fuel-surge':[['Układ paliwowy','Swirl Poty']],
 wideband:[['Elektronika','Zestawy AFR']],
 'map-sensor':sensorCategories,'iat-sensor':sensorCategories,'oil-pressure-sensor':sensorCategories,'oil-temp-sensor':sensorCategories,'fuel-pressure-sensor':sensorCategories,'egt-probe':sensorCategories,
 'heat-shield-mat':[['Układ wydechowy','Termoizolacja','Maty i taśmy termoizolacyjne']],
 'heat-reflective-tape':[['Układ wydechowy','Termoizolacja','Maty i taśmy termoizolacyjne']]
};
export function airFilterDiameter(name:string):number|null{
 const m=name.match(/(?:średnica montażowa|średnica przyłącza|inlet diameter|flange (?:id|diameter))\s*[:Øø]?\s*(\d{2,3}(?:[.,]\d+)?)\s*mm/i);
 const n=m?Number(m[1].replace(',','.')):0;return n>0?n:null;
}
export function discoverExtraPart(row:DiscoveryRow,category:string[],slot:string):DiscoveredPart|null{
 if(!Object.hasOwn(extraDiscoveryPaths,slot)||!extraDiscoveryPaths[slot].some(p=>p.join('/')===category.join('/')))return null;
 const n=row.name.normalize('NFKC').toLowerCase(),sku=row.sku;
 if(!sku||sku.length>120||!n||n.length>500)return null;
 if(/\b(style|replica|replacement|adapter|bracket|plug|connector|wiring|cable)\b|uszczel|wtyczk|przewód|mocowanie|dystans|zestaw napraw|dedykowan/i.test(n))return null;
 const brand=row.brand?.trim()||([[/fmic\.pro/i,'FMIC.Pro'],[/fmic\.eu/i,'FMIC.EU'],[/jrspec/i,'JRspec'],[/k&n|\bk\s*&\s*n\b/i,'K&N'],[/pipercross/i,'Pipercross'],[/ramair/i,'Ramair'],[/simota/i,'Simota'],[/aem/i,'AEM'],[/mishimoto/i,'Mishimoto'],[/nuke performance/i,'Nuke Performance'],[/deatschwerks/i,'DeatschWerks'],[/radium engineering/i,'Radium Engineering'],[/innovate/i,'Innovate'],[/ecumaster/i,'ECUMASTER'],[/bosch/i,'Bosch'],[/\bdei\b/i,'DEI'],[/thermo.?tec/i,'Thermo-Tec']] as [RegExp,string][]).find(([re])=>re.test(n))?.[1]||'';
 const make=(pl:string,en:string):DiscoveredPart=>({sku,name:row.name,brand:brand||'—',slot,reason:[pl,en]});
 if(slot==='pump'){
  if(!/pompa paliwa|fuel pump/.test(n)||/niskie ciśnienie|low pressure|lift pump|transfer pump|gaźnik|carburetor|diesel|wtrysk bezpośredni|direct injection|\b(bmw|audi|vw|volkswagen|ford|nissan|toyota|volvo|opel|fiat|saab|kia|hyundai|renault|peugeot|porsche|mercedes|mitsubishi|subaru|skoda|seat|harley|gm)\b/.test(n))return null;
  const flow=n.match(/\b(\d{2,4})\s*(?:lph|l\s*\/\s*h)\b/)?.[1];
  if(!flow)return null;
  const pbrand=/deatschwerks/.test(n)?'DeatschWerks':/aeromotive/.test(n)?'Aeromotive':/\baem\b/.test(n)?'AEM':/bosch/.test(n)?'Bosch':/walbro|ti automotive/.test(n)?'Walbro / TI Automotive':brand||'—';
  return {...make('Pompa uniwersalna EFI. Przepływ katalogowy nie potwierdza wydajności przy ciśnieniu roboczym. Sprawdź krzywą przepływu, paliwo, napięcie, pobór prądu oraz montaż wewnętrzny lub zewnętrzny.','Universal EFI pump. Catalogue flow does not establish flow at operating pressure. Verify flow curve, fuel, voltage, current and in-tank or external mounting.'),brand:pbrand,pumpFlowLph:Number(flow)};
 }
 if(slot==='injectors'){
  // Supplier singles: explicit singular title and known individual SKU family.
  // Never infer package quantity from flow or price.
  const bosch=/^BOSCH\d+CC(?:-EV[16])?$/i.test(sku)&&/^wtrysk(?:iwacz)? bosch\b/.test(n);
  const nuke=/^NP-130-01-\d+$/.test(sku)&&/nuke performance.*(?:wtryskiwacz bosch|bosch injector)/.test(n);
  const pack=/\b6\s*szt\b|\bset of 6\b/.test(n)&&/zestaw wtryskiwaczy|matched set|komplet/.test(n);
  const flow=n.match(/\b(\d{3,4})\s*cc(?:\/min)?\b/)?.[1];
  if(!flow||(!bosch&&!nuke&&!pack)||/bezpośredni|direct injection|\b(?:4|8)\s*szt\b|o-ring/.test(n))return null;
  const product=make('Nominalny przepływ z nazwy katalogowej. Potwierdź jednostkę sprzedaży, ciśnienie referencyjne, długość, złącze, impedancję, paliwo i kalibrację; pojedyncze wtryski warto dobrać przepływowo.','Nominal flow from catalogue title. Verify sales unit, reference pressure, length, connector, impedance, fuel and calibration; flow-match individual injectors.');
  return {...product,brand:bosch?'Bosch':nuke?'Nuke Performance':brand||'—',injectorPackSize:pack?6:1,injectorFlowCc:Number(flow)};
 }
 if(slot==='filter'){
  if(!/filtr powietrza|air filter|filtr stożkowy/.test(n))return null;
  return make('Filtr stożkowy. Potwierdź średnicę przyłącza dolotu turbo, miejsce i wymagany przepływ; rozmiar montażowy nie oznacza wydajności.','Cone filter. Confirm turbo inlet connection diameter, clearance and required airflow; flange size does not establish capacity.');
 }
 if(slot==='throttle'&&(/^(?:przepustnica(?: jrspec)? \d+\s*mm)$/i.test(n)))return make('Potwierdź średnicę, typ sterowania, TPS, flanszę i zgodność ECU.','Confirm bore, actuation, TPS, flange and ECU support.');
 if(slot==='fuel-surge'&&/swirl pot|surge tank|zbiornik wyrównawczy/.test(n)&&!/pick up pipe|install kit|fuel cell unit|sprzedawany oddzielnie/.test(n))return make('Potwierdź układ pomp, pojemność, porty, zgodność paliwową i zawartość zestawu.','Confirm pump layout, capacity, ports, fuel compatibility and kit contents.');
 if(slot==='wideband'&&/innovat[e]/.test(n)&&/\b(lc-2|lm-2|mtx-l)\b/.test(n)&&/zestaw|kontroler|full kit|basic kit/.test(n))return make('Zestaw AFR: potwierdź sondę, kontroler i wejścia ECU; nie dubluj wyposażenia sterownika.','AFR kit: confirm sensor, controller and ECU inputs; avoid duplicating integrated equipment.');
 const sensorRules:Record<string,RegExp>={
 'map-sensor':/czujnik ciśnienia bezwzględnego|map sensor|czujnik doładowania/,
 'iat-sensor':/czujnik iat|czujnik temperatury powietrza/,
 'oil-pressure-sensor':/czujnik ciśnienia oleju/,
 'oil-temp-sensor':/czujnik temperatury (?:wody )?oleju/,
 'fuel-pressure-sensor':/czujnik ciśnienia paliwa/,
 'egt-probe':/czujnik egt|termopara/
 };
 if(sensorRules[slot]?.test(n)&&!/\b(bmw|audi|vw|volkswagen|ford|nissan|toyota|volvo|opel|fiat|saab|kia|hyundai|renault|peugeot|porsche|mercedes|mitsubishi|subaru|skoda|seat|tdi|crdi|common rail)\b/.test(n))return make('Potwierdź zakres, charakterystykę kalibracji, gwint, złącze i zgodność ECU.','Confirm range, calibration curve, thread, connector and ECU compatibility.');
 if(slot==='heat-shield-mat'&&/mata|mat |blacha|sheet/.test(n)&&!/taśma|tape/.test(n))return make('Dobierz powierzchnię, temperaturę pracy i sposób mocowania.','Confirm area, operating temperature and mounting.');
 if(slot==='heat-reflective-tape'&&/taśma|tape/.test(n)&&/odbij|reflec|gold|złot|alumin/.test(n))return make('Osłona powierzchni przed promieniowaniem; sprawdź temperaturę pracy kleju.','Radiant heat protection; confirm adhesive operating temperature.');
 return null;
}


/** Only explicit compressor-side hose/spigot inlet dimensions. Never use
 * turbine flange/outlet, compressor wheel diameter or an ambiguous title. */
export function compressorInletMm(technical:unknown,description:string):number|null{
 const fields=(technical as {fields?:{key?:string;value?:string}[]}|null)?.fields;
 const values=Array.isArray(fields)?fields.filter(f=>f.key==='compressor_inlet').map(f=>String(f.value??'')):[];
 if(!values.length){
  const found=description.match(/(?:wlot muszli ssącej|wlot kompresora|compressor inlet)\s*:\s*((?:przewód|hose|slip.on)\s*)?(\d+(?:[.,]\d+)?)\s*(mm|["″”]|inch(?:es)?|cala|cale|cal)\s*(przewód|hose|slip.on)?/gi);
  if(found)values.push(...found.filter(v=>/\b(przewód|hose|slip.on)\b/i.test(v)).map(v=>v.slice(v.indexOf(':')+1).trim()));
 }
 const parsed=values.map(value=>{
  if(/v.band|flansz|flange|thread|gwint/i.test(value))return null;
  const m=value.trim().match(/^(?:(?:przewód|hose|slip.on)\s*)?(\d+(?:[.,]\d+)?)\s*(mm|["″”]|inch(?:es)?|cala|cale|cal)(?:\s*(?:przewód|hose|slip.on))?$/i);
  if(!m)return null;
  const size=Number(m[1].replace(',','.'))*(m[2].toLowerCase()==='mm'?1:25.4);
  return size>=30&&size<=200?Math.round(size*10)/10:null;
 });
 if(!parsed.length||parsed.some(v=>v===null)||new Set(parsed).size!==1)return null;
 return parsed[0];
}
/** Catalogue nominal match, not a physical mounting approval. */
export function suggestedFilterDiameter(inlet:number|null,sizes:number[]):number|null{
 if(inlet===null)return null;
 return [...sizes].filter(n=>Number.isFinite(n)&&Math.abs(n-inlet)<=0.5).sort((a,b)=>Math.abs(a-inlet)-Math.abs(b-inlet)||a-b)[0]??null;
}


/** Nominal catalogue screening; a declared maximum is NOT a compressor map or
 * proof that a turbo will make the target power on a particular engine. */
export type TurboCatalogueData={model:string;ratingPs:number;ratingLabel:string;ar:number|null;flange:'t25-single'|'t3-single'|'vband-single'|'t3-twin'|'t4-single'|'t4-twin'|null;wg:'internal'|'external'|null;outlet:string|null};
export const turboDiscoveryCategory=['Silnik i turbo','Turbosprężarki','Turbosprężarki tuningowe'];
const ptx28=/\bpulsar\s+psr\s*(2860|2867|2871)\s*gen\s*2\b/i;
export function turboCatalogueData(name:string):TurboCatalogueData|null{
 const n=name.normalize('NFKC').replaceAll(',','.').toLowerCase();
 if(!/turbosprężarka|turbsprężarka|turbocharger|\bturbo\b/.test(n)||/without (?:turbine|compressor|housing|hot side|cold side)|bez (?:obudowy|muszli|strony gorącej|strony zimnej)|housing only|turbo core|\b(?:supercore|super core|chra|cartridge|drop.in|reverse|odwrócona)\b|^obudowa|^muszla|^adapter|^zestaw napraw/.test(n))return null;
 const hp=[...n.matchAll(/\b(\d{3,4})\s*(hp|km|ps)\b/g)];
 const ratings=[...new Set(hp.map(m=>Number(m[1])*(m[2]==='hp'?1.01387:1)))];
 const ptx=n.match(ptx28)?.[1];
 // Manufacturer's PTX28 model-level FWHP rating, including titles without HP.
 const known:Record<string,number>={'2860':475,'2867':550,'2871':575};
 const rating=ratings.length===1?ratings[0]:ratings.length===0&&ptx?known[ptx]*1.01387:null;
 if(!rating||rating<100||rating>3000)return null;
 const explicit=[...n.matchAll(/(?:\b(?:a\s*\/?\s*r)\s*[:=]?\s*([01]?\.\d{2,3})|([01]?\.\d{2,3})\s*a\s*\/?\s*r\b)/g)].map(m=>Number(m[1]??m[2]));
 const flangeAr=[...n.matchAll(/(?:^|\s)([01]?\.\d{2,3})\s+(?:stal nierdzewna\s+)?(?:(?:\d(?:\.\d+)?["″]\s+)?v[ -]?band|t(?:25|3|4)\b)/g)].map(m=>Number(m[1]));
 const ars=[...new Set([...explicit,...flangeAr].filter(v=>v>=.3&&v<=2))];
 const ar=ars.length===1?ars[0]:null;
 const inlet=n.match(/\b(t25|t3|t4)(?:\s+(twin scroll|divided|open|single scroll))?\s+(?:wlot|inlet)\b/);
 const vb=/\bv[ -]?band\s+(?:wlot|inlet)\b|\bdual v[ -]?band\b|podwójny v[ -]?band/.test(n);
 let flange:TurboCatalogueData['flange']=inlet?(inlet[1]==='t25'?'t25-single':inlet[1]==='t3'?(inlet[2]==='twin scroll'||inlet[2]==='divided'?'t3-twin':'t3-single'):inlet[2]==='twin scroll'||inlet[2]==='divided'?'t4-twin':inlet[2]==='open'||inlet[2]==='single scroll'?'t4-single':null):vb?'vband-single':null;
 const out=n.match(/(\d(?:\.\d+)?["″]\s+(?:marmon\s+)?v[ -]?band|5[ -]?bolt|4[ -]?bolt)\s+(?:wylot|outlet)/);
 const outlet=out?out[1]:vb&&/dual v[ -]?band|podwójny v[ -]?band/.test(n)?'V-Band':null;
 const internal=/\biwg\b|internally wastegated|wewnętrzny wastegate/.test(n);
 const external=/\bewg\b|externally wastegated|zewnętrzny wastegate/.test(n);
 let wg:TurboCatalogueData['wg']=internal===external?null:internal?'internal':'external';
 // PTX28 manufacturer housing table: .64/.86 T25 5-bolt IWG;
 // stainless .64/.82 dual V-band (also T3/T25 adapters) external;
 // .72 dual V-band IWG. No inference for other product families.
 if(ptx&&!internal&&!external&&ar!==null){
  if(flange==='t25-single'&&[.64,.86].includes(ar)&&/5[ -]?bolt/.test(outlet??'')&&/actuat|aktuat|stamping|billet\s+\d/.test(n))wg='internal';
  if(['vband-single','t3-single','t25-single'].includes(flange??'')&&[.64,.82].includes(ar)&&/stal nierdzewna|stainless steel/.test(n)&&/v[ -]?band/.test(outlet??'')&&!/actuat|aktuat|stamping/.test(n))wg='external';
  if(flange==='vband-single'&&ar===.72&&/actuat|aktuat|stamping|billet\s+\d/.test(n))wg='internal';
 }
 return {model:ptx?'PSR '+ptx+' Gen2':n.match(/\bpsr\s+(?:pte\s+)?[a-z0-9]+(?:\s+gen\s*\d)?/i)?.[0]??n.match(/\b(?:gtx?|htx)\d+[a-z0-9]*/i)?.[0]??name,ratingPs:rating,ratingLabel:hp.length&&ratings.length===1?hp[0][1]+' '+hp[0][2].toUpperCase():known[ptx!]+' FWHP',ar,flange,wg,outlet};
}
export function discoverTurbo(row:DiscoveryRow,targetPs:number):DiscoveredPart|null{
 const t=turboCatalogueData(row.name);
 // Deliberately broad nominal class window; unknown ratings are not guessed.
 if(!t||!Number.isFinite(targetPs)||targetPs<=0||t.ratingPs<targetPs||t.ratingPs>targetPs*1.85)return null;
 const brand=row.brand?.trim()||(/pulsar/i.test(row.name)?'Pulsar':/turbosmart/i.test(row.name)?'Turbosmart':/jrspec/i.test(row.name)?'JRspec':/garrett/i.test(row.name)?'Garrett':/turbosystems/i.test(row.name)?'TurboSystems':'—');
 const price=Number(row.proposed_gross);
 const source=ptx28.test(row.name)?'https://pulsarturbo.com/product/psr-ptx28-gen1-gen2-turbine-housings-for-psr2860-psr2867-psr2871-turbos/':undefined;
 return {sku:row.sku,name:row.name,brand,slot:'turbo',turbo:t,source,cataloguePrice:Number.isFinite(price)&&price>0?price:undefined,reason:['Wstępna klasa mocy '+t.ratingLabel+'; A/R '+(t.ar??'do potwierdzenia')+'. Zweryfikuj mapę sprężarki, obudowę, przepływ i przeciwciśnienie.','Preliminary '+t.ratingLabel+' power class; A/R '+(t.ar??'to confirm')+'. Verify compressor map, housing, flow and backpressure.']};
}
/** Provisional ranking, not a predicted spool RPM. A/R is compared only within
 * the same model; different turbine geometries cannot be ranked by A/R alone. */
export function compareTurboCatalogue(a:TurboCatalogueData|null,b:TurboCatalogueData|null,targetPs:number,priority:string,usage:string):number{
 if(!a||!b)return a?-1:b?1:0;
 const known=(t:TurboCatalogueData)=>Number(t.ar===null)+Number(t.wg===null)+Number(t.flange===null)+Number(t.outlet===null);
 const flange=(t:TurboCatalogueData)=>t.flange==='vband-single'||t.flange==='t3-single'?0:t.flange==='t25-single'?2:1;
 const response=priority==='response'||(priority==='balanced'&&usage==='drift');
 const ideal=targetPs*(priority==='power'?1.45:1.25);
 const classScore=(t:TurboCatalogueData)=>Math.abs(t.ratingPs-ideal)/Math.max(1,targetPs);
 const main=known(a)-known(b)||flange(a)-flange(b);
 if(main)return main;
 const cls=classScore(a)-classScore(b);
 if(Math.abs(cls)>1e-8)return cls;
 if(a.model!==b.model)return a.model.localeCompare(b.model);
 if(a.ar!==null&&b.ar!==null&&a.ar!==b.ar){
  if(response)return a.ar-b.ar;
  if(priority==='power')return b.ar-a.ar;
 }
 return Number(b.wg==='internal')-Number(a.wg==='internal');
}


export const pistonDiscoveryCategory=['Silnik i turbo','Kute tłoki'];
export const pistonEngineVersions=['m50b20','m50b25','m50b30-stroker','m52b20','m52b25','m52b25tu','m52b28','m54b22','m54b25','m54b30','2jz-ge','2jz-gte'] as const;
export type PistonCatalogueData={application:'exact'|'review';boreMm:number|null;compressionRatio:number|null;compressionHeightMm:number|null;pinMm:number|null;crownVolumeCc:number|null;packSize:6|null;applicationNote:[string,string]};
const singleNumber=(values:number[])=>{const distinct=[...new Set(values.filter(Number.isFinite))];return distinct.length===1?distinct[0]:null};
export function pistonCatalogueData(name:string,version:string):PistonCatalogueData|null{
 if(!(pistonEngineVersions as readonly string[]).includes(version))return null;
 const n=name.normalize('NFKC').replaceAll(',','.').toLowerCase();
 if(!/tłok|piston/.test(n)||/\+\s*korbowod|(?:pistons?|tłoki).*(?:\+\s*rods|connecting rods)|pierścienie tłokowe|piston rings|^sworzeń|^pin\b/.test(n))return null;
 // The exact engine token is stronger than family/displacement marketing.
 const bmw=[...n.matchAll(/\bm(?:50|52|54)\s*b\s*(?:20|22|25|28|30)(?:\s*tu)?\b/g)].map(m=>m[0].replace(/\s/g,''));
 const toyota=[...n.matchAll(/\b2jz[\s-]*(gte|ge)\b/g)].map(m=>'2jz-'+m[1]);
 const stroker=/\bstroker\b|wał\s*\d+\s*mm|stroke\s*[:=]?\s*\d+/.test(n);
 let application:PistonCatalogueData['application']|null=null;
 let applicationNote:[string,string]=['Kod silnika w nazwie katalogowej. Nie jest potwierdzeniem geometrii.','Engine code in catalogue title. Geometry is not confirmed.'];
 if(version==='m50b30-stroker'){
  if(bmw.includes('m50b30')||/\bm50\s*\/\s*s50b30\b/.test(n)){application='review';applicationNote=['Wariant M50/S50 3.0; projekt z wałem B30 wymaga indywidualnego doboru skoku, długości korby i CH.','M50/S50 3.0 application; B30 crank build requires individual stroke, rod length and CH review.']}
 }else if(version.startsWith('2jz')){
  if(stroker)return null;
  if(toyota.includes(version))application='exact';
  else if(!toyota.length&&/\b2jz\b/.test(n)){application='review';applicationNote=['Katalog podaje rodzinę 2JZ bez rozróżnienia GE/GTE. Potwierdź wersję i geometrię.','Catalogue gives 2JZ family without GE/GTE distinction. Confirm version and geometry.']}
 }else if(!stroker){
  if(bmw.includes(version))application='exact';
  // M50B25 profile does not distinguish NV from TU. Keep these separate
  // as conditional alternatives, never infer cross-fit from the bore.
  if(version==='m50b25'&&(bmw.includes('m50b25tu')||bmw.includes('m50b25')||/\bm50\b.*single vanos/.test(n))){application='review';applicationNote=['M50B25: ustal NV/TU, długość korbowodu i wysokość kompresyjną.','M50B25: confirm NV/TU, rod length and compression height.']}
  if(version==='m52b28'&&!bmw.length&&/\b2\.8\s*l\b/.test(n)&&/\bm52\b/.test(n)){application='review';applicationNote=['Rodzina M52 2.8 w nazwie; wersja i geometria wymagają potwierdzenia.','M52 2.8 family in title; confirm version and geometry.']}
 }
 if(!application)return null;
 const num=(m:RegExpMatchArray)=>Number(m[1]);
 const explicitBore=[...n.matchAll(/\b(?:bore|średnica cylindra)\s*[-:=]?\s*(\d{2,3}(?:\.\d+)?)\s*mm\b/g),...n.matchAll(/\b(\d{2,3}(?:\.\d+)?)\s*mm\s*(?:bore|średnica cylindra)\b/g)].map(num);
 const diameter=explicitBore.length?explicitBore:[...n.matchAll(/\b(\d{2,3}(?:\.\d+)?)\s*mm\b/g)].filter(m=>Number(m[1])>=75&&Number(m[1])<=95&&!/^\s*(?:ch|pin|stroke|sworzeń)\b/.test(n.slice(m.index!+m[0].length))).map(num);
 const cr=[...n.matchAll(/\b(\d{1,2}(?:\.\d+)?)\s*:\s*1\b/g),...n.matchAll(/\b(?:cr|compression ratio|stopień sprężania)\s*[:=]?\s*(\d{1,2}(?:\.\d+)?)\b/g)].map(num).filter(v=>v>=5&&v<=16);
 const metric=(label:string)=>singleNumber([...n.matchAll(new RegExp('(?:\\b('+label+')\\s*[:=-]?\\s*(\\d{1,2}(?:\\.\\d+)?)\\s*mm\\b|\\b(\\d{1,2}(?:\\.\\d+)?)\\s*mm\\s*(?:'+label+')\\b)','g'))].map(m=>Number(m[2]??m[3])));
 const height=metric('ch|compression height|wysokość kompresyjna');
 const inch=[...n.matchAll(/\b(\d(?:\.\d+)?)\s*(?:in\.?|["″])\s*ch\b/g)].map(m=>Math.round(Number(m[1])*25.4*100)/100);
 const crown=[...n.matchAll(/(?:\bdish\s*|\bdome\s*|(?:^|\s))([-+]\s*\d+(?:\.\d+)?)\s*cc\b/g)].map(m=>Number(m[1].replace(/\s/g,'')));
 const packSize=/\b(?:6\s*szt\.?|6\s*pcs|set of 6|komplet 6)\b/.test(n)?6:null;
 return {application,boreMm:singleNumber(diameter.filter(v=>v>=75&&v<=95)),compressionRatio:singleNumber(cr),compressionHeightMm:singleNumber([...(height===null?[]:[height]),...inch]),pinMm:metric('pin|sworzeń|wrist pin'),crownVolumeCc:singleNumber(crown),packSize,applicationNote};
}
export function discoverPiston(row:DiscoveryRow,version:string):DiscoveredPart|null{
 const p=pistonCatalogueData(row.name,version);
 if(!p||!row.sku||row.sku.length>120)return null;
 const brand=row.brand?.trim()||(/wiseco/i.test(row.name)?'Wiseco':/je pistons/i.test(row.name)?'JE Pistons':/manley/i.test(row.name)?'Manley':/wossner|wössner/i.test(row.name)?'Wössner':/\bzrp\b/i.test(row.name)?'ZRP':'—');
 return {sku:row.sku,name:row.name,brand,slot:'pistons',piston:p,reason:[p.applicationNote[0]+' Potwierdź pomiar cylindra, skok wału, długość korbowodu, CH, sworzeń, objętość denka, rzeczywiste CR, luz i liczbę tłoków w opakowaniu.',p.applicationNote[1]+' Verify bore measurement, stroke, rod length, CH, pin, crown volume, actual CR, clearance and pistons per pack.']};
}


/** Catalogue candidates only. A matching code does not prove fitment. */
export const engineDiscoveryPaths:Record<string,string[][]>={
 rods:[['Silnik i turbo','Kute korbowody']],
 bearings:[['Silnik i turbo','Panewki']],
 'bearings-rod':[['Silnik i turbo','Panewki']],
 'bearings-main':[['Silnik i turbo','Panewki']],
 'thrust-bearings':[['Silnik i turbo','Panewki']],
 gasket:[['Silnik i turbo','Uszczelki głowicy i silnika']],
 fasteners:[['Silnik i turbo','Śruby i szpilki ARP']],
 'main-fasteners':[['Silnik i turbo','Śruby i szpilki ARP']],
 camshafts:[['Silnik i turbo','Rozrząd','Wałki rozrządu']],
 'valve-train':[['Silnik i turbo','Elementy głowicy','Talerzyki i sprężynki']],
 'intake-valves':[['Silnik i turbo','Elementy głowicy','Zawory']],
 'exhaust-valves':[['Silnik i turbo','Elementy głowicy','Zawory']],
 'timing-kit':[['Silnik i turbo','Rozrząd','Paski rozrządu']],
 rings:[['Silnik i turbo','Tuleje i pierścienie tłokowe','Pierścienie tłokowe']],
 rail:[['Układ paliwowy','Listwy paliwowe']],
 'intake-manifold':[['Układ dolotowy','Kolektory ssące']],
 clutch:[['Napęd i zawieszenie','Sprzęgło','Zestawy sprzęgła']],
 flywheel:[['Napęd i zawieszenie','Sprzęgło','Koła zamachowe']],
};
export type EnginePartData={
 application:'exact'|'review';kind:string;lengthMm:number|null;pinMm:number|null;bigEndMm:number|null;
 beam:'H'|'I'|'X'|null;packSize:number|null;sizeLabel:string|null;boreMm:number|null;
 thicknessMm:number|null;thread:string|null;camTiming:string|null;applicationNote:[string,string]
};
function engineApplication(name:string,version:string,slot:string):'exact'|'review'|null{
 if(!(pistonEngineVersions as readonly string[]).includes(version))return null;
 const n=name.normalize('NFKC').toLowerCase().replaceAll('tü','tu').replace(/\b(m(?:50|52|54))\s+b/g,'$1b');
 if(version.startsWith('2jz')){
  const ge=/\b2jz[\s-]*ge\b|\b2jz[\s-]*gte\s*\/\s*ge\b/.test(n),gte=/\b2jz[\s-]*gte\b|\b2jz[\s-]*ge\s*\/\s*gte\b/.test(n);
  if(version==='2jz-ge'&&ge||version==='2jz-gte'&&gte)return 'exact';
  return !ge&&!gte&&/\b2jz(?:g\b|[-\s]*g\(t\)e\b|\b)/.test(n)?'review':null;
 }
 if(/\bstroker\b/.test(n)&&version!=='m50b30-stroker')return null;
 const family=version.slice(0,3),target=version.replace('-stroker','');
 const codes=[...n.matchAll(/\b(m(?:50|52|54)b(?:20|22|25|28|30|32)(?:tu)?)(?=\b|m\d{2}b)/g)].map(m=>m[1]);
 // Slash shorthand e.g. M52B20/25/28 is not an exact engine token.
 if(codes.includes(target)){
  if(version==='m50b25'||version==='m50b30-stroker'||version==='m52b28')return 'review';
  return 'exact';
 }
 if(version==='m50b25'&&codes.includes('m50b25tu'))return 'review';
 // Shorthand listing and family-only matches remain review-only. For rods
 // a single-VANOS code must never be treated as a TU part.
 if(version==='m52b25tu'&&codes.includes('m52b25'))return slot.startsWith('bearings')?'review':null;
 const shorthand=[...n.matchAll(/\b(m(?:50|52|54)b)(?:20|22|25|28|30|32)(\s*\/\s*(?:20|22|25|28|30|32)(?:\s*\/\s*(?:20|22|25|28|30|32))*)/g)];
 if(shorthand.some(m=>m[2].split('/').map(x=>m[1]+x.trim()).includes(target)))return 'review';
 if(codes.length)return null;
 if(new RegExp('\\b'+family+'(?:tu)?\\b').test(n))return 'review';
 return null;
}
export function enginePartData(name:string,version:string,slot:string):EnginePartData|null{
 if(!Object.hasOwn(engineDiscoveryPaths,slot))return null;
 const application=engineApplication(name,version,slot);if(!application)return null;
 const n=name.normalize('NFKC').toLowerCase().replaceAll(',','.');
 let kind='';
 if(slot==='rods'&&/korbowod|korbowód|connecting rods?/.test(n)&&!/^(?:śrub|panew|tulej)|\+\s*tłok/.test(n))kind='rod';
 if(['bearings','bearings-rod','bearings-main','thrust-bearings'].includes(slot)){
  kind=/panewki? korbowod|rod bearings?|conrod bearing/.test(n)?'rod-bearing':/panewki? główn|main bearings?/.test(n)?'main-bearing':/panewki? oporow|thrust bearing|thrust washer/.test(n)?'thrust-bearing':'';
  if(slot==='bearings-rod'&&kind!=='rod-bearing'||slot==='bearings-main'&&kind!=='main-bearing'||slot==='thrust-bearings'&&kind!=='thrust-bearing'||slot==='bearings'&&kind==='thrust-bearing')return null;
 }
 if(slot==='gasket'&&/uszczelk.*głowic|head gasket/.test(n)&&!/zestaw uszczelek|gasket set/.test(n))kind='head-gasket';
 if(slot==='fasteners'&&/szpilk.*głowic|śrub.*głowic|head stud|head bolt/.test(n)&&!/śruby korbowod/.test(n))kind='head-fastener';
 if(slot==='main-fasteners'&&/szpilk.*(?:podpór|wału|panewek główn)|śrub.*(?:podpór|panewek główn)|main stud|main bolt/.test(n))kind='main-fastener';
 if(slot==='camshafts'&&/wał(?:ki|ek|ków) rozrządu|camshafts?/.test(n)&&!/koło|kółko|czujnik/.test(n))kind='camshaft';
 if(slot==='valve-train'&&/sprężyn|valve spring/.test(n))kind='valve-spring';
 if(slot==='intake-valves'&&/zawór (?:dolot|ssąc)|zawor(?:y|ów) (?:dolot|ssąc)|intake valves?/.test(n))kind='intake-valve';
 if(slot==='exhaust-valves'&&/zawór wydech|zawor(?:y|ów) wydech|exhaust valves?/.test(n))kind='exhaust-valve';
 if(slot==='timing-kit'&&/pasek rozrządu|timing belt/.test(n))kind='timing-belt';
 if(slot==='rings'&&/pierścienie tłokowe|piston rings?/.test(n))kind='piston-rings';
 if(slot==='rail'&&/listwa paliwowa|fuel rail/.test(n)&&!/adapter|mocowanie|wspornik/.test(n))kind='fuel-rail';
 if(slot==='intake-manifold'&&/kolektor ssący|kolektor dolotowy|intake manifold|plenum/.test(n)&&!/adapter|uszczelka|flansza/.test(n))kind='intake-manifold';
 if(slot==='clutch'&&/zestaw sprzęgła|komplet sprzęgła|clutch kit|clutch set/.test(n))kind='clutch-kit';
 if(slot==='flywheel'&&/koło zamachowe|flywheel/.test(n)&&!/śrub|bolt|adapter/.test(n))kind='flywheel';
 if(!kind)return null;
 const metric=(label:string)=>singleNumber([...n.matchAll(new RegExp('(?:\\b(?:'+label+')\\s*[:.=-]?\\s*(\\d{1,3}(?:\\.\\d+)?)\\s*mm\\b|\\b(\\d{1,3}(?:\\.\\d+)?)\\s*mm\\s*(?:'+label+')\\b)','g'))].map(m=>Number(m[1]??m[2])));
 const explicitLength=metric('length|dł(?:ugość)?|center.to.center|c.t.c')??(kind==='rod'?singleNumber([...n.matchAll(/\b(?:dł\.|length)\s*(1[2345]\d(?:\.\d+)?)\b/g)].map(m=>Number(m[1]))):null);
 const tailLength=kind==='rod'?[...n.matchAll(/\b(1[2345]\d(?:\.\d+)?)\s*mm\b/g)].map(m=>Number(m[1])):[];
 const lengthMm=kind==='rod'?explicitLength??singleNumber(tailLength):null;
 const pinMm=kind==='rod'?metric('pin|sworzeń|small end'):null;
 const bigEndMm=kind==='rod'?metric('big end|stopa|średnica stopy'):null;
 const beamMatch=n.match(/\b([hix])\s*-?\s*beam\b/);
 const beam=beamMatch?beamMatch[1].toUpperCase() as EnginePartData['beam']:null;
 const pack=kind==='rod'?(/\b(?:single|kuty korbowód|1\s*szt)\b/.test(n)?1:/\b(?:6\s*szt|6\s*pcs|set of 6|komplet 6)\b/.test(n)?6:null):null;
 const bearing=kind.endsWith('-bearing');
 const sizeLabel=bearing?(/\bstd\b/.test(n)?(/\bhx\b/.test(n)?'STD / HX':'STD'):n.match(/(?:^|\s)([+-]?(?:0?\.\d{2,3}))(?=\s|$)/)?.[1]??null):null;
 const gasket=kind==='head-gasket';
 const boreMm=gasket?singleNumber([...n.matchAll(/\b(7[5-9]|8\d|9[0-5])(?:\.\d+)?\s*mm\b/g)].map(m=>Number(m[0].replace(/\s*mm$/,'')))):null;
 const thicknessMm=gasket?singleNumber([...n.matchAll(/\b(\d(?:\.\d+)?)\s*mm\b/g)].map(m=>Number(m[1])).filter(v=>v>=.3&&v<=5).concat([...n.matchAll(/(?:^|\s)(0?\.\d{2,3})\s*(?:inch|["″])/g)].map(m=>Math.round(Number(m[1])*2540)/100))):null;
 const thread=/fastener$/.test(kind)?n.match(/\bm\d{1,2}\s*x\s*\d(?:\.\d+)?\b/)?.[0]?.toUpperCase()??null:null;
 const camTiming=kind==='camshaft'?(/non[- ]?vvti|non[- ]?vvt-i/.test(n)?'non-VVT-i':/\bvvt[- ]?i\b/.test(n)?'VVT-i':null):null;
 return {application,kind,lengthMm,pinMm,bigEndMm,beam,packSize:pack,sizeLabel,boreMm,thicknessMm,thread,camTiming,applicationNote:application==='exact'?['Kod silnika w nazwie katalogowej; potwierdź wersję i geometrię.','Engine code in catalogue title; verify variant and geometry.']:['Zgodność na poziomie rodziny silnika, wymaga indywidualnej weryfikacji.','Engine-family application only; individual verification required.']};
}
export function discoverEnginePart(row:DiscoveryRow,version:string,slot:string,category:string[]):DiscoveredPart|null{
 if(!Object.hasOwn(engineDiscoveryPaths,slot)||!engineDiscoveryPaths[slot].some(p=>p.join('/')===category.join('/')))return null;
 const p=enginePartData(row.name,version,slot);if(!p||!row.sku||row.sku.length>120)return null;
 const brand=row.brand?.trim()||([[/\bprism\b/i,'Prism'],[/\bk1\b/i,'K1'],[/manley/i,'Manley'],[/wiseco/i,'Wiseco'],[/zrp/i,'ZRP'],[/fmic\.pro/i,'FMIC.Pro'],[/brian crower/i,'Brian Crower'],[/\bacl\b/i,'ACL'],[/king racing/i,'King Racing'],[/cometic/i,'Cometic'],[/athena/i,'Athena'],[/\barp\b/i,'ARP'],[/ftwl/i,'FTWL'],[/kelford/i,'Kelford'],[/supertech/i,'SuperTech'],[/gates/i,'Gates']] as [RegExp,string][]).find(([re])=>re.test(row.name))?.[1]||'—';
 const notes:Record<string,[string,string]>={
 rod:['Potwierdź długość C-C, średnicę sworznia i stopy, szerokość, śruby, materiał, obciążenie i liczbę sztuk.','Verify C-C length, pin and big-end bore, width, bolts, material, load and pack count.'],
 'head-gasket':['Potwierdź średnicę otworu, grubość po ściśnięciu, powierzchnie i rzeczywiste CR.','Confirm gasket bore, compressed thickness, deck finish and actual CR.'],
 'camshaft':['Potwierdź VANOS/VVT-i, wznios, fazy, sprężyny i luz tłok–zawór.','Confirm VANOS/VVT-i, lift, duration, springs and piston-to-valve clearance.'],
 'clutch-kit':['Dobór po ustaleniu skrzyni, koła zamachowego, wieloklinu, średnicy i przewidywanego momentu; nie na podstawie mocy.','Select after confirming gearbox, flywheel, spline, diameter and expected torque; not power alone.'],
 flywheel:['Sprawdź połączenie z wałem, rozrusznik, skrzynię, sprzęgło, offset i dopuszczalne obroty.','Confirm crank mounting, starter, gearbox, clutch, offset and RPM limit.'],
 'fuel-rail':['Potwierdź głowicę/kolektor, długość wtryskiwaczy, porty, paliwo, przepływ i ciśnienie.','Confirm head/intake, injector length, ports, fuel, flow and pressure.'],
 'intake-manifold':['Potwierdź głowicę, przepustnicę, listwę, osprzęt i miejsce w nadwoziu.','Confirm head, throttle, fuel rail, accessories and chassis clearance.'],
 'piston-rings':['Potwierdź średnicę i rowki konkretnego tłoka, materiał, wymagany luz zamka i czy pierścienie są w zestawie tłoków.','Confirm exact piston bore and grooves, material, required end gap and whether rings are included in the piston set.']
 };
 const note=notes[p.kind]??(p.kind.endsWith('-bearing')?['Rozmiar i luz olejowy dobierz po pomiarze czopów, gniazd i danych producenta. Nie interpretuj samego sufiksu jako szlifu.','Select size and oil clearance after measuring journals and housings and consulting manufacturer data. Do not interpret suffix alone as undersize.']:p.kind.endsWith('-fastener')?['Potwierdź gwint, materiał bloku, wymagania obróbki, procedurę i moment/naciąg producenta.','Confirm thread, block material, machining, installation and manufacturer torque/stretch.']:['Potwierdź wariant silnika, wymiary, zawartość zestawu i procedurę montażu.','Confirm engine variant, dimensions, kit contents and installation procedure.']);
 return {sku:row.sku,name:row.name,brand,slot,enginePart:p,reason:[p.applicationNote[0]+' '+note[0],p.applicationNote[1]+' '+note[1]]};
}
export function engineGeometryConflicts(piston:PistonCatalogueData|null,rod:EnginePartData|null,gasket:EnginePartData|null):{pin:boolean;gasket:boolean}{
 return {pin:!!(piston?.pinMm!=null&&rod?.pinMm!=null&&Math.abs(piston.pinMm-rod.pinMm)>.05),gasket:!!(piston?.boreMm!=null&&gasket?.boreMm!=null&&gasket.boreMm<piston.boreMm)};
}
