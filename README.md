# RPM Custom Shop

Sklep RPM Custom i MotoLab dla kolektorów TIG oraz części performance. **Status: prototyp z działającym backendem** — przed rozpoczęciem publicznej sprzedaży należy zweryfikować katalog, obsługę płatności i e-maili.

## Technologie

Next.js 15 (App Router), React 19, TypeScript, PostgreSQL, Cloudinary oraz opcjonalne Google OAuth i Resend.

## Start lokalny (PowerShell, Node.js 22)

```powershell
npm install
Copy-Item .env.example .env.local
# Uzupełnij .env.local lokalnymi wartościami.
npm run dev
```

Strona: http://localhost:3000

## Testy i build

```powershell
npm test
npm run typecheck
npm run build
```

GitHub Actions wykonuje te kontrole przy PR oraz zmianach w `main` (workflow `.github/workflows/validate.yml`).

## Konfiguracja i bezpieczeństwo

Wzór zmiennych środowiskowych znajduje się w `.env.example`. Właściwe sekrety trzymaj w Render, nie w GitHubie. Logowanie Google wymaga `APP_URL`, kluczy OAuth i osobnego sekretu sesji, a URI callbacku ma postać `<APP_URL>/api/auth/google/callback`.

## Aktualny status

- Katalog, produkty, zamówienia, klienci i ustawienia korzystają z PostgreSQL. W katalogu są nadal produkty demonstracyjne.
- Checkout **zapisuje zamówienia do bazy** przez `POST /api/orders`. Nie ma płatności online.
- `EMAIL_MODE=mock` nie wysyła wiadomości, `test` wysyła tylko na adres testowy; obsługa wysyłki w trybie `production` nie jest obecnie włączona.
- Dostawcy FMIC/MTuning: zapis ofert, ręczne dopasowanie oraz potwierdzanie publikacji ceny; parser CSV działa tylko jako podgląd, bez zapisu.
- Szkice edytora strony głównej zapisują się lokalnie w przeglądarce admina, nie są publikowane w bazie.

## Struktura kodu / dalszy refaktor

Aktywny router znajduje się w `app/`. Starsze równoległe `src/app/` wymaga osobnej migracji lub usunięcia po weryfikacji zachowanych funkcji. Parser CSV w `src/lib/` i `src/components/` jest nadal potrzebny przy rozwoju importera.

Wspólny pool PostgreSQL: `app/lib/db.ts`, używaj `getDbPool()` we wszystkich modułach zamiast tworzyć kolejne pule.

Następne etapy: podzielić monolityczne `app/page.tsx`, uporządkować `app/globals.css`, dodać migracje bazy danych, ograniczanie prób logowania i ochronę przed duplikatami zamówień oraz podłączyć import CSV do panelu.
