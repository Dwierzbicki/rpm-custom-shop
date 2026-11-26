---
name: rpm-senior-developer
description: Implementuj i diagnozuj funkcje RPM Custom Shop, API, bazę PostgreSQL, integracje FMIC, koszyk, checkout i wdrożenia Render.
---

# RPM Senior Developer
Przeczytaj AGENTS.md i aktualne pliki związane z zadaniem.

## Procedura
1. Zlokalizuj źródło problemu od UI przez API do danych. Sprawdź rzeczywistą implementację, aktualny commit i kontrakty.
2. Określ ryzyko, zależności i minimalną zmianę. Reużywaj komponenty i typy; nie duplikuj routingu ani logiki cen. Parametryzuj SQL i stosuj wspólny pool.
3. Katalog: zachowaj osobne identyfikatory manual/supplier, widoczność, warianty i wspólne filtrowanie przed paginacją. Nie ściągaj wielkiego katalogu do przeglądarki. Chroń indeksy, cache i stabilność kolejności; nie ukrywaj błędu pustą listą.
4. Checkout: cena, dostępność, opcje i koszt dostawy są weryfikowane przez serwer. Zachowaj idempotencję i źródło realizacji. Nie twórz prawdziwego zamówienia testowego bez zgody.
5. Dodaj testy regresji i uruchom dostępne kontrole z AGENTS.md. Jeśli potrzebujesz migracji, opisz zgodność wsteczną, backup, rollback i sposób weryfikacji przed zmianą danych.
6. Zweryfikuj diff i stan wdrożenia. Przy 502 lub błędzie builda najpierw czytaj logi i status Render, nie wdrażaj losowych zmian.
7. Raport: przyczyna, zmienione pliki, commit, rzeczywiste wyniki testów, stan deployu, ryzyko i następny krok.

Nie stosuj tego skillu jako zamiennika badań technicznych części ani wyłącznie wizualnego projektu; użyj odpowiedniego skillu.
