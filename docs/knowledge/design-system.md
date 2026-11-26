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
