# Responsive Testing
2026-11-26 | decyzja użytkownika: każda zmiana UI obejmuje mobile, tablet i desktop. Poniższe wymiary CSS px to przyjęte profile testowe, nie modele urządzeń.

| Klasa | Viewport | Obsługa |
|---|---|---|
| Mobile | 360×800, 390×844 | dotyk, portrait |
| Tablet | 768×1024, 1024×768 | dotyk, portrait i landscape |
| Desktop | 1280×800, 1920×1080 | mysz, klawiatura |

Dla zmian layoutu sprawdzaj także granice faktycznych breakpointów (−1/0/+1 px), a dla galerii/3D i narzędzi także mobile landscape.

## Kryteria
- Funkcjonalność zmienionych widoków i ścieżek na wszystkich klasach, bez utraty stanu po resize/obrocie.
- Brak niezamierzonego poziomego scrolla, nakładania elementów, zasłoniętych CTA, migania, obciętych treści. Zamierzony lokalny scroll tabel/karuzel dopuszczalny.
- Dotyk bez hover, dostępność klawiaturą i widoczny focus, kontrolki o wygodnym rozmiarze (preferuj 44×44 CSS px).
- Loading, empty, error, długie nazwy, PL/EN, konsola i sieć w zakresie zmiany.
- Playwright Chromium na wszystkich profilach, dodatkowe WebKit/Firefox dla krytycznych ścieżek. Rzeczywiste urządzenia i Safari/iOS/Android przed publicznym wydaniem w miarę dostępności. Emulacja nie jest fizycznym urządzeniem.

## Dowody
Dla każdego profilu zapisuj test/ID, viewport, orientację, przeglądarkę, SHA, środowisko, emulacja/urządzenie, PASS/FAIL/NOT RUN/BLOCKED, zrzut lub trace przy błędzie. Brak testu którejkolwiek klasy blokuje pełny odbiór UI. Obecnie scenariusze RWD-01–04 mają NOT RUN; samo dodanie dokumentu nie wykonuje testów.
