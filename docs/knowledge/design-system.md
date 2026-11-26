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
