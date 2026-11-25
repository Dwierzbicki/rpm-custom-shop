export type CategoryCount={path:string[];count:number};
export type CategoryNode={name:string;path:string[];count:number;children:CategoryNode[]};
export function buildSearchTree(rows:CategoryCount[]):CategoryNode[]{
 const roots:CategoryNode[]=[];
 for(const row of rows){
 if(!row.path?.length||!Number.isFinite(row.count)||row.count<=0)continue;
 let level=roots;
 for(let i=0;i<row.path.length;i++){
 const name=row.path[i];let node=level.find(n=>n.name===name);
 if(!node){node={name,path:row.path.slice(0,i+1),count:0,children:[]};level.push(node)}
 node.count+=row.count;level=node.children;
 }}
 function sort(nodes:CategoryNode[]){nodes.sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'pl'));nodes.forEach(n=>sort(n.children));return nodes}
 return sort(roots)
}
export function searchCategoryHref(path:string,query:string){return path+'?'+new URLSearchParams({fmicPreview:'1',q:query.trim()})}
