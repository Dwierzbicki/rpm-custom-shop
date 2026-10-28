# RPM Custom Shop v0.1 — DEMO

Interaktywny sklep demonstracyjny z 28 produktami, konfiguracją kolektorów, koszykiem, checkoutem demonstracyjnym i Garage Lite.

## Uruchomienie na Windows (PowerShell)

Zainstaluj Node.js 20.9+ (najlepiej aktualny LTS).

```powershell
npm install
npm run dev
```

Otwórz http://localhost:3000

## Wdrożenie na Render

1. Utwórz repozytorium GitHub `rpm-custom-shop` i prześlij pliki z tego katalogu.
2. Render → New → Web Service → Connect GitHub repository.
3. Runtime: Node. Build Command: `npm install && npm run build`.
4. Start Command: `npm run start`.
5. Environment: `NODE_VERSION=22`, `NODE_ENV=production`.
6. Wybierz odpowiedni plan i uruchom deploy. Port jest automatycznie obsługiwany przez Render (`PORT`).

## Zakres

- Wszystkie ceny, produkty, parametry i dostępności są demonstracyjne.
- Brak płatności i faktycznego składania zamówień.
- Brak backendu i logowania. Koszyk i Garage Lite zapisują się lokalnie w przeglądarce (`localStorage`).
- Wizualizacje produktów to tymczasowe symbole; do publikacji należy podmienić na prawdziwe zdjęcia i dane.
- Konfigurator kolektora wymaga wyboru silnika, flanszy i wastegate. Cena bazowa **nie** uwzględnia dopłat — nie jest to wycena.
- Zgodność silników/flansz i faktyczna dostępność opcji wymagają potwierdzenia.
