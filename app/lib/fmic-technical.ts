// Extract only explicit, category-specific values; retain the original source text.
export type TechnicalField={key:string;label:string;value:string};
export type ProductTechnical={intro:string;fields:TechnicalField[];warranty:string};
const fields=[
 ['compressor_wheel','Wirnik ssący','Wirnik\\s+ssący'],
 ['turbine_wheel','Wirnik wydechowy','Wirnik\\s+wydechowy'],
 ['compressor_inlet','Wlot muszli ssącej','Wlot\\s+muszli\\s+ssącej'],
 ['compressor_outlet','Wylot muszli ssącej','Wylot\\s+muszli\\s+ssącej'],
 ['turbine_inlet','Wlot muszli wydechowej','Wlot\\s+muszli\\s+wydechowej'],
 ['turbine_outlet','Wylot muszli wydechowej','Wylot\\s+muszli\\s+wydechowej'],
 ['oil_feed','Zasilanie olejem','(?:Flansza\\s+)?zasilania\\s+olejem'],
 ['oil_drain','Spływ oleju','(?:Flansza\\s+)?spływu\\s+oleju'],
 ['water_thread','Gwint portu wodnego','Gwint\\s+portu\\s+wodnego'],
 ['warranty','Gwarancja','Gwarancja']
] as const;
export function parseProductTechnical(name:string,description:string,category:string[],sku=''):ProductTechnical{
 const empty={intro:description,fields:[],warranty:''};
 if(!category.includes('Turbosprężarki tuningowe')||!description.trim())return empty;
 const clean=description.replace(/\u00a0/g,' ').trim();
 const marker=/\bSpecyfikacja\s*:/i.exec(clean);
 if(!marker)return empty;
 const body=clean.slice(marker.index+marker[0].length);
 const regex=new RegExp('(?:^|\\s)('+fields.map(f=>f[2]).join('|')+')\\s*:\\s*','giu');
 const matches=[...body.matchAll(regex)];
 // Avoid discarding unknown prefixes or turning prose into a table.
 if(matches.length<2||body.slice(0,matches[0].index).trim())return empty;
 const out:TechnicalField[]=[];let warranty='';
 const add=(key:string,label:string,value:string)=>{if(value&&!out.some(f=>f.key===key))out.push({key,label,value})};
 const model=name.match(/\b(PSR\s*[\d]{3,5}[A-Z0-9]*(?:\s+Gen\s*\d+)?|GTX?\d{4}[A-Z0-9]*)\b/i);
 const power=name.match(/\b(\d{2,4})\s*(HP|KM)\b/i);
 const ar=name.match(/(?:^|\s)(\d*[.,]\d{2})\s+(?:T3|T4)\b/i);
 if(model)add('model','Model',model[1]);
 if(power)add('power','Deklarowana moc',power[1]+' '+power[2].toUpperCase());
 if(ar)add('ar','A/R',ar[1].replace(',','.'));
 for(let i=0;i<matches.length;i++){
 const m=matches[i],def=fields.find(f=>new RegExp('^(?:'+f[2]+')$','iu').test(m[1]));
 if(!def)continue;
 let value=body.slice((m.index??0)+m[0].length,matches[i+1]?.index??body.length).trim();
 if(!value)continue;
 if(def[0]==='warranty'){warranty=value;continue}
 if(def[0].endsWith('_wheel'))value=value.replace(/^(\d+(?:[.,]\d+)?)\s*[*x×]\s*(\d+(?:[.,]\d+)?)\s*mm$/i,'$1 × $2 mm');
 add(def[0],def[1],value);
 }
 if(/łożysk\w*\s+kulkow/i.test(name))add('bearing','Łożyskowanie','Kulkowe');
 if(out.length<2)return empty;
 let intro=clean.slice(0,marker.index).trim();
 const normalizedName=name.replace(/\u00a0/g,' ').trim();
 if(intro.startsWith(normalizedName)&&sku&&intro.slice(normalizedName.length).trimStart().startsWith('- '+sku+' -'))intro=normalizedName;
 return {intro:intro||normalizedName,fields:out,warranty};
}

/** Facet values are already normalized by the catalog SQL. Published explicit specs win. */
export function mergeTechnicalFields(technical:ProductTechnical,facets:TechnicalField[]):ProductTechnical{
 const fields=[...technical.fields];
 const aliases:Record<string,string>={flange:'turbine_inlet'};
 for(const item of facets){
  if(!item.value.trim()||fields.some(f=>f.key===(aliases[item.key]??item.key)))continue;
  const unit=/\((mm|cm|ml|cc\/min|l\/h|PSI)\)/.exec(item.label)?.[1];
  const value=item.key==='compression'?item.value+':1':item.key==='bend'?item.value+'°':unit?item.value+' '+unit:item.value;
  fields.push({key:aliases[item.key]??item.key,label:item.label.replace(/ \((mm|cm|ml|cc\/min|l\/h|PSI)\)/,''),value});
 }
 return {...technical,fields};
}
export function splitTechnicalFields(fields:TechnicalField[],category:string[]){
 const turbo=category.includes('Turbosprężarki tuningowe');
 const preferred=turbo?['power','ar','turbine_inlet','bearing']:['piston_bore','compression','rod_length','rod_type','pipe_size','bend','pipe_length','core_dimensions','flow','pump_flow','wastegate_mm','spacer_thickness','pcd','center_bore','oil_rows','viscosity','volume_ml','color'];
 const prioritized=preferred.flatMap(key=>fields.filter(f=>f.key===key));
 const highlights=(turbo?prioritized:[...prioritized,...fields.filter(f=>!prioritized.includes(f))]).slice(0,4);
 const remaining=fields.filter(f=>!highlights.some(h=>h.key===f.key));
 const split=Math.ceil(remaining.length/2);
 return {highlights,tables:[remaining.slice(0,split),remaining.slice(split)].filter(group=>group.length>0),remaining};
}
