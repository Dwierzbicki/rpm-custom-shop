# QA Regression
2026-11-26 | zestaw startowy do wykonania
| ID | Given / When / Then | Wynik |
|---|---|---|
| CAT-01 | Widoczny PRISM RPM-00031 / wyszukaj PRISM lub SKU / wynik z poprawną kartą | NOT RUN E2E |
| CAT-02 | Kategoria Kute korbowody / producent PRISM i 135 mm / pasujące wyniki, zgodne liczniki | NOT RUN E2E |
| CAT-03 | Manual i FMIC / cena rosnąco, malejąco i dalsza strona / globalna kolejność, brak duplikatów | NOT RUN |
| CAT-04 | Ukryta oferta w fixture / wyszukaj i otwórz PDP / brak publicznej oferty | NOT RUN |
| PDP-01 | Manual, FMIC i konfigurowalny kolektor / otwórz PDP / poprawna galeria, cena, parametry, warianty | NOT RUN |
| CART-01 | Oba źródła / dodaj pozycje / poprawne identyfikatory, cena, ilości, stan po odświeżeniu | NOT RUN |
| ORD-01 | Koszyk mieszany na fixture / finalizacja / walidacja źródła, ceny i idempotencji, bez skutków zewnętrznych | BLOCKED — wspólny checkout do implementacji |
| UI-01 | Mobile/tablet/desktop, PL/EN / menu, filtry, nawigacja / brak migania, overflow i błędów konsoli | NOT RUN |
| PERF-01 | Porównywalne dane / npm run fmic:benchmark / cold/warm, czas, bytes, liczba wyników | NOT RUN dla aktualnego HEAD |

| RWD-01 | Zmieniony widok / 360×800 i 390×844 / poprawny layout i dotyk | NOT RUN |
| RWD-02 | Zmieniony widok / 768×1024 i 1024×768 / poprawny layout w obu orientacjach | NOT RUN |
| RWD-03 | Zmieniony widok / 1280×800 i 1920×1080 / poprawny layout, mysz i klawiatura | NOT RUN |
| RWD-04 | Zmiana layoutu / resize wokół breakpointów / bez utraty stanu i overflow | NOT RUN |

[Matryca RWD](responsive-testing.md).

## Istniejące dowody
- 2026-11-25: celowane zapytanie odczytowe PostgreSQL zwróciło RPM-00031, PRISM, 135 mm, 2100 PLN i available=true. PASS dla tego zapytania; nie jest testem API, UI ani pełnego listingu.
- 2026-11-26: Render deploy dep-dc3tri3bc2fs738vs4ug, commit 83000d99, status live. Potwierdza deployment, nie E2E.
- Polecenia projektu: npm test, npm run typecheck, npm run build; wydajność npm run fmic:benchmark. Wyniki zapisuj z SHA, środowiskiem i dowodem. Nie uruchamiaj prawdziwych zamówień, płatności ani e-maili bez osobnej zgody.

## FMIC — automatyczna publikacja i zasoby (2026-11-26)
| DESC-01 | Dokładny SKU/MPN/nazwa/URL, niepusta marka źródła / pobierz / automat publikuje wyłącznie zgodny opis | NOT RUN |
| DESC-02 | Sprzeczna marka lub tożsamość, ręczny zapis/wycofanie, review / automat / brak publikacji lub nadpisania | NOT RUN |
| DESC-03 | Niezmienione stare szkice automatu / lokalna partia maks. 10 / publikacja bez nowych żądań HTTP | NOT RUN |
| DESC-04 | 2 GiB limit / worker / limit RSS 768 MiB; zachowane 30 s opisów i 5 s zdjęć | NOT RUN |
Odczyt prod: 6 opublikowanych; 1 280 nieopublikowanych szkiców zgodnych z tekstem źródłowym i czasami workera (maks. odstępy <0,21 s). Wcześniejszy odczyt ścisłego warunku tożsamości + prostych parametrów zwrócił 1 278 kwalifikujących się szkiców. To dowody odczytu, nie test wdrożenia. PDP na trzech klasach urządzeń: NOT RUN.

