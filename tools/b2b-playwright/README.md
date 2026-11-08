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

## Lokalny agent z podglądem etapów na żywo w RPM Custom

Agent uruchamiany jest **na Twoim komputerze**, nie przez serwer Render.
Jego postęp trafia do `/admin/b2b-monitor` z odświeżaniem co 10 sekund.
Monitorujemy etapy bez przesyłania ciasteczek, haseł, danych adresowych
klientów, URL panelu ani screenshotów.

### Konfiguracja (Windows PowerShell)

1. W Render, w serwisie **RPM Custom Shop**, ustaw nową zmienną środowiskową
   `RPM_B2B_AGENT_TOKEN` na **losową wartość co najmniej 32 znaków**
   (zalecane 64 znaki hex). Zachowaj ją prywatnie.
2. Taką samą wartość ustaw **wyłącznie lokalnie**, w sesji PowerShell.
   Nigdy nie commituj jej ani nie przesyłaj przez czat.
3. W panelu `/admin/orders` zatwierdź szkic zakupowy, dodaj zadanie FMIC do
   kolejki i pobierz `rpm-b2b-demo-<ID>-fmic.json`.
4. Uzupełnij lokalny plik `fmic-products.local.json` przypisując
   prawidłowe URL kart produktów do SKU. Plik ten jest ignorowany w Git.

```powershell
cd tools/b2b-playwright
npm install
npx playwright install chromium

$env:RPM_SHOP_URL="https://rpm-custom-shop.onrender.com"
$env:RPM_B2B_AGENT_TOKEN="<wstaw_wartosc_z_Render>"
node agent-run.mjs "C:\\Users\\<konto>\\Downloads\\rpm-b2b-demo-123-fmic.json" "./fmic-products.local.json"
```

**Domyślnie tylko podgląd produktów:** agent kolejno odwiedza ich karty
na FMIC, weryfikuje SKU i raportuje etapy do panelu RPM Custom.
Nie dodaje niczego do koszyka, nie klika finalizacji.

### Przygotowywanie koszyka (tylko świadomie włączony tryb)

Najpierw sprawdź na lokalnym Chromium, czy selektory i bieżące ceny FMIC
są poprawnie rozpoznawane, a koszyk jest pusty. W pliku konfiguracji
każda pozycja musi mieć świadomie ustawione `maxUnitGrossPLN`.
Potem użyj jednocześnie **trzech zabezpieczeń**:

```powershell
$env:RPM_FMIC_CART_WRITE="YES"
node agent-run.mjs "C:\\Users\\<konto>\\Downloads\\rpm-b2b-demo-123-fmic.json" "./fmic-products.local.json" --cart-only --confirm-cart-only
Remove-Item Env:RPM_FMIC_CART_WRITE
```

Agent musi mieć aktualne zadanie zatwierdzone na serwerze i aktywne
w kolejce. Bez połączenia z monitoringiem **nie rozpocznie pracy**.
Utrata dostępu do API w trakcie wykonywania zatrzymuje kolejne kroki.

Playwright może dodać produkty tylko przez znany formularz koszyka.
Sprawdza potem ilości, SKU i kwoty. **Nie istnieje ścieżka automatycznego
wysyłania zamówienia.** Operator sam kontroluje pełny koszyk FMIC i
ręcznie dokonuje zakupów, poza agentem.

Po niepewnej lub częściowo zakończonej próbie pozostaje lokalna
blokada `fmic-cart-lock-<jobId>.json` — nie uruchamiaj ponownie,
dopóki nie sprawdzisz ręcznie zawartości koszyka.

### Uprawnienia, ograniczenia i status wdrożenia

- Token umożliwia **wyłącznie zgłaszanie etapów**, nie zarządzanie koszykiem
  ani pobieranie danych klienta. Każdy etap jest weryfikowany względem
  zatwierdzonego `jobId` i fingerprintu w PostgreSQL.
