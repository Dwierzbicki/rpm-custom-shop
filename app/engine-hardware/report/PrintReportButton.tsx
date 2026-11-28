'use client';
export default function PrintReportButton({en}:{en:boolean}){
 return <button type="button" className="ehr-print-button" onClick={()=>window.print()}>{en?'Save as PDF / Print':'Zapisz jako PDF / Drukuj'}</button>;
}
