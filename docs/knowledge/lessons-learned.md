# Lessons Learned
## LL-001 | 2026-11-25 — produkt ręczny niewidoczny w sklepie
Zaobserwowany problem: RPM-00031 widoczny w adminie nie pojawiał się w listingu. Przyczyna w ówczesnym kodzie: listing korzystał wyłącznie z FMIC. Rozwiązanie w kodzie: wspólny odczyt, kategorie, filtry i paginacja; nie oddzielny blok produktów. Zapobieganie: CAT-01–04 i PDP-01. E2E jeszcze NOT RUN.

## LL-002 | 2026-11-26 — build nie jest testem funkcjonalnym
Render live oraz udany build potwierdzają wdrożenie, nie poprawność danych i interakcji. Zapobieganie: oddzielne wyniki testów jednostkowych, API, UI, wydajności i środowiska w qa-regression.md.

## LL-003 | 2026-11-26 — nie mieszaj źródeł koszyka
Wspólny wygląd nie oznacza wspólnego identyfikatora realizacji. Kod app/lib/fmic-cart.ts rozróżnia ręczne productId i fmicSku. Ryzyko: przekazanie niewłaściwej pozycji dostawcy. Zapobieganie: CART-01, ORD-01 i serwerowa walidacja.

## LL-004 | 2026-11-26 — konfigurator zależny od starej kategorii
Dowód: live 1a04eac8, log aktualizacji [], oba SKU mają canonical leaf Kolektory wydechowe nierdzewne, marker skus=[]. Wniosek: sprawdzać faktyczną wartość kategorii przed migracją, nie opierać typu produktu wyłącznie na aliasie. Marker sukcesu tylko po potwierdzeniu oczekiwanej liczby rekordów i postconditions. Regresja z realnym liściem i zachowaniem ceny. Naprawa w kodzie, ponowny odczyt DB wymagany.
