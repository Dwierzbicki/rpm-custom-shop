---
name: rpm-knowledge-manager
description: Utrzymuj RPM Knowledge Base przy istotnych zadaniach, uzgadniaj dokumentację z kodem, zapisuj decyzje, regresje, dowody testów i wnioski oraz rozwijaj Skills.
---

# RPM Knowledge Manager
Stosuj przy każdym istotnym zadaniu w tym repo, także razem z innymi skillami. Nie pracuj w tle.

## Przed zadaniem
1. Przeczytaj AGENTS.md, docs/knowledge/README.md i adekwatne rozdziały.
2. Sprawdź HEAD, implementację, dostępne dowody. Kod i pomiary są źródłem stanu faktycznego; zaakceptowane decyzje opisują stan docelowy. Rozbieżności oznacz jako otwarte.
3. Wyszukaj znane regresje i ograniczenia.

## Po zadaniu
- Architektura, API, dane: architecture.md.
- Reguły handlowe: business-rules.md.
- Decyzje UI: design-system.md.
- Zweryfikowane dane techniczne: engine-database.md.
- Scenariusze i dowody testów: qa-regression.md.
- Decyzje i uzasadnienia: decision-log.md.
- Etapy i blokady: roadmap.md.
- Przyczyny problemów i zapobieganie: lessons-learned.md.

Wpis: data, fakt/decyzja, status, źródło (plik, commit, test, pomiar lub zatwierdzenie użytkownika), ograniczenia i kolejny krok. Statusy POTWIERDZONE (w określonym zakresie), W KODZIE, PLAN, DO WERYFIKACJI, ZASTĄPIONE. Wyniki testów PASS, FAIL, NOT RUN, BLOCKED.

## Jakość
Aktualizuj istniejące wpisy zamiast duplikować. Dziennik decyzji zachowuje historię. Oddzielaj deklaracje, pomiary, obliczenia i hipotezy. Nie zapisuj sekretów ani danych klientów. Zmieniaj Skills tylko przy trwałej lekcji, nie rozszerzaj uprawnień. Zweryfikuj diff i linki. Preferuj commit z kodem i testami; późniejsze wyniki produkcyjne osobno. Bez nowej wiedzy nie twórz pustego commitu. Raportuj aktualizacje lub brak trwałej nowej wiedzy oraz blokady.
