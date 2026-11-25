import type {CartLine,Product} from '../data';
export function collectionTotal(lines:CartLine[],products:Product[]){
 return lines.reduce((sum,l)=>sum+(l.unitPrice??products.find(p=>p.id===l.productId)?.price??0)*l.qty,0);
}
export function changeLineQuantity(lines:CartLine[],key:string,delta:number){
 return lines.map(x=>x.key===key?{...x,qty:Math.max(1,Math.min(50,x.qty+delta))}:x);
}
export function removeCollectionLine(lines:CartLine[],key:string){return lines.filter(x=>x.key!==key)}
export function appendCollectionLine(lines:CartLine[],line:CartLine){
 return lines.some(x=>x.key===line.key)?lines.map(x=>x.key===line.key?{...x,qty:x.qty+line.qty}:x):[...lines,line];
}
