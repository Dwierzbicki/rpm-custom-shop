/** First catalogue discovery rule. It produces candidates, not fitment approvals.
 * Brand is inferred only from explicit product naming or known supplier SKU families.
 * Keep accessory and vehicle-specific parts out, even when supplier categories are broad. */
export type DiscoveryRow={sku:string;name:string;brand?:string|null;source?:string|null;proposed_gross?:number|string|null};
export type DiscoveredPart={sku:string;name:string;brand:string;slot:string;reason:[string,string];injectorPackSize?:1|6;injectorFlowCc?:number;pumpFlowLph?:number;turbo?:TurboCatalogueData;source?:string;cataloguePrice?:number};
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