## FMIC — lokalna równoległość (2026-11-26)
- LOCAL-01: do 3 różnych zapisanych SKU, start równoległy i oczekiwanie na wszystkie wyniki także przy błędzie. Test jednostkowy dodany, CI do potwierdzenia.
- LOCAL-02: lokalne zadania przy zamkniętym oknie HTTP, wstrzymanie przed kolejnym pobraniem, brak dodatkowych żądań, ręczne przypisanie oraz mismatch do review — NOT RUN integracyjnie.
- Odczyt produkcji po af900332: 442 opublikowane opisy; 132445 oczekujących opisów, 260227 oczekujących zdjęć. Wcześniejszy odczyt wykazał tylko 1 oczekujący SKU z zapisanym źródłem. Zatem sama lokalna równoległość nie usuwa ograniczenia pobierania.

## Kolektory RPM — warianty
| ID | Scenariusz | Wynik |
|---|---|---|
| MAN-01 | BMW: brak nadwozia / dodanie / blokada; cztery warianty, pojedynczy wybór | NOT RUN E2E |
| MAN-02 | BMW E36 i E46 przy tej samej flanszy / koszyk / odrębne klucze, zachowana cena i opcje | test jednostkowy dodany |
| MAN-03 | 2JZ GE / szablon / brak grupy BMW, EGT, T3/T4/V-Band i automatyczny WG | test jednostkowy dodany |
| MAN-04 | Brak, nieznane lub zmienione nadwozie / backend zamówienia / odrzucenie nieprawidłowego wyboru | NOT RUN API |
| MAN-05 | Mobile 360/390, tablet 768/1024, desktop 1280/1920 / radio, focus, cena i CTA, PL/EN, brak overflow | NOT RUN |

2026-11-26: trzy testy jednostkowe manifold-options z wersji 97bd5b7 odtworzone lokalnie z treści plików repo na Node 22.16.0 — 3 PASS. Kolejny test zmiany szablonu BMW na 2JZ dodany; pełny build, testy rzeczywistego PDP/admin i RWD pozostają do potwierdzenia. Brak opublikowanego rzeczywistego kolektora z ceną ustaloną przez operatora.

- MAN-06: import obu szkiców / start aplikacji / dokładnie dwa nowe rekordy, widoczność false, poprawne grupy, brak demo i zdjęć, brak zmian istniejących ofert. Test danych dodany; wykonanie importu i ponownego startu NOT RUN.

- BRAND-01: RPM Custom w karuzeli, kliknięcie → wyszukiwanie marki; logo lokalne. NOT RUN E2E.
- BRAND-02: kolektory nierdzewne, filtr Producent → RPM Custom → RPM-00032 i RPM-00033; filtr pozostaje dostępny także przy jednej marce. Test routingu dodany, test rzeczywistego API/UI NOT RUN.
- BRAND-03: zapis liścia w adminie nie usuwa grup wariantów, bez duplikatów na rodzicu i liściu. Test jednostkowy dodany, API/RWD NOT RUN.
- INC-001: 2026-11-26 użytkownik zgłosił wyjątek klienta na listingu kolektorów nierdzewnych; po odświeżeniu działał, konsola bez błędów. Intermittent / not reproducible; przyczyna nieustalona.

- WG-01: wszystkie 5 flansz / wybór średnicy / T4 Single i Twin 2×, T3 Twin 2×, T3 Single i V-Band 1×; brak/nieznana średnica blokuje zakup. Test jednostkowy dodany, NOT RUN.
- WG-02: rozmiary 38/44 mm, różne klucze koszyka, zachowanie istniejących dopłat i wymuszenie średnicy w obu szablonach. Testy jednostkowe dodane, NOT RUN.
- WG-03: PDP, admin, Power Builder, koszyk i API zamówienia, PL/EN oraz RWD 360/390/768/1024/1280/1920 — NOT RUN. Nie składamy prawdziwego zamówienia.

