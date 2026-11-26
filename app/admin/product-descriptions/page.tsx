import FmicEnrichment from '../suppliers/FmicEnrichment';
import {FileText} from 'lucide-react';
import '../../styles/admin-quality-center.css';
export default function ProductDescriptionsPage(){return <main className="admin-page rpm-settings-page rpm-quality-center"><header className="admin-top rpm-quality-heading"><div><span className="eyebrow">RPM CUSTOM / ZAAWANSOWANE</span><h1><FileText size={28}/> Opisy i parametry</h1><p>Centrum jakości treści: weryfikacja SKU, ręczna edycja i automatyzacja publikacji.</p></div></header><FmicEnrichment/></main>}
