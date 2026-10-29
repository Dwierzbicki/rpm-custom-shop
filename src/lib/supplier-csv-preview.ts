/**
 * Supplier CSV staging parser. Pure functions: no database writes or publishing.
 * Values are strings until explicitly validated to avoid rounding supplier prices.
 */
export type SupplierCsvRow = {
  line: number;
  sku: string;
  ean: string;
  mpn: string;
  name: string;
  price: string;
  stock: string;
  variant: string;
};
export type SupplierCsvPreview = {
  rows: SupplierCsvRow[];
  errors: { line: number; message: string }[];
  duplicates: { line: number; firstLine: number; key: string }[];
  headers: string[];
};
const aliases: Record<keyof Omit<SupplierCsvRow, "line">, string[]> = {
  sku: ["sku", "symbol", "kod", "product_code", "indeks"],
  ean: ["ean", "gtin", "barcode", "kod_ean"],
  mpn: ["mpn", "manufacturer_part_number", "numer_producenta"],
  name: ["name", "nazwa", "product_name", "produkt"],
  price: ["price", "cena", "net_price", "cena_netto"],
  stock: ["stock", "quantity", "qty", "stan", "ilosc"],
  variant: ["variant", "wariant", "variation"],
};
function normalizeHeader(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "_");
}
function parseRecords(input: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted || cell === "") quoted = !quoted;
      else throw new Error("Nieprawidłowy cudzysłów w CSV");
    } else if (!quoted && ch === delimiter) {
      row.push(cell); cell = "";
    } else if (!quoted && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(v => v.trim())) records.push(row);
      row = []; cell = "";
    } else cell += ch;
  }
  if (quoted) throw new Error("Niezamknięte pole CSV");
  row.push(cell);
  if (row.some(v => v.trim())) records.push(row);
  return records;
}
function detectDelimiter(header: string): string {
  const candidates = [";", ",", "\t"];
  return candidates.sort((a, b) => header.split(b).length - header.split(a).length)[0];
}
export function previewSupplierCsv(
  input: string,
  options: { delimiter?: string; maxRows?: number } = {}
): SupplierCsvPreview {
  if (input.length > 5_000_000) throw new Error("Plik CSV przekracza limit 5 MB");
  const clean = input.replace(/^\uFEFF/, "");
  const delimiter = options.delimiter ?? detectDelimiter(clean.split(/\r?\n/, 1)[0]);
  if (![";", ",", "\t"].includes(delimiter)) throw new Error("Nieobsługiwany separator");
  const records = parseRecords(clean, delimiter);
  if (!records.length) throw new Error("Pusty plik CSV");
  const headers = records[0].map(normalizeHeader);
  const columns = Object.fromEntries(Object.entries(aliases).map(([field, names]) => [
    field, headers.findIndex(h => names.includes(h))
  ])) as Record<keyof Omit<SupplierCsvRow, "line">, number>;
  if (columns.sku < 0 && columns.ean < 0 && columns.mpn < 0) {
    throw new Error("Brak identyfikatora produktu: SKU, EAN lub MPN");
  }
  if (columns.name < 0 || columns.price < 0) {
    throw new Error("Brak wymaganej kolumny nazwy lub ceny");
  }
  const rows: SupplierCsvRow[] = [], errors: SupplierCsvPreview["errors"] = [];
  const duplicates: SupplierCsvPreview["duplicates"] = [];
  const seen = new Map<string, number>();
  const maxRows = Math.min(Math.max(options.maxRows ?? 10_000, 1), 10_000);
  if (records.length - 1 > maxRows) throw new Error("Przekroczony limit wierszy CSV");
  for (let i = 1; i < records.length; i++) {
    const record = records[i], line = i + 1;
    if (record.length !== headers.length) {
      errors.push({ line, message: "Nieprawidłowa liczba kolumn" }); continue;
    }
    const get = (key: keyof typeof columns) =>
      columns[key] < 0 ? "" : record[columns[key]].trim();
    const row: SupplierCsvRow = {
      line, sku: get("sku"), ean: get("ean"), mpn: get("mpn"),
      name: get("name"), price: get("price"), stock: get("stock"),
      variant: get("variant"),
    };
    if (!row.name || !(row.sku || row.ean || row.mpn)) {
      errors.push({ line, message: "Brak nazwy lub identyfikatora" }); continue;
    }
    const numericPrice = row.price.replace(/\s/g, "").replace(",", ".");
    if (!/^\d+(\.\d{1,4})?$/.test(numericPrice) || Number(numericPrice) <= 0) {
      errors.push({ line, message: "Nieprawidłowa cena" }); continue;
    }
    if (row.stock && !/^\d+$/.test(row.stock)) {
      errors.push({ line, message: "Nieprawidłowy stan magazynowy" }); continue;
    }
    if (row.ean && (!/^\d{8}$|^\d{12,14}$/.test(row.ean))) {
      errors.push({ line, message: "Nieprawidłowy format EAN/GTIN" }); continue;
    }
    const key = [row.sku || row.ean || row.mpn, row.variant].join("::").toUpperCase();
    if (seen.has(key)) {
      duplicates.push({ line, firstLine: seen.get(key)!, key }); continue;
    }
    seen.set(key, line);
    rows.push(row);
  }
  return { rows, errors, duplicates, headers };
}
