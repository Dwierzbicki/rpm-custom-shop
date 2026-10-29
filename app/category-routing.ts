import {FMIC_CATEGORY_TREE} from './fmic-categories';
export const categorySlug=(name:string)=>name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const categoryPath=(names:string[])=>'/sklep/'+names.map(categorySlug).join('/');
export function resolveCategoryPath(pathname:string):string[]|null{
 const parts=pathname.replace(/\/$/,'').split('/').filter(Boolean);
 if(parts[0]!=='sklep')return null;
 if(parts.length===1)return [];
 let nodes=FMIC_CATEGORY_TREE;const names:string[]=[];
 for(const slug of parts.slice(1)){const node=nodes.find(n=>categorySlug(n.name)===slug);if(!node)return null;names.push(node.name);nodes=node.children;}
 return names;
}
