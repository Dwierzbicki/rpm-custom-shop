# Roadmap
2026-11-26 | kolejność proponowana na podstawie rozmowy
| Etap | Status | Warunek ukończenia |
|---|---|---|
| Wspólne kategorie i katalog | W KODZIE | CAT-01–04, benchmark |
| Wspólna karta i warianty | W KODZIE | PDP-01, poprawna konfiguracja |
| Wspólny koszyk | W KODZIE | CART-01, weryfikacja cen |
| Wspólny checkout | PLAN | ORD-01, źródła realizacji, idempotencja |
| Power Builder | PLAN dalszego rozwoju | Weryfikacja reguł i kompatybilności |
| Przygotowanie publicznej sprzedaży | PLAN | bezpieczeństwo, dostawa, płatności, e-maile, E2E; osobna zgoda na publikację |

Ostatni sprawdzony deploy: 83000d99 live 2026-11-26. Nie utożsamiaj z akceptacją funkcjonalną. Kolejny krok: regresja wspólnego katalogu przed rozbudową checkoutu.

2026-11-26 | Koszyk Premium i jawne stany gotowości w kodzie; wspólna finalizacja nadal PLAN. Przed jej uruchomieniem wymagane uzgodnione reguły dostawy, płatności i model realizacji obu źródeł (nie odblokowywać starego endpointu zamówień).

2026-11-26 | Variant Manager V1 W KODZIE: osobna tabela, ręczne skany, decyzje bez publikacji. Następnie walidacja na aktualnym feedzie, grupy kolorów, indeks storefront przed paginacją, PDP wybór dokładnego SKU, benchmark przed/po. Warianty techniczne turbo dopiero po zweryfikowaniu osi i kombinacji.

2026-11-26 | VAR PDP W KODZIE: wyłącznie zaakceptowane rodziny, linki do konkretnych SKU, live cena/stan i fail-closed przy konflikcie. Następnie wydzielony indeks członkostwa/rodzin dla listingów, zgodne filtry/SKU search przed paginacją i benchmark cold/warm. Nie zatwierdzano grup masowo.

- VAR PLP W KODZIE: grupowanie przed LIMIT, liczniki i filtry rodzin. Indeks materializowanego członkostwa/inkrementalna synchronizacja nadal PLAN; benchmark pełnej skali wymagany przed masową akceptacją HEL.

- VAR PERF: root-local grouping activation in code, no migration yet. Next measure full public API, then design durable membership index and incremental refresh before bulk review. No mass approval.

- VAR INDEX / SYNC W KODZIE: opcjonalny indeks członkostwa z migracją/rollback, automatyczne odświeżenie kandydatów po udanym ręcznym XML, przyrostowe zapisy (pełna detekcja). Uruchomienie migracji na kopii/produkcji po osobnej zgodzie, następnie benchmark i grupowe zatwierdzanie z kontrolą zakresu. Bez zmian decyzji istniejących rodzin.

- VAR INDEX AKTYWNY; benchmark pilotażu PASS funkcjonalnie, wykrył wolny root/producer. VAR-PERF-02 pushdown and single-facet cache reuse W KODZIE. Pełny root nadal wymaga obliczenia rozkładu producentów na zimnym cache; po pomiarach rozważyć materializację atrybutów, oddzielna autoryzacja DDL. Bulk approval nadal PLAN.
