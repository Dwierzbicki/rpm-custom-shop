import SupplierCsvPreviewPanel from '@/components/admin/SupplierCsvPreviewPanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Import produktów | RPM Custom Admin', robots: { index: false, follow: false } };

export default function AdminImportPage() {
  return <main className="admin-page rpm-settings-page">
    <div className="admin-top"><div><h1>Import produktów</h1>
      <p>Podgląd ofert FMIC i MTuning przed zapisaniem. Import nie publikuje produktów.</p>
    </div></div>
    <section className="rpm-settings-card"><SupplierCsvPreviewPanel /></section>
  </main>;
}
