# Logowanie klientów RPM Custom (etap 1: Google)

Logowanie klientów działa przez Google OpenID Connect (OAuth 2.0 Authorization Code + PKCE). Klient nie tworzy hasła. Konto w PostgreSQL zawiera jedynie identyfikator dostawcy, e-mail i nazwę wyświetlaną.

## Konfiguracja Render

W Google Cloud Console utwórz klienta OAuth 2.0 typu **Web application** i ustaw Authorized redirect URI:

`https://TWOJA-DOMENA/api/auth/google/callback`

Na Renderze dodaj:
- `GOOGLE_CLIENT_ID` — Client ID z Google Cloud
- `GOOGLE_CLIENT_SECRET` — Client secret z Google Cloud
- `CUSTOMER_SESSION_SECRET` — losowy sekret minimum 32 znaki (nie używaj hasła admina)
- `DATABASE_URL` — istniejąca baza PostgreSQL

W Google Cloud skonfiguruj ekran zgody OAuth i opublikuj aplikację (lub dodaj użytkowników testowych na czas testów).

## Endpointy

- `/login` — logowanie klientów
- `/account` — konto klienta
- `/api/auth/google` — rozpoczęcie OAuth
- `/api/auth/google/callback` — walidacja tokenu i utworzenie konta
- `/api/auth/me` — dane aktualnie zalogowanego klienta
- `/api/auth/logout` — wylogowanie (POST)

Panel `/admin` nadal używa oddzielnego mechanizmu autoryzacji i nie przyznaje roli administratora na podstawie logowania Google.

**Następny etap:** Facebook i Apple (Apple widoczny na urządzeniach Apple), łączenie kont dostawców, historia zamówień i zarządzanie danymi klienta. Zakupy bez konta pozostają dostępne.
