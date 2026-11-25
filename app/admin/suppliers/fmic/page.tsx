import FmicPanel from '../FmicPanel';
import Link from 'next/link';
export default function FmicAdminPage(){
 return <main className="admin-page rpm-settings-page fmic-workspace"><div className="admin-top"><div><span className="eyebrow">RPM CUSTOM / DOSTAWCY</span><h1>FMIC <em>Catalog Center</em></h1><p>Zarządzanie katalogiem dostawcy, cenami i kategoriami.</p></div><Link className="outline" href="/admin/suppliers">Pozostali dostawcy</Link></div><FmicPanel/></main>;
}
