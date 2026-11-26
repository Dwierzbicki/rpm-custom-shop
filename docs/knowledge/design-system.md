# Design System
2026-11-26 | decyzje projektowe
- Motorsport Dark, spójne karty, oszczędne akcenty, czytelne ceny i CTA, PL/EN. Zachowuj istniejące style, nie wymyślaj drugiego motywu.
- Header: kategorie w nagłówku, hamburger na węższych ekranach, wyszukiwarka i koszyk. Stabilny układ bez migania.
- Listing: wspólna siatka/lista, drzewo kategorii, filtry, obsługa dużych wyników. Zachowaj zaznaczenia i scroll.
- PDP: wspólna galeria, specyfikacja, cena, warianty i CTA dla obu źródeł.
- Power Builder: zaakceptowany układ głównych kategorii po lewej, lista w centrum na desktopie. Mobilnie adaptuj bez zasłaniania treści.
Źródła: dotychczasowe decyzje użytkownika, app/components/storefront/, rpm-ui-ux-designer. Dokładne tokeny i breakpointy sprawdzaj w aktualnych CSS. Weryfikacja wizualna po nowych zmianach: NOT RUN.

## Responsywność
2026-11-26 | Każdą zmianę UI (także admin i narzędzia) implementuj i testuj w ramach tego samego zadania dla mobile, tablet i desktop; tablet w obu orientacjach. Obowiązkowe profile i kryteria w docs/knowledge/responsive-testing.md. Raportuj osobne wyniki funkcjonalne i wizualne dla każdej klasy; brak obowiązkowego testu blokuje pełny odbiór. Emulacja nie oznacza testu fizycznego urządzenia. Funkcje hover mają odpowiednik dotykowy i klawiaturowy. Nie ukrywaj krytycznych akcji na małym ekranie.

- 2026-11-26 | W KODZIE: pojedynczy wybór nadwozia w PDP przez natywne radio i siatkę dwóch kolumn, min. wysokość 44 px, focus, PL/EN. Szablony kolektorów w panelu produktów. Testy RWD wymagane.

- 2026-11-26 | RPM Custom w karuzeli marek, z własnym istniejącym logo /optimized/logo.webp; filtr producenta pokazuje RPM Custom w pierwszych opcjach, również gdy jest jedyną marką kategorii. Bez duplikowania produktów i bez osobnego drzewa kategorii.

- 2026-11-26 | Jeden PDP niezależnie od punktu wejścia; brak etykiety DEMO na prawdziwych kartach polecanych. Natywne linki pozwalają na kopiowanie URL, otwarcie w nowej karcie i nawigację wstecz.

- 2026-11-26 | PDP: wspólna hierarchia zakupu, galeria o niezależnych proporcjach, poziomy scroll miniatur, najważniejsze parametry pod hero, cena i dopłaty, oznaczenie na zamówienie, mobilny pasek z ceną łączną i CTA po przewinięciu głównego CTA. Community: współdzielone tokeny Motorsport Dark zamiast osobnego różowo-fioletowego motywu. W KODZIE, RWD do potwierdzenia.

- 2026-11-26 | PDP Premium Performance V2: zaakceptowano kierunek mniej ramek, większa typografia, oddech 32–60 px; zakup i najważniejsze parametry obok galerii, specyfikacja turbo w grupach ogólne/sprężarka/turbina/smarowanie i chłodzenie/pozostałe. Inne produkty mają wspólną ogólną grupę bez wymyślania parametrów. Waga wysyłkowa nie jest widoczna w identyfikacji, pozostaje w API i danych logistycznych. MPN/EAN tylko jeśli istnieją, SKU/producent bez powtórzeń. Gwarancja i dostawa oddzielone od specyfikacji. W KODZIE; RWD do potwierdzenia.

- 2026-11-26 | PDP konfigurowalny: niezapadający się placeholder 5:4, najważniejsze parametry i wyróżniony opis pod galerią na desktopie, po konfiguratorze na mobile/tablet portrait. Zwykły PDP: opis przed szczegółową specyfikacją. Grupy BMW/flansza/WG/EGT jako natywne radio w kafelkach z dopłatą, licznik wymaganych wyborów, neutralne nieaktywne CTA. Nie zmieniamy danych ani reguł cen/WG. W KODZIE, testy RWD do potwierdzenia.