- WG-04: T3/T25/V-Band z wewnętrznym WG → 0 wyjść, bez średnicy; T4 z wewnętrznym WG → blokada; T25 zewnętrzny → 1 wyjście. Test jednostkowy dodany, NOT RUN. Zmiana flanszy na PDP czyści niedozwolony wybór; API oraz RWD NOT RUN.

- WG-05: RPM-00032 i RPM-00033 / jednorazowa aktualizacja / 6 flansz, grupa WG (8 średnic + wewnętrzny), T4 +500 zł, EGT +350 zł, ceny 3000/3500 zł zachowane, pozostałe pola bez zmian, ponowny start nie nadpisuje edycji. Odczyt przed zmianą potwierdził brak zapisanych nowych grup; test po wdrożeniu NOT RUN.

- WG-05 production 2026-11-26: FAIL on 1a04eac8 (live): log `[catalog] persisted manifold WG options []`, both DB rows have 5 flanges and no WG group, category `Kolektory wydechowe nierdzewne`. Fix: recognize canonical manifold categories in runtime and migration, new v2 marker, require exactly two rows and valid option groups before committing. Added regression across category forms. Post-fix production/RWD verification NOT RUN.

- PDP-01: polecany RPM-00031 / kliknięcie karty / /produkt/kute-korbowody-prism-bmw-m50-m52-m54-135-mm/RPM-00031, wspólny PDP, cena 2100 zł brutto, brak DEMO. Obserwacja użytkownika: FAIL przed zmianą, stary widok pod /. Po zmianie E2E NOT RUN.
- PDP-02: oba kolektory, wejścia z koszyka/Garage/Power Buildera, odświeżenie, nowa karta, stare ?product=31; jeden PDP, poprawne opcje i ceny. NOT RUN.
- PDP-03: RWD 360/390/768/1024/1280/1920, PL/EN, focus, brak błędów konsoli i overflow; zapis do Garage i brak regresji koszyka. NOT RUN.

- PLP-ROOT-01: `/sklep` bez q/kategorii → niepusty listing 24/stronę, globalny total, filtr producenta i drzewo kategorii. FAIL przed poprawką: API early return items=[], total=0. Odczyt DB 2026-11-26: 133742 widoczne wg reguły FMIC, 3 własne widoczne. Test kontrolera z mockiem dodany, API produkcyjne NOT RUN.
- PLP-ROOT-02: strona 2, producent RPM Custom (własne produkty), brak duplikatów, sort, cena, dostępność, wejście w PDP/wstecz; benchmark rozszerzony, NOT RUN. Admin bez kategorii pozostaje pusty. RWD 360/390/768/1024/1280/1920 NOT RUN.

- PDP-04: SKU 102130123 Pulsar PSR 3076 Gen2 (3270 PLN, dostępny, 3 zdjęcia źródłowe, opublikowany opis z parametrami; odczyt DB) oraz RPM-00031/32/33: galeria, cena, dopłaty, ilość, walidacja opcji, mobilny CTA po przewinięciu, dialogi i nawigacja do koszyka. 2 testy funkcji prezentacji dodane, NOT RUN; E2E/RWD 360/390/768/1024/1280/1920 NOT RUN.
- COMMUNITY-01: HP Community, PL/EN, istniejące zdjęcie i link FB, tokeny kolorów, brak overflow i focus na wszystkich profilach. NOT RUN.

- PDP-05: Pulsar 102130123 / nowa hierarchia i grupy / wszystkie źródłowe parametry zachowane, waga wysyłkowa ukryta, brak duplikacji SKU/producenta; PRISM i oba kolektory / ogólna specyfikacja, warianty i zakup bez zmian. 3 testy jednostkowe grupowania/identyfikacji dodane; pełny build i E2E/RWD 360/390/768/1024/1280/1920 NOT RUN.

- PDP-06: RPM-00032/33 bez zdjęć (potwierdzone DB) / placeholder musi mieć pełne proporcje, bez cienkiego paska; widoczny opis, brak powielenia ID, kompletacja opcji, T3 internal → T4 czyści niedozwoloną opcję, cena i dopłaty bez zmian. Przed poprawką FAIL wizualny zgłoszony przez użytkownika. RWD/E2E po poprawce NOT RUN. W późniejszym D-019 zidentyfikowano wskazany element jako pasek kotwic i usunięto go.

