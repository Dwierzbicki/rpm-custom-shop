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
