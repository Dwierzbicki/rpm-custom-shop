# Importer CSV — staging-only

## Uruchomienie
Ustaw w Render (lub lokalnie w .env.local):
- ADMIN_PREVIEW_USER — unikalny login administratora
- ADMIN_PREVIEW_PASSWORD — długie losowe hasło (minimum 20 znaków zalecane)

Otwórz `/admin-import` przez HTTPS i zaloguj się w oknie przeglądarki.
Bez obu zmiennych strona zwraca 503; nie ma domyślnego hasła.
Nie umieszczaj sekretów w NEXT_PUBLIC_* ani w repozytorium.

## Granice bezpieczeństwa
Basic Auth to **tymczasowa ochrona podglądu**, nie docelowe logowanie administratora.
Przed dodaniem zapisu do PostgreSQL wymagane są sesje, role administratora,
ochrona CSRF, audyt zmian, rate limiting i autoryzacja po stronie serwera.
Wczytany CSV pozostaje w pamięci przeglądarki; brak endpointu uploadu
i brak zapisu ofert lub automatycznej publikacji.
Nie wdrażaj tego PR bez przejścia testów i code review.

## Następne kroki
1. Testy parsera i build w CI.
2. Mapowanie rzeczywistych pól dostawców po otrzymaniu dokumentacji.
3. Porównanie z istniejącymi ofertami (SKU scoped do dostawcy, EAN/MPN jako sygnały).
4. Transakcyjne zatwierdzanie importu i historia operacji.