- PDP-06 automation: `scripts/test-manifold-pdp-rwd.mjs` runs both real SKU configurations at six required viewports, checks gallery height, one description, disabled CTA, WG selection invalidation, changed price and overflow. Requires local server or authorized storage state. NOT RUN (no authenticated browser session available in this chat). Does not place orders.

- PDP-07: RPM-00032/33 — brak bloku skrótu, opis i pełna specyfikacja nadal widoczne; Pulsar 102130123 — skrót parametrów pozostaje. Wszystkie PDP bez paska kotwic, sekcje docelowe bez zmian. Rozszerzono `scripts/test-manifold-pdp-rwd.mjs` na sześć profili. NOT RUN: brak autoryzowanej sesji przeglądarki / lokalnego uruchomienia całego repo.

- PDP-08: podwójna ramka zgłoszona na M54; po kliknięciu dowolnego kafelka pojedyncza ramka, klawiatura widoczny pojedynczy focus. Rozszerzenie testu RWD o computed style i Tab/Shift+Tab. NOT RUN: brak autoryzowanej sesji przeglądarkowej; ceny i konfiguracja bez zmian.

- SOCIAL-01: meta home/PDP RPM-00031/32/33 i FMIC, rzeczywiste zdjęcie lub fallback, tytuł/opis, canonical, Twitter, og:image, bez zmiany robots i ochrony. 4 testy jednostkowe dodane; Facebook Sharing Debugger i publiczny podgląd BLOCKED przez blokadę sklepu, test po dopuszczeniu publicznego dostępu. Nie wprowadzać wyjątku na podstawie User-Agent.

- SOCIAL-02: po wdrożeniu SOCIAL-01 LIVE (9e2eb15), użytkownik zgłosił brak zmiany na FB, bramka nie miała OG. Publiczny GET / bez cookies powinien zwrócić wyłącznie formularz z OG marki, grafika 1200×630 dostępna, PDP/API/admin nadal zablokowane; po zalogowaniu normalny sklep. Test dokładnego wyjątku obrazu dodany, NOT RUN. Facebook cache/robots mogą nadal wpływać na wynik; Sharing Debugger do weryfikacji.

- SOCIAL-03: opis OG strony głównej identyczny przed i po zalogowaniu; bez DEMO, prototypu i „Sklep w przygotowaniu”. Zmieniono tylko metadane publiczne, nie komunikat formularza ani blokadę. Test dodany, NOT RUN; Facebook cache do odświeżenia.

- CART-02: koszyk manualny, FMIC, mieszany, pusty, nieaktualne/ukryte pozycje i błędy pobrania katalogu/wyceny; przywrócenie przez retry, brak niedozwolonego CTA, ilość i sumy, konfiguracja w podsumowaniu zamówienia. 3 testy cart-readiness dodane. RWD 360/390/768/1024/1280/1920 i pełny build NOT RUN; bez wysyłania zamówienia. Wspólna finalizacja FMIC nadal zablokowana.

- PDP-09: T3 internal → T4, disabled (nie usuwać wiersza) i niezaznaczony WG; brak przesunięcia EGT >2px, wymagany zewnętrzny WG. TermShield +1600/szt., bez izolacji cena bazowa konfiguracji; stare koszyki nadal poprawne. Test jednostkowy i RWD rozszerzone. NOT RUN: brak lokalnego repo / autoryzowanej sesji. Produkcyjne zapisanie grup do dwóch SKU do potwierdzenia po deployu.

- PDP-10: obie konfiguracje kolektorów, wybór TermShield na końcu formularza, cena końcowa zgodna z górną ceną i ilością; przy braku widocznego dolnego podsumowania i górnej cenie poza ekranem pojawia się pasek. Test funkcji geometrii i scenariusz RWD rozszerzone, NOT RUN w repo / brak autoryzowanej sesji. Brak zmian cen i walidacji zamówień.

