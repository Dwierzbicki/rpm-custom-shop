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

/** Shared taxonomy for supplier and manually maintained offers. The legacy
 * category remains available for configurators; targetCategory is authoritative. */
export const manualCategoryAliases:Record<string,string[]>={
 Korbowody:['Silnik i turbo','Kute korbowody'],Tłoki:['Silnik i turbo','Kute tłoki'],Panewki:['Silnik i turbo','Panewki'],Pierścienie:['Silnik i turbo','Tuleje i pierścienie tłokowe','Pierścienie tłokowe'],
 'Uszczelki głowicy':['Silnik i turbo','Uszczelki głowicy i silnika'],'Mocowania głowicy':['Silnik i turbo','Śruby i szpilki ARP'],'Wały korbowe':['Silnik i turbo','Kute wały i podpory wału'],
 Kolektory:['Układ wydechowy','Kolektory wydechowe'],Turbo:['Silnik i turbo','Turbosprężarki'],Intercoolery:['Układ chłodzenia','Intercoolery'],Wastegate:['Układ wydechowy','Wastegate'],Elektronika:['Elektronika'],Paliwo:['Układ paliwowy'],Osprzęt:['Pozostałe']
};
export function validCategoryPath(value:unknown):value is string[]{
 if(!Array.isArray(value)||!value.length||!value.every(x=>typeof x==='string'))return false;
 const resolved=resolveCategoryPath(categoryPath(value));
 return !!resolved&&resolved.length===value.length&&resolved.every((name,i)=>name===value[i]);
}
export function manualCategoryPath(product:{category:string;targetCategory?:string[]}):string[]{
 if(validCategoryPath(product.targetCategory))return product.targetCategory;
 const alias=manualCategoryAliases[product.category];if(alias)return [...alias];
 const matching=manualCategoryOptions.filter(p=>p.at(-1)===product.category);
 return matching.length===1?matching[0]:[];
}
function flattenCategories(nodes:typeof FMIC_CATEGORY_TREE,parent:string[]=[]):string[][]{
 return nodes.flatMap(node=>{const path=[...parent,node.name];return [path,...flattenCategories(node.children,path)]});
}
export const manualCategoryOptions=flattenCategories(FMIC_CATEGORY_TREE);
export function legacyManualCategory(path:string[]):string{
 if(path.join(' > ')==='Układ wydechowy > Kolektory wydechowe')return 'Kolektory';
 return path.at(-1)??'Osprzęt';
}