- 2026-11-26 | PDP: usuwamy blok „Najważniejsze parametry” dla rzeczywistych kolektorów wydechowych (liść nadrzędny/nierdzewne/żeliwne, nie elementy kolektora). Pełna specyfikacja, opis, galeria i konfigurator pozostają. Turbosprężarki i pozostałe kategorie zachowują skrót parametrów. Usuwamy także pasek kotwic sekcji ze wspólnego PDP, zgodnie z wcześniejszym wycinkiem użytkownika; sekcje docelowe pozostają. W KODZIE.

- 2026-11-26 | Kafelki wariantów: jedna ramka akcentu po wyborze myszą/dotykiem, bez dodatkowego cienia i zewnętrznego focus-within. Focus klawiaturowy zastępuje ramkę jasnym obrysem wewnętrznym (:focus-visible), nie usuwa sygnału dostępności. W KODZIE.

- 2026-11-26 | Social sharing: Open Graph PL, nazwa produktu, krótki opis, kanoniczny URL, rzeczywiste zdjęcie; własne Cloudinary pad 1200×630, brak zdjęcia → grafika marki 1200×630 bez fikcyjnego produktu. Twitter large image. W KODZIE; blokada sklepu pozostaje.

- 2026-11-26 | Koszyk Premium: szerszy layout, linie oddzielone delikatnym separatorem, zdjęcie contain / wspólny placeholder, podsumowanie na desktopie i pod listą na mobile/tablecie, pojedyncze CTA zależne od źródła. Koszyk mieszany pokazuje dwie grupy i jawny komunikat zamiast nieaktywnego formularza FMIC. Checkout bez DEMO, warianty w podsumowaniu. W KODZIE.

- 2026-11-26 | Stabilizacja konfiguratora: wewnętrzny WG nie znika z siatki po zmianie flanszy, lecz staje się disabled i ma stały opis dostępności. Cena bazowa/dopłaty pozostają w dwóch stałych wierszach, także przy 0 PLN. Opcjonalny TermShield w dwóch kafelkach, bez zmiany domyślnej ceny.

- 2026-11-26 | Konfigurator kompaktowy: mniejsze odstępy grup i kafelków (min. 44px cel dotykowy), stała geometria WG, łączna cena brutto bezpośrednio nad głównym CTA oraz pływający pasek ceny/zakupu na wszystkich profilach, gdy górna cena opuści ekran i dolne CTA nie jest jeszcze całe widoczne. Gdy dolne podsumowanie widoczne, pasek ustępuje; mobile zachowuje dotychczasowy pasek po przewinięciu CTA. W KODZIE.

- 2026-11-26 | Admin: kontrola linków w Zaawansowanych i szybkich działaniach pulpitu; wybór zakresu, start/pauza/wznowienie, postęp, raport CSV i lista problemów. W KODZIE; RWD do potwierdzenia.

- 2026-11-26 | Zaawansowane: osobne widoki Audyt zdjęć, Opisy i parametry, RPM Variant Manager. Usunięto duplikaty zakładek z FMIC Catalog Center, zachowano skróty pulpitu i przekierowania starych adresów. Wspólny styl centrum jakości (karty KPI, responsywne akcje, przewijane tabele). Variant Manager: skan zakresu, filtry, rozwijana rodzina i decyzje. W KODZIE, RWD do weryfikacji.

- 2026-11-26 | Pulpit nie powiela rozbudowanych kart automatyzacji opisów/audytu zdjęć. Szybkie działania prowadzą do osobnych centrów; ogólny KPI opublikowanych opisów zachowany.

- 2026-11-26 | PDP dostawcy: zwarty selektor kolorów z tekstową nazwą PL/EN, swatchem, indywidualną ceną, oznaczeniem wybranego i niedostępnego SKU. Link do pełnej karty konkretnego SKU; bez zmiany konfiguratora kolektorów. W KODZIE, RWD NOT RUN.

- VAR PLP: karta zachowuje nazwę, SKU, zdjęcie, cenę i stan rzeczywistego reprezentanta, ma dyskretny licznik kolorów. Nie pokazujemy fikcyjnej ceny od ani syntetycznego SKU. W KODZIE; RWD NOT RUN.

- PLP: compact colour swatches under title, selected colour text, unavailable marker, max six initial choices plus expansion, 44 px touch targets; individual image/price/stock/SKU updates without leaving listing; opening product uses selected SKU. Unmatched colours accessible on PDP only. W KODZIE.

- 2026-11-26 | PLP desktop wide: main container max 1800px (only .rpm-shop-page with direct .fmic-plp), 4 columns at 1151–1365px, 5 from 1366px, narrower unchanged; 240px filter sidebar, compact card spacing, CTA full width on narrower desktop cards. List mode, PDP, home, checkout unchanged. Page size remains 24. W KODZIE; RWD pending.
