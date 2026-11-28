import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {parts,diagrams,hasLicensedImage} from '../catalog';
import {getHardwareRelease} from '../release-loader';
import {buildHardwareReport} from '../report-data';
import PrintReportButton from './PrintReportButton';
import './report.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Engine Hardware – zestawienie części',robots:{index:false,follow:false}};
type Query={engine?:string|string[];profile?:string|string[];lang?:string|string[]};
export default async function HardwareReportPage({searchParams}:{searchParams:Promise<Query>}){
 const q=await searchParams,check=getHardwareRelease(),release=check.ok?check.release:null;
 if(!release&&process.env.ENGINE_HARDWARE_PREVIEW!=='1')notFound();
 const engine=typeof q.engine==='string'?q.engine:'',profileId=typeof q.profile==='string'?q.profile:'';
 const en=q.lang==='en',tr=(pl:string,english:string)=>en?english:pl;
 const report=buildHardwareReport({engine,profileId,revision:release?.revision??null,profiles:release?.profiles??[],parts:release?.parts??parts,diagrams:release?.diagrams??diagrams});
 if(!report)notFound();
 const language=en?'en':'pl',maker=engine.startsWith('2JZ')?'Toyota':'BMW';
 const date=new Intl.DateTimeFormat(en?'en-GB':'pl-PL',{dateStyle:'long',timeZone:'Europe/Warsaw'}).format(new Date());
 const pending=tr('Do weryfikacji','Pending verification');
 return <main className="ehr" lang={language}>
 <div className="ehr-actions"><div><a href="/engine-hardware">{tr('← Wróć do katalogu','← Back to catalogue')}</a><small>{tr('W oknie drukowania wybierz „Zapisz jako PDF”.','Choose Save as PDF in the print dialog.')}</small></div><PrintReportButton en={en}/></div>
 <div className="ehr-paper">
 <header className="ehr-header"><div className="ehr-brand">RPM CUSTOM <span> / MOTOLAB</span></div><p>ENGINE HARDWARE</p><h1>{maker} {engine}</h1><p>{report.profile?[report.profile.vehicle,report.profile.market,report.profile.production].join(' · '):tr('E46 330i · różne profile źródłowe','E46 330i · mixed reference profiles')}</p><div className="ehr-meta">{date} · {report.revision?tr('Wydanie ','Release ')+report.revision:tr('WERSJA ROBOCZA','DRAFT')}</div></header>
 <section className="ehr-stats"><div><strong>{report.groups.length}</strong><span>{tr('Schematy','Diagrams')}</span></div><div><strong>{report.uniqueOem}</strong><span>{tr('Numery OEM','OEM numbers')}</span></div><div><strong>{report.usageCount}</strong><span>{tr('Pozycje katalogowe','Catalogue rows')}</span></div></section>
 <div className="ehr-notice"><strong>{report.revision?tr('Zestawienie źródłowe dla wybranego profilu','Source listing for selected profile'):tr('KATALOG NIEKOMPLETNY – NIE JEST LISTĄ ZAKUPOWĄ','INCOMPLETE CATALOGUE – NOT A SHOPPING LIST')}</strong><p>{tr('Raport zawiera wszystkie aktualnie dostępne pozycje dla wybranego zakresu, niezależnie od filtrów w sklepie. Ilości odnoszą się do pozycji na schematach; nie sumujemy ich między schematami, ponieważ mogą opisywać to samo fizyczne połączenie.','The report includes all currently available rows for the selected scope, independent of storefront filters. Quantities refer to diagram positions and are not added across diagrams because they may refer to the same physical joint.')}</p>{!report.revision&&<p>{tr('Nie ustalono pełnej liczby elementów silnika. Dane pochodzą z różnych wariantów E46 i wymagają sprawdzenia dopasowania, wymiarów, montażu i aktualności numerów. Nie zamawiaj kompletów na podstawie tego raportu.','The total engine fastener count is not established. Data comes from different E46 variants and requires fitment, dimension, installation and supersession checks. Do not order a complete kit using this report.')}</p>}</div>
 {report.groups.map(({diagram,rows},i)=><section className="ehr-section" key={diagram.id}>
 <div className="ehr-section-heading"><h2><span>{String(i+1).padStart(2,'0')}</span> {diagram.title[language]}</h2><p>{diagram.vehicle} · {diagram.sourceId??diagram.id} · {rows.length} {tr('poz.','rows')}</p><a href={diagram.source} target="_blank" rel="noopener noreferrer">{tr('Dokumentacja źródłowa ↗','Source documentation ↗')}</a><small className="ehr-source-url">{diagram.source}</small></div>
 {report.revision&&hasLicensedImage(diagram)&&diagram.image&&<img className="ehr-diagram" src={diagram.image.path} alt={diagram.title[language]}/>}
 <table><colgroup><col className="ehr-col-pos"/><col className="ehr-col-item"/><col className="ehr-col-qty"/><col/></colgroup><thead><tr><th>{tr('Poz.','Pos.')}</th><th>{tr('Element / OEM / wymiar','Part / OEM / size')}</th><th>{tr('Ilość','Qty')}</th><th>{tr('Montaż i weryfikacja','Installation and verification')}</th></tr></thead><tbody>
 {rows.map(({usage:u,part:p})=><tr key={u.position+':'+u.oem}><td>{u.position}</td><td><strong>{p?.name[language]??pending}</strong><span className="ehr-oem">{u.oem}</span><small>{p?.dimension||pending}</small>{p?.catalogStatus==='discontinued'&&<small className="ehr-warning">{tr('Wycofany w źródle; następca niepotwierdzony','Discontinued in source; successor unverified')}</small>}</td><td className="ehr-qty">{u.quantity}<small>{u.quantityUnit==='set'?tr('kpl.','sets'):tr('szt.','pcs.')}</small></td><td>{u.location[language]}<small>{tr('Dokładny montaż: ','Exact mounting: ')}{u.mountingEvidence||pending}</small><small>{tr('Moment: ','Torque: ')}{u.torque&&u.torqueSource?u.torque+' · '+u.torqueSource:pending}</small><small>{tr('Wymiana: ','Replacement: ')}{u.replacement==='always'?tr('Zawsze nowy','Always replace'):u.replacement==='inspect'?tr('Według instrukcji','Inspect per procedure'):u.replacement==='not-applicable'?tr('Nie dotyczy','Not applicable'):pending}</small>{p?.technicalEvidence&&<small>{tr('Źródło techniczne: ','Technical evidence: ')}{p.technicalEvidence}</small>}</td></tr>)}
 </tbody></table></section>)}
 {report.gaps.length>0&&<section className="ehr-gaps"><h2>{tr('Obszary bez danych referencyjnych','Areas without reference data')}</h2><p>{report.gaps.reduce((n,g)=>n+g.items.length,0)} {tr('obszarów z listy kontrolnej. Pozostałe obszary mają dane częściowe; żaden licznik nie stanowi dowodu kompletności.','checklist areas. Other areas have partial data; counts do not prove completeness.')}</p>{report.gaps.map(g=><div key={g.id} className="ehr-gap-group"><h3>{g.title[language]} ({g.items.length})</h3><ul>{g.items.map(c=><li key={c.id}>{c.title[language]}</li>)}</ul></div>)}</section>}
 <footer>RPM CUSTOM · rpmcustom.pl · {tr('Dokument informacyjny – nie zastępuje instrukcji producenta.','Reference document – not a substitute for manufacturer instructions.')}</footer>
 </div></main>;
}