- PDP-11: zgłoszenie 404 dla 004548/70-G (produkt istnieje w DB; 3987 SKU z / na 133742 w feedzie). Testy roundtrip, stare adresy, brak/duplikat SKU, zwykły RPM, rzeczywisty 404 dodane. E2E `scripts/test-product-sku-routing.mjs` NOT RUN; stary adres może być odrzucony przez proxy przed Next, nowy omija kodowany ukośnik w ścieżce.

- LINK-01: admin → Zaawansowane → Sprawdzenie poprawności linków. Zakresy pages/special/all; sprawdzenie 200 z markerem SKU (w tym / i %), 404, blokada, przekierowanie, timeout, CSV, pauza i wznowienie po przeładowaniu. Testy klasyfikacji/CSV dodane, NOT RUN; RWD i pełna integracja NOT RUN. Pełny audyt nieuruchomiony, aby nie obciążać produkcji. Statyczne strony sprawdzane status/HTML, nie pełna semantyka ani kotwice.

- LINK-01 build FAIL: Render dep-dc3vn4rrjlhs73f49kv0, commit c09d5cac, Next compiled successfully then strict TypeScript reported TS7022 on issue at app/admin/link-audit/page.tsx:61. Explicit types for state, batch and issue break circular inference. Build fix in code, full Next build and RWD to verify; no bypass of type checking.

- VAR-01: skan colors/HEL, różne PSI, średnice, kąty, montaż nie są scalane, kolory unikalne, HEL zgodność suffix/nazwa, decyzja i cofnięcie, nowy feed cena bez konfliktu, zmiana składu/tożsamości i brak SKU z konfliktem po skanie, paginacja i filtry, RWD. Testy reguł dodane (NOT RUN); SQL i pełne E2E do potwierdzenia. Brak automatycznej publikacji. ADMIN-02: osobne Audyt zdjęć i Opisy i parametry pod Zaawansowane, stare tab=images/enrichment przekierowują, pozostałe akcje zachowane; RWD NOT RUN.

- VAR-01 | 2026-11-26: wykonano SELECT z rzeczywistego SQL variantCandidateSql (bez zapisu) na produkcyjnym katalogu, PASS wykonanie zapytań: suffix-color-v1 1788 rodzin/6747 SKU/redukcja 4959, hel-brake-v1 6044/77223/71179, hel-clutch-v1 173/2093/1920. Razem 8005 kandydatów, 86063 SKU, potencjalna redukcja 78058. Nie jest to walidacja techniczna każdej rodziny ani test wydajności. Zapis/odczyt decyzji, skan transakcyjny i E2E NOT RUN. ADMIN-02: usunięte również rozbudowane sekcje automatyzacji z pulpitu, pozostają skróty i ogólny KPI opisów; RWD NOT RUN.

- VAR-02: 2026-11-26 | SELECT pilota KP9016-02-BLACK zwrócił zatwierdzoną rodzinę 7a21d91cc3ed955ac7daea46196e74ff i SKU KP9016-02-N, oba 21 PLN wg aktualnego feedu. PASS odczyt SQL dla tego przypadku. Testy walidacji danych i read-only RWD dodane, NOT RUN. Wymagane sprawdzenie ceny różnej, niedostępności, zniknięcia SKU, cofnięcia decyzji, manualnych kolektorów i dokładnej linii koszyka (bez zamówienia). Nie jest to pomiar wydajności.

- VAR-03: jedna karta zatwierdzonej rodziny przed paginacją; wyszukiwanie konkretnego SKU/koloru, min/max/stock i facet zgodnie z dopasowanym SKU; sortowanie i liczniki rodzin, manual osobno, unapproved i konflikty pozostają pojedyncze; cofnięcie decyzji odświeża cache. Dodane testy konstrukcji SQL i scenariusze benchmarku; NOT RUN pełny build/RWD/benchmark. SQL bez dynamicznej detekcji nazw, brak zatwierdzeń masowych.
