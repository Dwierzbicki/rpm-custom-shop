# Architecture
2026-11-26 | W KODZIE
- Next.js 15 App Router (app/), React 19, TypeScript, Node 22, PostgreSQL, Cloudinary, Render. Źródła: package.json, README.md, app/lib/db.ts.
- Jeden pool getDbPool; ręczne produkty rpm_catalog (JSONB), usunięte rpm_catalog_deleted; dostawca rpm_fmic_catalog. app/lib/catalog-db.ts generuje SKU RPM-xxxxx.
- Wspólna taksonomia app/fmic-categories.ts i app/category-routing.ts; filtry app/lib/fmic-facets.ts.
- Publiczne /api/catalog/fmic deleguje do app/api/admin/fmic-preview/route.ts. Kod łączy manual i FMIC przed paginacją; cache zależy m.in. od danych manual. Admin dostawcy pozostaje osobny.
- Kanoniczny PDP /produkt/[slug]/[sku]; app/lib/read-product.ts wywołuje wspólny endpoint produktu, FmicProductPreview prezentuje oba źródła. app/lib/fmic-cart.ts zachowuje różne identyfikatory linii.
- app/api/orders/route.ts przyjmuje productId dla ręcznego katalogu; pełny wspólny checkout pozostaje zadaniem otwartym.
- Wdrożenie main przez Render; status live nie dowodzi poprawności funkcjonalnej. Strona nadal chroniona blokadą dostępu; nie zmieniaj bez uzgodnienia.

- 2026-11-26 | W KODZIE: app/lib/fmic-description-publication.ts — wspólna bramka tożsamości, lokalna publikacja do 10 dawnych szkiców co cykl workera niezależnie od next_request_at, publication_origin chroni decyzje ręczne. Limit RSS workerów zależny od limitu kontenera (768 MiB dla 2 GiB, fallback 320 MiB); zachowane dotychczasowe odstępy dostawcy i blokady advisory. Nie utożsamiać zwiększenia budżetu z przyspieszeniem zewnętrznych żądań.

- 2026-11-26 | W KODZIE: fmic-description-local.ts przetwarza do 3 odrębnych SKU już pobranych do PostgreSQL równolegle, pod dotychczasową blokadą workera. Nie czeka na okno HTTP. Po partii ponownie odczytuje sterowanie; pobieranie stron nadal maks. 1/30 s, obrazów bez zmian. Mismatch automatu trafia do review, ręczne przypisanie oznaczone manual. Brak zwiększenia częstotliwości żądań do dostawcy.

- 2026-11-26 | W KODZIE: polecane produkty (ProductCard), koszyk/Garage, Power Builder i podobne produkty używają natywnego href z productPath. Stare ?product=id przekierowuje do kanonicznego PDP; stary ProductDetailView nie jest montowany przez Shop. Zachowano zapis ręcznych produktów do Garage w wspólnym PDP. Blokada sklepu i checkout bez zmian.

- 2026-11-26 | Publiczny `/sklep` bez kategorii/frazy używa wspólnego listingu 24 SKU/stronę, a nie pustej odpowiedzi admin preview. Licznik globalny unikalny, kategorie z istniejącego mechanizmu membership (współdzielone kategorie mogą liczyć ten sam produkt w dwóch gałęziach), manual i FMIC przed paginacją, filtry producenta/dostępności/ceny. W KODZIE. Benchmark root dodany; wydajność i RWD do weryfikacji.
