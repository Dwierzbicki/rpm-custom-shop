'use client';

import { useState, type ChangeEvent } from 'react';
import { previewSupplierCsv, type SupplierCsvPreview } from '@/lib/supplier-csv-preview';

/**
 * Staging-only importer UI. Mount exclusively inside an authenticated admin page.
 * It does not call an API, write to PostgreSQL, or publish anything.
 */
export default function SupplierCsvPreviewPanel() {
  const [preview, setPreview] = useState<SupplierCsvPreview | null>(null);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview(null);
    setError('');
    setFilename(file?.name ?? '');
    if (!file) return;
    if (file.size > 5_000_000) {
      setError('Plik jest za duży (maksymalnie 5 MB).');
      return;
    }
    setLoading(true);
    try {
      const text = await file.text();
      setPreview(previewSupplierCsv(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się odczytać pliku.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="Podgląd importu produktów" style={{ display: 'grid', gap: 16 }}>
      <h2>Import ofert dostawcy — podgląd CSV</h2>
      <p>Import testowy: dane pozostają w przeglądarce. Żaden produkt nie zostanie zapisany ani opublikowany.</p>
      <label>
        Wybierz plik CSV (maks. 5 MB)
        <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} />
      </label>
      {loading && <p role="status">Wczytywanie pliku…</p>}
      {error && <p role="alert">{error}</p>}
      {preview && (
        <>
          <p role="status">Plik: {filename}. Poprawne: {preview.rows.length}; duplikaty: {preview.duplicates.length}; błędy: {preview.errors.length}.</p>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Wiersz</th><th>SKU</th><th>EAN</th><th>MPN</th><th>Nazwa</th><th>Cena źródłowa</th><th>Stan</th><th>Wariant</th></tr></thead>
              <tbody>{preview.rows.slice(0, 100).map(row => (
                <tr key={row.line}>
                  <td>{row.line}</td><td>{row.sku}</td><td>{row.ean}</td><td>{row.mpn}</td>
                  <td>{row.name}</td><td>{row.price}</td><td>{row.stock}</td><td>{row.variant}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {preview.rows.length > 100 && <p>Wyświetlono pierwszych 100 poprawnych rekordów.</p>}
          {preview.errors.length > 0 && (
            <details><summary>Błędy ({preview.errors.length})</summary>
              <ul>{preview.errors.slice(0, 100).map(e => <li key={e.line}>Wiersz {e.line}: {e.message}</li>)}</ul>
            </details>
          )}
          {preview.duplicates.length > 0 && (
            <details><summary>Duplikaty ({preview.duplicates.length})</summary>
              <ul>{preview.duplicates.slice(0, 100).map(d => <li key={d.line}>Wiersz {d.line} powtarza wiersz {d.firstLine}: {d.key}</li>)}</ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
