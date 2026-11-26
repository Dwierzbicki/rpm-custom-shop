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
| UI-01 | Desktop/mobile, PL/EN / menu, filtry, nawigacja / brak migania, overflow i błędów konsoli | NOT RUN |
| PERF-01 | Porównywalne dane / npm run fmic:benchmark / cold/warm, czas, bytes, liczba wyników | NOT RUN dla aktualnego HEAD |

## Istniejące dowody
- 2026-11-25: celowane zapytanie odczytowe PostgreSQL zwróciło RPM-00031, PRISM, 135 mm, 2100 PLN i available=true. PASS dla tego zapytania; nie jest testem API, UI ani pełnego listingu.
- 2026-11-26: Render deploy dep-dc3tri3bc2fs738vs4ug, commit 83000d99, status live. Potwierdza deployment, nie E2E.
- Polecenia projektu: npm test, npm run typecheck, npm run build; wydajność npm run fmic:benchmark. Wyniki zapisuj z SHA, środowiskiem i dowodem. Nie uruchamiaj prawdziwych zamówień, płatności ani e-maili bez osobnej zgody.
