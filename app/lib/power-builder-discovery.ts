/** First catalogue discovery rule. It produces candidates, not fitment approvals.
 * Brand is inferred only from explicit product naming or known supplier SKU families.
 * Keep accessory and vehicle-specific parts out, even when supplier categories are broad. */
export type DiscoveryRow={sku:string;name:string;brand?:string|null;source?:string|null};
export type DiscoveredPart={sku:string;name:string;brand:string;slot:'bov'|'regulator'|'fuel-post-filter'|'fuel-pre-filter'|'intercooler';reason:[string,string]};
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
