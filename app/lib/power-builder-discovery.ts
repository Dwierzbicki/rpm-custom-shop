/** First catalogue discovery rule. It produces candidates, not fitment approvals.
 * Brand is inferred only from explicit product naming or known supplier SKU families.
 * Keep accessory and vehicle-specific parts out, even when supplier categories are broad. */
export type DiscoveryRow={sku:string;name:string;brand?:string|null;source?:string|null};
export type DiscoveredPart={sku:string;name:string;brand:string;slot:'bov';reason:[string,string]};
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
