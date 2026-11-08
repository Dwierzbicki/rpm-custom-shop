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

## Rzeczywisty sklep FMIC — adapter zwykłej strony produktu

FMIC nie ma osobnego panelu B2B. Automat używa tej samej strony produktowej,
co każdy klient. Pierwszy zweryfikowany przykład: **SKU F00VE35007-BOS**,
adres znajdziesz w `fmic-products.example.json`.

### 1. Bezpieczne sprawdzenie publicznej strony (bez zapisu koszyka)

```powershell
cd tools/b2b-playwright
npm install
npx playwright install chromium
npm run fmic:inspect
```

Tworzy lokalny screenshot i raport rozpoznanego SKU, ceny oraz kontrolek.
Działa **tylko na domenie fmic.pl**, nie wysyła żadnego POST ani nie
przechodzi do finalizacji. Układ kontrolek bazuje na typowych wzorcach
Magento — wciąż wymaga potwierdzenia z rzeczywistą przeglądarką FMIC.

### 2. Przygotowanie koszyka — WYŁĄCZNIE po sprawdzeniu selektorów i ceny

Sporządź plik `fmic-products.local.json` według dołączonego przykładu.
Ustaw **rzeczywisty maksymalny limit ceny brutto** dla każdego SKU
(`maxUnitGrossPLN`); `null` celowo uniemożliwia dodanie produktu.
Plik zadania DEMO pobierz z panelu RPM Custom dla zatwierdzonego planu.

```powershell
$env:RPM_FMIC_CART_WRITE="YES"
node fmic-cart.mjs prepare "C:\\Users\\<uzytkownik>\\Downloads\\rpm-b2b-demo-123-fmic.json" "./fmic-products.local.json" --confirm-cart-only
Remove-Item Env:RPM_FMIC_CART_WRITE
```

Ten tryb jest uruchamiany **lokalnie**, nigdy przez automatyczny serwer
ani GitHub Actions. Używa tylko zweryfikowanego formularza dodawania
do koszyka, ogranicza POST do `/checkout/cart/add`, blokuje wszystkie
ścieżki checkout, płatności i zamówienia, a potem **zatrzymuje się**.
Nie wypełnia adresu dostawy, nie wybiera płatności i nie klika
„Zamawiam / Wyślij zamówienie”.

Każde zadanie ma **blokadę powtórzenia (lock)** w katalogu `artifacts/`.
Jeśli wystąpi błąd po dodaniu jednej pozycji, **nie uruchamiaj automatu
ponownie**, dopóki ręcznie nie sprawdzisz koszyka. Lock nie jest kasowany
automatycznie.

Nie przekazuj przez czat hasła ani cookies. Jeżeli konieczne będzie
konto z rabatami, udostępnij sesję Playwright **lokalnie** przez zmienną
`FMIC_LOCAL_AUTH_STATE` wskazującą plik `storageState` poza repozytorium.

Ważne: domyślna publiczna cena może się różnić od ceny po zalogowaniu.
Automat porównuje cenę widoczną na stronie z wpisanym limitem i odmawia
dodania, jeśli cena jest nieznana, wariant wymaga wyboru albo SKU się nie
zgadza. Żaden plik JSON ani screenshot z sesją nie powinien być commitowany.

### Podgląd pracy w RPM Custom

`/admin/b2b-monitor` pokazuje wewnętrzną kolejkę, logi zgłoszonych
testów Playwright i historię zdarzeń, odświeżając je co 10 sekund.
Ten panel nie jest jeszcze strumieniem na żywo z lokalnego Chromium;
raporty muszą zostać przekazane przez administratora po zakończeniu testu.

### 3. Kontrola koszyka po dodaniu — bez finalizowania zamówienia

Po kliknięciu „Dodaj do koszyka” adapter oczekuje na odpowiedź
dozwolonego formularza. Następnie otwiera **wyłącznie podgląd koszyka**
(`GET https://fmic.pl/checkout/cart/`) i porównuje:

- SKU każdego produktu z zatwierdzonym planem zakupowym;
- dokładną liczbę sztuk i brak dodatkowych produktów;
- aktualną cenę jednostkową brutto względem limitu;
- sumę brutto pozycji z sumą rozpoznaną w koszyku.

Jeśli którejkolwiek danej nie może odczytać lub wynik się nie zgadza,
zapisuje lokalny raport `cart-not-verified` albo `manual-review-required`,
przerywa operację i **zostawia blokadę przed ponowną próbą**.
Dzięki temu ponowne uruchomienie nie doda przez pomyłkę kolejnych sztuk.
Nie czyści koszyka automatycznie, ponieważ mogły się w nim już znaleźć
produkty z poprzednich prób.

Poprawny wynik ma status `cart-verified-needs-human-approval`.
To nadal **nie jest zamówienie** i nie dowodzi, że dostawca je przyjął.
Finalizacja wymaga osobnej ręcznej czynności poza automatem.

Kontrolka podsumowania koszyka zależy od wersji szablonu FMIC.
Nie testowaliśmy zmian koszyka na żywej witrynie. Jeśli selektory nie pasują,
adapter nie ogłasza sukcesu; potrzebna jest analiza lokalnego screenshotu.

### 4. Historia wyników koszyka w RPM Custom

W szczegółach zamówienia, w sekcji kolejki FMIC, użyj pola
**„Zarejestruj wynik kontroli koszyka z lokalnego FMIC (JSON)”**.
Można wskazać plik `fmic-cart-<runId>.json`, ale **nie screenshot**.

Zostaną zapisane tylko id przebiegu, wynik porównania, sumy, ilości i
ewentualne komunikaty. Lokalna ścieżka zrzutu, dane klienta i
sesja nie są przekazywane do bazy. Panel
`/admin/b2b-monitor` pokaże historię tych kontroli i czy
koszyk wymaga ręcznej weryfikacji. Raport wgrany ręcznie nie stanowi
niezależnego potwierdzenia od FMIC i **nie pokazuje przebiegu na żywo**.