- Lokalny agent wymaga jawnego uruchomienia przez operatora.
  To **nie jest** automatyczny worker uruchamiany w chmurze i nie wystartuje
  sam po dodaniu zadania do kolejki.
- Etapy w panelu są deklarowane przez własny lokalny agent; nie stanowią
  potwierdzenia złożenia zamówienia przez dostawcę.
- Z powodu braku zweryfikowanego DOM produkcyjnego FMIC, selektory muszą
  przejść realną lokalną inspekcję. Każda nierozpoznana kontrolka zatrzymuje
  dalsze działania.


## macOS (Apple Silicon): logowanie FMIC i obowiązkowa kontrola koszyka

Po zaktualizowaniu repozytorium:

```bash
cd ~/Projects/rpm-custom-shop
git pull
cd tools/b2b-playwright
npm install
npx playwright install chromium
npm test
```

### Logowanie: wyłącznie ręcznie, na Twoim Macu

```bash
npm run fmic:login
```

Otworzy się Chromium na `https://fmic.pl/`. **Ty sam** wpisujesz login i
hasło w oficjalnym formularzu FMIC, kończysz ewentualne 2FA/CAPTCHA, a
następnie wracasz do Terminala i wpisujesz dokładnie `ZAPISZ`.

Cookies sesji będą przechowywane **tylko lokalnie** w
`tools/b2b-playwright/.auth/fmic.storage-state.json` z uprawnieniami
`600`. Plik jest ignorowany przez Git. Nie wysyłaj go do nikogo,
tak samo jak hasła. Ten krok zapisuje sesję, ale **nie stanowi potwierdzenia,
że logowanie się udało**.

### Obowiązkowy test koszyka — bez jakiejkolwiek zmiany

```bash
npm run fmic:cart-check
```

Możliwe wyniki: `empty`, `nonempty` i `unknown`.

- `empty` — tylko po wykryciu **jawnego komunikatu o pustym koszyku**;
- `nonempty` — zatrzymanie i pokazanie liczby pozycji (SKU/ilości
  jeśli rozpoznane);
- `unknown` — nieznany HTML, brak potwierdzenia sesji, przekierowanie,
  błąd odczytu: **bezpieczne zatrzymanie**.

Dla `nonempty` i `unknown` narzędzie kończy pracę kodem 2;
nie wysyła zamówienia, nie zmienia koszyka i nie usuwa produktów.
Po sprawdzeniu możesz samodzielnie otworzyć
`https://fmic.pl/checkout/cart/`, wyczyścić zawartość **ręcznie i tylko
jeśli wyraźnie tego chcesz**, a następnie ponowić test.

Panel `/admin/b2b-monitor` po uruchomieniu zadania FMIC w trybie
`cart-only` pokaże odczyt koszyka, liczbę pozycji, status zatrzymania
i rozpoznane SKU/ilości. Informacja pochodzi z lokalnego Playwrighta,
nie ze zdalnego potwierdzenia FMIC. Sesja/logowanie pozostaje lokalne.
**W panelu nie ma jeszcze przycisku czyszczącego koszyk.**

### Zabezpieczenie przed dodawaniem produktów

W `agent-run.mjs` preflight jest obowiązkowy przed operacjami
`cart-only`; serwer monitoringu także odrzuca kolejne etapy bez
wcześniejszego `cart_empty`. Sam adapter Playwright **ponownie**
sprawdza koszyk w swojej własnej sesji przed odblokowaniem
`POST /checkout/cart/add` — dzięki temu koszyk pełny w chwili
startu drugiej przeglądarki również zatrzyma automat.

Nie uruchamiaj `cart-only` na żywym FMIC, zanim nie potwierdzimy
selektorów prawdziwego koszyka, sesji i formatu URL dodawania produktu.
Dotychczasowe testy koszyka na Chromium są testami **lokalnej makiety**,
nie testem produkcyjnego dodawania do FMIC.

**Nie istnieje funkcja automatycznej finalizacji ani wysyłki zamówienia.**


### Gdy odczyt koszyka zwraca `unknown`

