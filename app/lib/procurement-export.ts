import type {ProcurementPlan,ProcurementLine} from './procurement-plan';

export type SupplierPurchaseGroup={
 supplier:'fmic'|'mtuning';
 lines:ProcurementLine[];
 itemCount:number;
 estimatedNetTotal:number;
};
const money=(value:number)=>value.toFixed(2).replace('.',',');

/**
 * A supplier-specific file for manual B2B entry, with NO customer personal
 * information. Does not place, send, or confirm orders on any provider.
 *
 * CSV cells are neutralized against spreadsheet formula injection, including
 * values with a leading space/tab before =, +, -, or @.
 */
export function safeCsvCell(input:string):string{
 const clean=input.replace(/[\r\n\u2028\u2029\u0000-\u001f]/g,' ').trim();
 const neutral=/^[=+\-@]/.test(clean)?"'"+clean:clean;
 return '"'+neutral.replace(/"/g,'""')+'"';
}

export function groupSupplierPurchases(plan:ProcurementPlan):SupplierPurchaseGroup[]{
 if(!plan.canDraft||plan.counts.blocked>0||plan.lines.length===0){
  throw new Error('Nie można eksportować planu z niezatwierdzonymi pozycjami');
 }
 const grouped=new Map<'fmic'|'mtuning',ProcurementLine[]>();
 for(const line of plan.lines){
  if(line.blocked||line.supplier!=='fmic'&&line.supplier!=='mtuning'||!line.supplierSku||
     line.purchaseNet===null||line.shippingNet===null||line.estimatedNetTotal===null||
     !Number.isSafeInteger(line.qty)||line.qty<1){
   throw new Error('W planie znajduje się pozycja bez kompletnej oferty dostawcy');
  }
  const lines=grouped.get(line.supplier)??[];
  lines.push(line);
  grouped.set(line.supplier,lines);
 }
 return [...grouped.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([supplier,lines])=>({
  supplier,lines,itemCount:lines.reduce((sum,line)=>sum+line.qty,0),
  estimatedNetTotal:Math.round(lines.reduce((sum,line)=>sum+line.estimatedNetTotal!,0)*100)/100,
 }));
}

export function makeSupplierCsv(plan:ProcurementPlan,supplier:'fmic'|'mtuning'){
 if(!/^[1-9][0-9]{0,17}$/.test(plan.orderId))throw new Error('Nieprawidłowy numer zamówienia RPM');
 const group=groupSupplierPurchases(plan).find(group=>group.supplier===supplier);
 if(!group)throw new Error('Brak pozycji dla wybranego dostawcy');
 const header=['Zamowienie RPM','Dostawca','SKU dostawcy','Nazwa',
  'Ilosc','Warianty','Cena netto PLN/szt.','Wysylka netto PLN/szt.',
  'Suma szacunkowa netto PLN','Termin dni','SKU RPM','Pozycja RPM','Uwagi'];
 const body=group.lines.map(line=>[
  plan.orderId,supplier.toUpperCase(),line.supplierSku!,line.offerName??line.name,
  String(line.qty),
  Object.entries(line.options).map(([key,value])=>key+': '+value).join(' | '),
  money(line.purchaseNet!),money(line.shippingNet!),money(line.estimatedNetTotal!),
  String(line.leadDays??''),line.sku,String(line.index+1),
  'DO WERYFIKACJI: realny stan, cena, warianty, adres dostawy oraz koszty transportu',
 ]);
 const csv='\uFEFF'+[header,...body].map(row=>row.map(value=>safeCsvCell(value)).join(';')).join('\r\n')+'\r\n';
 return {filename:'rpm-zakup-'+plan.orderId+'-'+supplier+'.csv',csv,
  count:group.itemCount,estimatedNetTotal:group.estimatedNetTotal};
}
