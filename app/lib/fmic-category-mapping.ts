import {FMIC_CATEGORY_TREE} from '../fmic-categories';
import {categoryPath} from '../category-routing';

export type FmicCategoryMatch={sourcePath:string;targetPath:string[];url:string|null;status:'exact'|'normalized'|'parent_review'|'unmapped'};

function key(value:string){
 return value.normalize('NFKC').trim().toLocaleLowerCase('pl-PL')
 .replace(/(\d)\s*['’′º]/g,'$1°').replace(/\s+/g,' ');
}

/** Match against the actual storefront navigation, not product title guesses.
 * Parent matches are suggestions requiring approval before publication.
 */
export function mapFmicCategory(sourcePath:string):FmicCategoryMatch{
 const parts=sourcePath.split('>').map(p=>p.trim()).filter(Boolean);
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
 const status=complete?(targetPath.every((name,i)=>name===parts[i])?'exact':'normalized'):'parent_review';
 return {sourcePath,targetPath,url:categoryPath(targetPath),status};
}
