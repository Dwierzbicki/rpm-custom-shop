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

- 2026-11-26 | Metadane social generowane wspólnie przez app/lib/social-metadata.ts; fallback JPG w prebuild przez Sharp. Bez zmiany middleware, robots i zasad dostępu. Podgląd FB nie pobierze chronionego PDP w trybie zamkniętym; odblokowanie publicznego sklepu wymaga decyzji operatora.

- 2026-11-26 | Social sharing w zamkniętym sklepie: niezalogowane GET/HEAD strony głównej nadal serwuje formularz blokady (rewrite na /site-access), lecz z publicznymi metadanymi pełnej marki (ten sam opis Open Graph co strona główna). Sam formularz nadal informuje o ograniczonym dostępie. Dokładnie jeden publiczny statyczny plik /optimized/social-card.jpg dla GET/HEAD; brak wyjątku UA, brak dostępu do katalogu, API, produktów, admina. Robots/noindex, logowanie, cookies bez zmian. W KODZIE.

- 2026-11-26 | SKU jako część URL: zwykłe numery zachowują /produkt/slug/SKU, znaki specjalne (w tym / i %) trafiają do parametru ?sku= przez URLSearchParams. Jedna opcjonalna trasa catch-all obsługuje oba formaty oraz stare rozdzielone ścieżki, bez podwójnego dekodowania. Canonical i OG korzystają ze wspólnego productPath. SKU w API/DB bez zmian, brak poluzowania blokady. W KODZIE.

- 2026-11-26 | Admin /link-audit: ręczny audyt w przeglądarce, chronione API listy adresów (paginacja 40, keyset SKU, aktualna widoczność katalogu). GET tylko własne adresy, redirect manual, jedna operacja naraz i 1 s przerwy, Web Locks między kartami. IndexedDB przechowuje atomowo checkpoint i problemy; zamknięcie karty zatrzymuje skan. Bez automatycznego startu, nowych tabel DB i wyjątków autoryzacji. Marker data-rpm-audit-sku pozwala sprawdzić zgodność HTML produktu. Brak zamrożonej migawki katalogu; dokładne kody przekierowań niedostępne w fetch manual. W KODZIE.

- 2026-11-26 | Variant Manager V1: odrębna tabela rpm_variant_families (snapshot kandydatów i decyzji), skan ręczny tylko SELECT z katalogu, SQL grupuje przed paginacją panelu. Zakresy colors (końcowe słowo koloru, identyczna reszta nazwy/kategoria/brand), HEL (bazowe SKU, zgodne kody i słowa koloru, osobno hamulce/sprzęgło). Maks. 40 SKU, unikalne kolory. Fingerprint tożsamości bez ceny i dostępności; ponowny skan zachowuje decyzje i oznacza konflikty, również zniknięcie grupy. Zatwierdzanie kontroluje aktualne SKU i zapisuje dokładny snapshot. Bez zmian importera, API publicznego i listingu. DDL tylko nowa tabela/indeks, brak zmian danych źródłowych; rollback przez wyłączenie panelu, tabela zachowana. W KODZIE.

- 2026-11-26 | VAR PDP: opcjonalna read-only rodzina zatwierdzona (present, fingerprint zgodny z reviewed_fingerprint, dokładnie jeden kandydat dla SKU). Jedno zapytanie do zatwierdzonych snapshotów i aktualnych SKU; gdy któryś znika/zmienia tożsamość, cała rodzina ukryta, zwykły PDP działa. Cena/dostępność z żywego feedu, zdjęcia/opis przez dotychczasowy PDP konkretnego SKU. Native href zachowuje canonical, historię i dokładną tożsamość koszyka. Bez DDL na PDP i bez zmiany listingu/importu. W KODZIE.
