export type AuditMode='pages'|'special'|'all';
export type AuditPhase='prefix'|'supplier';
export type AuditItem={path:string;sku?:string;cursor:string};
export type AuditIssue={id:string;path:string;sku?:string;result:string;checkedAt:string};
export type AuditState={mode:AuditMode;phase:AuditPhase;cursor:string;total:number;checked:number;ok:number;issues:number;done:boolean;startedAt:string};
export const auditModes:AuditMode[]=['pages','special','all'];
export function classifyAuditResponse(status:number,type:string,contentType:string,html:string,sku?:string){
 if(type==='opaqueredirect'||status>=300&&status<400)return 'Przekierowanie';
 if(status!==200)return 'HTTP '+status;
 if(!contentType.toLowerCase().includes('text/html'))return '200 — nie HTML';
 if(/<form\b[^>]*action=["']\/site-access["']/i.test(html))return 'Blokada dostępu';
 if(sku&&!html.includes('data-rpm-audit-sku="'+new URLSearchParams({sku}).toString()+'"'))return '200 — brak zgodności SKU';
 return '200';
}
export function auditCsv(issues:AuditIssue[]){
 const cell=(value:string)=>'"'+(/^[=+\-@\t\r\n]/.test(value)?"'"+value:value).replace(/"/g,'""')+'"';
 return '\uFEFF'+[['URL','SKU','Wynik','Data'],...issues.map(i=>[i.path,i.sku??'',i.result,i.checkedAt])].map(row=>row.map(cell).join(';')).join('\r\n');
}
