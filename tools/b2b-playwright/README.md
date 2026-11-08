# RPM Custom — B2B Playwright: wyłącznie lokalna symulacja

To **przygotowanie pod integrację** z panelami FMIC/MTuning, a nie gotowy
automat zakupowy. Nie ma adresów paneli dostawców, selektorów produkcyjnych,
danych logowania, kodu wysyłającego zamówienie ani żadnego dostępu do
prawdziwego koszyka.

## Uruchomienie (Windows PowerShell / Linux / macOS)

W głównym katalogu repozytorium:

```powershell
cd tools/b2b-playwright
npm install
npx playwright install chromium
npm test
npm run demo
```

Uruchomienie z rzeczywistym **plikiem testowym JSON** pobranym z panelu
admina RPM Custom Shop (w panelu zamówienia: zatwierdzony szkic zakupowy,
następnie „Pobierz zadanie DEMO B2B” dla danego dostawcy):

```powershell
node dry-run.mjs "C:\\Users\\<uzytkownik>\\Downloads\\rpm-b2b-demo-123-fmic.json"
```

W `artifacts/` powstają screenshot PNG oraz raport JSON z
`orderPlaced:false` i `sentToSupplier:false`. Ponowny przebieg tego
samego zadania nadpisuje pliki raportu o identyfikatorze pochodzącym
z zamówienia i fingerprintu. Nie wykonuje żadnej operacji u dostawców.

## Zasady bezpieczeństwa

- Dane w zadaniu są ograniczone do SKU, ilości, ceny zakupu i wariantów.
  **Bez danych klienta, adresu, e-maila, telefonu ani sesji sklepu B2B**.
- Odczyt zadania z serwera wymaga sesji administratora oraz
  **zatwierdzonego, jeszcze niezrealizowanego** planu zakupowego.
  Przy zmianie oferty/kwoty serwer odrzuci eksport jako nieaktualny.
- Lokalny Playwright używa wyłącznie `page.setContent` na `about:blank`.
  Wszystkie żądania do sieci są abortowane, a w makiecie nie ma
  przycisku finalizującego zakup.
- Na żadnym etapie nie można zmienić statusu zamówienia u dostawcy —
  pozostaje osobne, istniejące ręczne potwierdzenie w RPM Custom Shop.

## Dalszy rozwój

Do podłączenia prawdziwego panelu FMIC/MTuning potrzebne będą oficjalne
warunki dostępu i udokumentowany albo zweryfikowany przebieg zamawiania
oraz selektory/stany strony. Dopiero później można stworzyć adapter
dostawcy z trybem *prepare cart only*, weryfikacją sum i odrębnym
zatwierdzeniem przez operatora. Ten PR celowo nie wprowadza live adaptera.
