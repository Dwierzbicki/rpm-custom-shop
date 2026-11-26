# Business Rules
2026-11-26 | W KODZIE / DO WERYFIKACJI
- Klient widzi jeden katalog, cenę brutto PLN, wspólne kategorie i filtry; realizacja zachowuje źródło produktu. Źródła: app/api/admin/fmic-preview/route.ts, app/lib/fmic-cart.ts.
- Ręczne produkty: visible=false wyklucza publikację; stockStatus available/order/unavailable. Na zamówienie nie oznacza magazynowego dostępnego od ręki. Konfiguracje mają wymagane opcje i dopłaty.
- Cena i wymagane opcje są weryfikowane przez serwer w app/api/orders/route.ts. Zamówienia ręczne używają productId, linie FMIC własnego SKU i wyceny. Wspólna finalizacja obu źródeł: PLAN.
- Nie uruchamiaj rzeczywistej płatności, wysyłki wiadomości lub zakupu u dostawcy podczas testów bez zgody. Aktualny stan integracji sprawdzaj przed każdą zmianą.
- Marże, stawki dostawy i zasady płatności: nie zgaduj; odczytaj konfigurację i potwierdź decyzje biznesowe. Bez danych nie publikuj nowych wartości.

## Automatyczna publikacja opisów FMIC — 2026-11-26
W KODZIE: zatwierdzona reguła automatycznej publikacji tylko autentycznego opisu dokładnie dopasowanego produktu. Wymagamy zgodnego SKU, MPN, nazwy i URL strony FMIC oraz niepustej marki ze źródła; sprzeczna marka feedu blokuje publikację. Gdy feed nie podaje marki, dokładna tożsamość strony dostawcy jest podstawą, a marka pochodzi z tej strony; nie stanowi niezależnej weryfikacji producenta. Brak zgodności pozostawia szkic. Ręczne zapisy i wycofania oznaczamy jako manual i nie nadpisujemy. Stare szkice publikujemy partiami po 10 tylko przy zgodnym tekście, marce, prostym niezmienionym technical i czasach potwierdzających pracę automatu. Bez zgadywania parametrów i bez publikowania cudzych opisów z innych źródeł. Zmiana opublikowanej treści nadal wymaga weryfikacji.

## Kolektory RPM — konfigurator (2026-11-26)
W KODZIE: szablony 2JZ GE i BMW M50/M52/M54. BMW: obowiązkowy pojedynczy wybór nadwozia BMW E36 / E46 / E8x / E9x w tym samym produkcie; w szablonie dodatkowo silnik M50/M52/M54. Nadwozie docelowe nie jest deklaracją seryjnej kompatybilności. Flansza T3/T4 single/twin oraz V-Band (single), WG automatyczny: twin 2×, pozostałe 1×. EGT z/bez króćców. Dopłaty edytowalne w panelu; wartości startowe 0 to szablon, nie wycena. Nowy produkt ukryty do uzupełnienia ceny i danych przez operatora; nie przywracamy demo. Istniejące własne opcje zachowane. Wybrana wartość Nadwozie trafia do klucza konfiguracji koszyka i walidacji zamówienia.
