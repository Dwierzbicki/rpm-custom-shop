import FmicPanel from '../FmicPanel';
import Link from 'next/link';
export default function FmicAdminPage(){
 return <main className="admin-page rpm-settings-page fmic-workspace"><div className="admin-top"><div><span className="eyebrow">RPM CUSTOM / DOSTAWCY</span><h1>FMIC <em>Catalog Center</em></h1><p>Zarządzanie katalogiem dostawcy, cenami i kategoriami.</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><a className="outline" href="/sklep" target="_blank" rel="noopener">Otwórz katalog sklepu</a><Link className="outline" href="/admin/suppliers">Pozostali dostawcy</Link></div></div><FmicPanel/></main>;
}
