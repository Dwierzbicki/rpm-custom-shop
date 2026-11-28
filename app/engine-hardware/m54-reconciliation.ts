import type {Diagram} from './catalog';
// Selected source-position audit. These lists are not an exhaustive OEM export.
// A reference row is not a verified installation or proof of applicability.
const scopes=[
 {id:'11_9905',label:'Blok silnika',source:'https://www.realoem.com/bmw/enUS/showparts?diagId=11_9905&id=EN52-EUR-05_2001_E46_BMW_330i',positions:['02','03','04','05','06','07','08','09','10','11','13'],conditional:[]},
 {id:'11_9908',label:'Głowica',source:'https://www.realoem.com/bmw/enUS/showparts?diagId=11_9908&id=AW51-EUR---E46-BMW-330i',positions:['05','06','07','08','09','12','13','14','15','18'],conditional:['13','14','15']},
 {id:'11_9918',label:'Miska olejowa',source:'https://www.realoem.com/bmw/enUS/showparts?diagId=11_9918&id=AN56-EUR-03_2000_E46_BMW_330i',positions:['02','03','04','05','06','07','13','16'],conditional:[]}
];
export function reconcileM54(diagrams:Diagram[]){
 return scopes.map(scope=>{
  const d=diagrams.find(d=>d.engine==='M54B30'&&d.id===scope.id&&d.source===scope.source);
  const rows=scope.positions.map(position=>({position,status:scope.conditional.includes(position)?'variant':d?.usages.some(u=>u.position===position)?'reference':'missing'}));
  return {...scope,rows,reference:rows.filter(r=>r.status==='reference').length,missing:rows.filter(r=>r.status==='missing').length,variant:rows.filter(r=>r.status==='variant').length};
 });
}
