import type {Metadata} from 'next';
import StandaloneStorefrontHeader from '../components/storefront/StandaloneStorefrontHeader';
import StorefrontFooter from '../components/storefront/StorefrontFooter';

export const metadata:Metadata={title:'Informacje dla klientów',description:'Informacje o zamówieniach, dostawie, zwrotach i kontakcie z RPM Custom.'};

export default function CustomerInformationPage(){
 return <>
 <StandaloneStorefrontHeader/>
 <main className="page rpm-info-page">
  <div className="page-heading"><span className="eyebrow">RPM CUSTOM / CUSTOMER SERVICE</span><h1>Informacje dla klientów</h1><p>Zakupy, realizacja zamówień i kontakt z RPM Custom.</p></div>
  <section id="zamowienia"><h2>Jak zamawiać</h2><p>Wybierz produkty z <a href="/sklep">katalogu</a>, dodaj je do koszyka i sprawdź dane zgłoszenia. Aktualny formularz umożliwia wysłanie zgłoszenia zamówienia bez płatności online. Dostępność, końcowy koszt i warunki realizacji potwierdzamy przed zawarciem umowy.</p></section>
  <section id="dostawa"><h2>Dostawa i płatności</h2><p>Dostępne metody dostawy i płatności oraz ich koszty zależą od zamówienia. Przed zawarciem umowy otrzymasz informację o całkowitej cenie, terminie i kosztach dostawy oraz sposobie płatności. W sprawie dostawy nietypowych gabarytów i zamówień zagranicznych skontaktuj się z nami.</p></section>
  <section id="zwroty"><h2>Zwroty i reklamacje</h2><p>Konsument kupujący na odległość co do zasady może odstąpić od umowy w ciągu 14 dni od otrzymania towaru. Przepisy przewidują wyjątki, między innymi dla rzeczy nieprefabrykowanych wykonanych według indywidualnej specyfikacji klienta. Wyjątek nie obejmuje automatycznie wszystkich części tuningowych.</p><p>W przypadku niezgodności towaru z umową możesz złożyć reklamację. W celu skontaktowania się z nami napisz na <a href="mailto:info@rpmcustom.pl">info@rpmcustom.pl</a>. Nie ogranicza to ustawowych sposobów dochodzenia roszczeń. Więcej informacji o prawach konsumenta: <a href="https://prawakonsumenta.uokik.gov.pl/">UOKiK</a>.</p></section>
  <section id="kontakt"><h2>Kontakt</h2><p>Sklep i projekty indywidualne: <a href="mailto:info@rpmcustom.pl">info@rpmcustom.pl</a>.</p><p>Pomoc drogowa: <a href="/autopomoc">RPM Custom Road Assistance</a>.</p></section>
 </main>
 <StorefrontFooter/>
 </>
}
