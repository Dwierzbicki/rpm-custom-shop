# Business Rules
2026-11-26 | W KODZIE / DO WERYFIKACJI
- Klient widzi jeden katalog, cenę brutto PLN, wspólne kategorie i filtry; realizacja zachowuje źródło produktu. Źródła: app/api/admin/fmic-preview/route.ts, app/lib/fmic-cart.ts.
- Ręczne produkty: visible=false wyklucza publikację; stockStatus available/order/unavailable. Na zamówienie nie oznacza magazynowego dostępnego od ręki. Konfiguracje mają wymagane opcje i dopłaty.
- Cena i wymagane opcje są weryfikowane przez serwer w app/api/orders/route.ts. Zamówienia ręczne używają productId, linie FMIC własnego SKU i wyceny. Wspólna finalizacja obu źródeł: PLAN.
- Nie uruchamiaj rzeczywistej płatności, wysyłki wiadomości lub zakupu u dostawcy podczas testów bez zgody. Aktualny stan integracji sprawdzaj przed każdą zmianą.
- Marże, stawki dostawy i zasady płatności: nie zgaduj; odczytaj konfigurację i potwierdź decyzje biznesowe. Bez danych nie publikuj nowych wartości.
