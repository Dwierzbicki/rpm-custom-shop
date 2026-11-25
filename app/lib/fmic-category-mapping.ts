import {FMIC_CATEGORY_TREE} from '../fmic-categories';
import {categoryPath} from '../category-routing';

export type FmicCategoryMatch={sourcePath:string;targetPath:string[];url:string|null;status:'exact'|'normalized'|'parent_review'|'unmapped'};

const approvedAliases:Record<string,string[]>={
  "Elektronika > CANchecked > Wyświetlacze": [
    "Elektronika",
    "CANchecked",
    "Urządzenia pomiarowe"
  ],
  "Elektronika > Wskaźniki > Wskaźniki": [
    "Elektronika",
    "Wskaźniki"
  ],
  "Napęd i zawieszenie > Zestawy skrętu > Zestawy skrętu": [
    "Napęd i zawieszenie",
    "Zestawy skrętu"
  ],
  "Układ chłodzenia > Końcówki olejowe > Push on": [
    "Układ chłodzenia",
    "Końcówki olejowe",
    "Push On"
  ],
  "Układ chłodzenia > Podstawki korki i termostaty oleju": [
    "Układ chłodzenia",
    "Podstawki, korki i termostaty oleju"
  ],
  "Układ dolotowy > Kolanka i rury nierdzewne > Spawane kolanka nierdzewne welding porn": [
    "Układ dolotowy",
    "Kolanka i rury nierdzewne",
    "Spawane kolanka nierdzewne"
  ],
  "Układ dolotowy > Łączniki silikonowe > Zatyczki do króćców podcisnienia": [
    "Układ dolotowy",
    "Łączniki silikonowe",
    "Zatyczki do króćców podciśnienia"
  ],
  "Układ dolotowy > Oil catch tank > Oil catch tank": [
    "Układ dolotowy",
    "Oil catch tank"
  ],
  "Układ paliwowy > Filtry paliwa > Filtry Paliwa": [
    "Układ paliwowy",
    "Filtry paliwa"
  ],
  "Układ paliwowy > Swirl Poty > Swirl Poty": [
    "Układ paliwowy",
    "Swirl Poty"
  ],
  "Układ paliwowy > Wtryskiwacze > Wtryskiwacze Dedykowane": [
    "Układ paliwowy",
    "Wtryskiwacze",
    "Wtryskiwacze dedykowane"
  ],
  "Układ paliwowy > Wtryskiwacze > Wtryskiwacze Uniwersalne": [
    "Układ paliwowy",
    "Wtryskiwacze",
    "Wtryskiwacze uniwersalne"
  ],
  "Układ paliwowy > Zbiorniki paliwa > Zbiorniki Paliwa": [
    "Układ paliwowy",
    "Zbiorniki paliwa"
  ]
};

function key(value:string){
 return value.normalize('NFKC').trim().toLocaleLowerCase('pl-PL')
 .replace(/(\d)\s*['’′º]/g,'$1°').replace(/\s+/g,' ');
}

/** Match against the actual storefront navigation, not product title guesses.
 * Parent matches are suggestions requiring approval before publication.
 */
export function mapFmicCategory(sourcePath:string):FmicCategoryMatch{
 const cleaned=sourcePath.split('>').map(p=>p.trim()).filter(Boolean);
 const alias=approvedAliases[cleaned.join(' > ')];
 const parts=alias??cleaned;
 if(parts.length>2&&key(parts[0])===key('Napęd i zawieszenie')&&key(parts[1])===key('Elementy poliuretanowe'))parts.splice(2);
 if(parts.length===3&&parts[0]==='Układ dolotowy'&&parts[1]==='Kolanka i rury nierdzewne'&&parts[2]==='Spawane kolanka nierdzewne welding porn')parts[2]='Spawane kolanka nierdzewne';
 const targetPath:string[]=[];
 let nodes=FMIC_CATEGORY_TREE;
 for(const part of parts){
  const matches=nodes.filter(node=>key(node.name)===key(part));
  if(matches.length!==1)break;
  const node=matches[0];
  targetPath.push(node.name);
  nodes=node.children;
 }
 if(!targetPath.length)return {sourcePath,targetPath,url:null,status:'unmapped'};
 const complete=targetPath.length===parts.length;
 const status=complete?(targetPath.join(' > ')===sourcePath.split('>').map(p=>p.trim()).filter(Boolean).join(' > ')?'exact':'normalized'):'parent_review';
 return {sourcePath,targetPath,url:categoryPath(targetPath),status};
}
