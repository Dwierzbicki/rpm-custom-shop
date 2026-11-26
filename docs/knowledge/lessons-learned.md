# Lessons Learned
## LL-001 | 2026-11-25 — produkt ręczny niewidoczny w sklepie
Zaobserwowany problem: RPM-00031 widoczny w adminie nie pojawiał się w listingu. Przyczyna w ówczesnym kodzie: listing korzystał wyłącznie z FMIC. Rozwiązanie w kodzie: wspólny odczyt, kategorie, filtry i paginacja; nie oddzielny blok produktów. Zapobieganie: CAT-01–04 i PDP-01. E2E jeszcze NOT RUN.

## LL-002 | 2026-11-26 — build nie jest testem funkcjonalnym
Render live oraz udany build potwierdzają wdrożenie, nie poprawność danych i interakcji. Zapobieganie: oddzielne wyniki testów jednostkowych, API, UI, wydajności i środowiska w qa-regression.md.

## LL-003 | 2026-11-26 — nie mieszaj źródeł koszyka
Wspólny wygląd nie oznacza wspólnego identyfikatora realizacji. Kod app/lib/fmic-cart.ts rozróżnia ręczne productId i fmicSku. Ryzyko: przekazanie niewłaściwej pozycji dostawcy. Zapobieganie: CART-01, ORD-01 i serwerowa walidacja.

## LL-004 | 2026-11-26 — konfigurator zależny od starej kategorii
Dowód: live 1a04eac8, log aktualizacji [], oba SKU mają canonical leaf Kolektory wydechowe nierdzewne, marker skus=[]. Wniosek: sprawdzać faktyczną wartość kategorii przed migracją, nie opierać typu produktu wyłącznie na aliasie. Marker sukcesu tylko po potwierdzeniu oczekiwanej liczby rekordów i postconditions. Regresja z realnym liściem i zachowaniem ceny. Naprawa w kodzie, ponowny odczyt DB wymagany.

- 2026-11-26 | Nie zakładać, że encodeURIComponent chroni ukośnik w dynamicznym segmencie na wszystkich warstwach proxy. Testować rzeczywiste SKU dostawcy, w tym %, /, + i spacje, oraz zachowanie starego linku; nie zmieniać identyfikatora magazynowego dla potrzeb URL.

- 2026-11-26 | Po deployu klient może mieć runtime poprzedniego buildu i żądać nieistniejących hashy JS/CSS. Zrzut tuż po przełączeniu, F5 pomogło. Nie cofać katalogu ani wyłączać autoryzacji na podstawie ChunkLoadError. Wczesny limitowany reload + React error boundary; osobno testować niespójność wersji i trwały brak zasobu. Zachować lazy loading.

- DEP-01 follow-up: F5 recovery is fallback, not removal of version skew. Native Next deploymentId configured; to eliminate 404 of old lazy chunks, retain immutable build assets in separate versioned storage through deploys. Do not attach disk to main service without decision (Render persistent disks disable zero-downtime deployment); do not publicly expose protected storefront files or store build artifacts in product DB without authorization.