Nie uruchamiaj trybu `cart-only`. Nie jest to dowód pustego koszyka
ani nie musi oznaczać nieudanego logowania. W nowej sesji Terminala
możesz bez zmiany koszyka wykonać:

```bash
cd ~/Projects/rpm-custom-shop/tools/b2b-playwright
npm run fmic:cart-diagnose
```

Diagnostyka korzysta z **lokalnie zapisanej sesji FMIC**.
Drukuje tylko liczby elementów HTML, bezpieczne nazwy klas i identyfikatorów,
wskazówki o pustym koszyku (same wartości logiczne), typ strony
(`cart`, `login`, `other_fmic` lub `offsite`) oraz sumaryczną liczbę
zablokowanych żądań. **Nie drukuje** cookies, haseł, tekstu strony,
URL-i z tokenami, nazw klientów, zdjęć ani danych produktów.

Żadne zmiany koszyka, checkout, płatności ani składanie zamówień
nie są dozwolone. To narzędzie służy wyłącznie do diagnozy rzeczywistego
HTML sklepu; jego uruchomienie nie znosi blokady `unknown`.

### FMIC — wykrywanie pozycji koszyka z rzeczywistej strony (2026-11-08)

Lokalna diagnostyka na macOS potwierdziła nowy układ HTML (Tailwind),
zamiast starego `.cart.table-wrapper`:
`body.checkout-cart-index`, `.cart-summary`, `#empty_cart_button`
oraz pole ilości `input[id^="cart-"][id$="-qty"][name$="[qty]"]`.

Preflight rozpoznaje **niepusty** koszyk na podstawie tych niezależnych
wskaźników i widocznych pól ilości. Pozyskuje wyłącznie liczbę pozycji
oraz ilości. Nie zgaduje SKU z wewnętrznego identyfikatora pozycji,
nazwy ani tytułu; SKU może pozostać `null`. Identyfikator pozycji
nie jest wysyłany do monitoringu. `#empty_cart_button` służy wyłącznie
do rozpoznania struktury — **nigdy nie jest klikany**.

Brak pól ilości lub brak rozpoznanej struktury nadal daje `unknown`,
**nie** oznacza pustego koszyka. Nadal wymagamy jawnego komunikatu
o pustym koszyku przed ewentualnym przygotowaniem zamówienia.
Żadnych operacji czyszczenia, checkoutu, płatności ani finalizacji.


### Kod SKU w prawdziwym koszyku FMIC (kolejny etap)

Po potwierdzeniu jednej pozycji w prawdziwym koszyku (1 sztuka)
dodatkowo próbujemy znaleźć widoczny kod SKU **w obrębie tej samej
pozycji co jej pole ilości**. Wspierane jawne znaczniki to:
`.sku`, `.product-item-sku`, `[itemprop="sku"]` oraz `[data-sku]`.

Nigdy nie wyprowadzamy SKU z nazwy produktu, URL, `cart-<id>-qty`,
danych sesji lub sąsiedniej pozycji. Nieznany albo niejednoznaczny kod
pozostaje `null`; wykrycie niepustego koszyka działa nadal niezależnie.

```bash
cd ~/Projects/rpm-custom-shop/tools/b2b-playwright
npm run fmic:cart-check
```

Jeśli SKU nadal jest `null`, uruchom `npm run fmic:cart-diagnose`.
W polu `skuNeighborhood` pokażą się wyłącznie poziomy przodków
elementu ilości, nazwy tagów/klas i **liczby** znaczników SKU. Nie ma
tam treści SKU, wewnętrznego numeru pozycji koszyka, haseł czy cookies.
Dzięki temu można uściślić odczyt prawdziwego HTML bez udostępniania
danych logowania i bez zmiany koszyka.

**Nadal nie wolno uruchamiać zapisu do koszyka tylko dlatego, że SKU
zostało znalezione.** Osobne reguły weryfikacji cen, wariantów i
bezpiecznego dodawania produktów wymagają rzeczywistej walidacji.
