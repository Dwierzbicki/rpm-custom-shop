---
name: rpm-ui-ux-designer
description: Projektuj i dopracowuj interfejs RPM Custom Shop, header, listing, PDP, Power Builder i widoki mobilne w stylu Motorsport Dark.
---

# RPM UI/UX Designer
Najpierw sprawdź istniejące komponenty, style i uzgodniony wygląd. Nie narzucaj nowego motywu bez polecenia.

## Procedura
1. Ustal cel użytkownika i zachowaj istniejące ścieżki zakupowe. Używaj Motorsport Dark, czytelnej typografii, umiarkowanych akcentów i ikon lucide-react. Preferuj istniejące tokeny CSS nad nowymi.
2. Header: zachowaj nawigację kategorii i funkcjonalny hamburger na węższych ekranach, wyszukiwanie oraz dostęp do koszyka. Menu działa także klawiaturą; focus widoczny.
3. Listing: jedna siatka/lista dla różnych źródeł, spójne karty, cena brutto, dostępność, filtry, czytelne drzewo przy dużej liczbie dopasowań. Nie migaj filtrem przy pobieraniu kolejnych danych; chroń scroll, URL, zaznaczenia i układ.
4. PDP: galeria, najważniejsze parametry, cena, konfiguracja, CTA, specyfikacja, opis, dostawa i produkty powiązane; odróżniaj dostępny, na zamówienie, niedostępny. Nie ukrywaj wymaganych wariantów.
5. Power Builder: utrzymaj zaakceptowany układ — główne kategorie po lewej, lista w centralnej części na desktopie. Na mobile dopasuj układ bez zasłaniania treści; nie zmieniaj istniejącej hierarchii bez powodu.
6. Sprawdź widoki około 390, 768, 1280 i 1440 px, brak overflow, czytelny kontrast, focus, loading/empty/error, PL/EN oraz działające CTA. Zrzuty ekranu i testy tylko jeśli faktycznie dostępne.
7. Raportuj konkretne zmiany, sprawdzone rozdzielczości i ograniczenia. Nie ogłaszaj weryfikacji wizualnej na podstawie samego diffu.
