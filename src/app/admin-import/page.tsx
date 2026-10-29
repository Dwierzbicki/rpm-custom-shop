import SupplierCsvPreviewPanel from '@/components/admin/SupplierCsvPreviewPanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Importer CSV | RPM Custom', robots: { index: false, follow: false } };

export default function AdminImportPage() {
  return (
    <main className="wrap" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <p className="eyebrow">RPM CUSTOM / ADMIN / STAGING</p>
      <SupplierCsvPreviewPanel />
    </main>
  );
}
