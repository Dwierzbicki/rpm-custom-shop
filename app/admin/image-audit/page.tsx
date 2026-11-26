import FmicImages from '../suppliers/FmicImages';
import {Image} from 'lucide-react';
import '../../styles/admin-quality-center.css';
export default function ImageAuditPage(){return <main className="admin-page rpm-settings-page rpm-quality-center"><header className="admin-top rpm-quality-heading"><div><span className="eyebrow">RPM CUSTOM / ZAAWANSOWANE</span><h1><Image size={28}/> Audyt zdjęć</h1><p>Kontrola jakości grafik, kolejka automatyczna i ręczna weryfikacja produktów.</p></div></header><section className="rpm-settings-card fmic-center"><FmicImages/></section></main>}
