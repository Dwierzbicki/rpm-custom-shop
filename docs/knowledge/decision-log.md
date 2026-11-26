# Decision Log
Dziennik dopisywany; decyzje zastąpione oznacz, nie usuwaj historii.

- 2026-11-25 | D-001 | POTWIERDZONA decyzja: ręczne produkty i FMIC korzystają ze wspólnej taksonomii, listingu i karty; źródło realizacji pozostaje osobne. Uzasadnienie: spójność zakupów i uniknięcie duplikacji. Implementacja wymaga pełnych testów.
- 2026-11-25 | D-002 | POTWIERDZONA decyzja: Power Builder zachowuje główne kategorie po lewej i listę w centrum.
- 2026-11-26 | D-003 | POTWIERDZONE: pięć Skills i AGENTS.md zapisane w main, commit 83000d99.
- 2026-11-26 | D-004 | POTWIERDZONA decyzja użytkownika: testy i dokumentacja to priorytet. Knowledge Manager aktualizuje wiedzę przy istotnym zadaniu; Definition of Done obejmuje dowody testów, aktualizację dokumentacji i stan wdrożenia. Nie oznacza pracy autonomicznej w tle.
- 2026-11-26 | D-005 | POTWIERDZONA decyzja użytkownika: zmiany i testy obowiązkowo na mobile, tablet i desktop. Matryca RWD określa kryteria odbioru.
- 2026-11-26 | D-006 | Automatyczna publikacja opisów o dokładnej tożsamości FMIC, ochrona ręcznych decyzji, lokalne partie do 10 i większy budżet pamięci w aktualnym planie Render; limity pobierania dostawcy pozostają bez zmian do potwierdzenia warunków. Stan wdrożenia i testy do weryfikacji.
- 2026-11-26 | D-007 | Rozdzielenie lokalnego przetwarzania od pobierania HTTP, maks. 3 lokalne zadania opisów; nie podnosimy limitów dostawcy bez potwierdzenia. Obrazy nadal według istniejącego limitu. Nie zwiększamy planu Render ani nie uruchamiamy nowych płatnych usług.
- 2026-11-26 | D-008 | Użytkownik: kolektory BMW M50/M52/M54 mają pojedynczy wymagany wybór nadwozia E36/E46/E8x/E9x w jednej ofercie; szablony 2JZ GE i BMW w adminie, bez automatycznej publikacji produktu lub ustalenia cen.
- 2026-11-26 | D-009 | Na polecenie użytkownika dodajemy szkice dwóch kolektorów, bez wymyślania cen i zdjęć. Import jednorazowy w transakcji pod wspólną blokadą alokacji SKU. Stan produkcji do potwierdzenia.
- 2026-11-26 | D-010 | RPM Custom pełnoprawna marka producenta, w filtrach i karuzeli marek; kolektory AISI 316 w istniejącym liściu nierdzewnym. Nie zmieniamy cen ani danych handlowych.
- 2026-11-26 | D-011 | Zastępuje wcześniejszą regułę liczby WG: T4 zawsze dwa, T3 Twin dwa, reszta jeden; obowiązkowa średnica dla 1× i 2×, wspólna przy dwóch. Dane katalogowe 35–60 mm, potwierdzenie flanszy konkretnego modelu. Dopłaty istniejące bez zmian.
- 2026-11-26 | D-012 | T3/T25/V-Band dopuszczają wewnętrzny WG, bez zewnętrznego wyjścia; T4 zawsze dwa. T25 dodane, wspólna opcja średnicy lub wewnętrznego WG, bez zmian dotychczasowych dopłat.
- 2026-11-26 | D-013 | Użytkownik: zapisać nowe warianty w dwóch istniejących ofertach, nie tylko generować je przy odczycie. Jednorazowa aktualizacja dwóch SKU, zachowanie danych handlowych.
- 2026-11-26 | D-014 | Użytkownik zgłosił stary PDP dla produktów polecanych dodanych ręcznie. Wszystkie wejścia do produktu powinny prowadzić do wspólnego kanonicznego PDP, bez DEMO i bez stanu produktu pod /.
- 2026-11-26 | D-015 | Publiczny /sklep ma wyświetlać cały dostępny katalog (paginacja, filtry, drzewo); nie wymaga frazy/kategorii. Admin preview zachowuje dotychczasowy warunek. Bez zmiany danych handlowych.
- 2026-11-26 | D-016 | Wspólny PDP dopracowywany na rzeczywistym produkcie Pulsar 102130123, z regresją produktów manualnych. Cena/CTA przed parametrami, mobilny pasek po przewinięciu, zachowanie dotychczasowej logiki zakupu. Community używa wspólnych tokenów kolorów; bez zmian treści i URL grupy.
- 2026-11-26 | D-017 | Użytkownik zaakceptował przebudowę PDP Premium Performance i zakwestionował wagę wysyłkową. Ukrywamy ją wyłącznie w prezentacji, zachowujemy w danych do logistyki; nie skracamy nazwy katalogowej ani nie zmieniamy cen i reguł zakupu. Grupowanie parametrów wyłącznie na podstawie dostępnych danych.
- 2026-11-26 | D-018 | Karta kolektora wymaga wyeksponowanego opisu i pełnego placeholdera. Układ adaptuje się do dłuższej konfiguracji, bez osobnego PDP i zmian reguł zakupu.
- 2026-11-26 | D-019 | Użytkownik: usunąć powtarzający się skrót parametrów z kolektorów oraz wcześniej wskazany pasek nawigacji sekcji. Usunięcie tylko prezentacji, bez zmian danych, cen ani konfiguracji.
- 2026-11-26 | D-020 | TermShield +1600 PLN brutto jako opcja kolektorów BMW/2JZ; zachować stare koszyki, dopłaty i dane. Zmiana T3/T4 ma utrzymać położenie siatki, przy zachowaniu serwerowej blokady internal WG dla T4.
