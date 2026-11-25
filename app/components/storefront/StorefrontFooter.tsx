'use client';
import {useStorefrontLanguage} from './hooks/useStorefrontLanguage';
import {ArrowUpRight,Mail,Facebook} from 'lucide-react';
import {categoryPath} from '../../category-routing';
import {DEFAULT_COMMUNITY} from '../../lib/community-settings';
import './storefront-footer.css';

type Lang='pl'|'en';
const categoryLinks=[
 ['Układ dolotowy','Intake'],['Układ chłodzenia','Cooling'],['Układ paliwowy','Fuel system'],
 ['Układ wydechowy','Exhaust'],['Silnik i turbo','Engine & turbo'],['Elektronika','Electronics']
];
export default function StorefrontFooter({lang}:{lang?:Lang}){
 const current=useStorefrontLanguage();
 const en=(lang??current.lang)==='en';
 const tr=(pl:string,english:string)=>en?english:pl;
 return <footer className="rpm-store-footer">
  <div className="rpm-footer-inner">
   <div className="rpm-footer-grid">
    <section className="rpm-footer-brand">
     <a href="/" aria-label="RPM Custom"><img src="/optimized/logo.webp" width={1024} height={350} loading="lazy" alt="RPM Custom"/></a>
     <p>{tr('Części performance, motorsport i indywidualne rozwiązania dla Twojego projektu.','Performance parts, motorsport and custom solutions for your build.')}</p>
     <a className="rpm-footer-social" href={DEFAULT_COMMUNITY.groupUrl} target="_blank" rel="noopener noreferrer"><Facebook size={18} aria-hidden="true"/>{tr('Społeczność na Facebooku','Facebook community')}<ArrowUpRight size={14} aria-hidden="true"/></a>
    </section>
    <nav aria-label={tr('Sklep','Shop')}><h2>{tr('Sklep','Shop')}</h2><ul>
     {categoryLinks.map(([pl,english])=><li key={pl}><a href={categoryPath([pl])}>{tr(pl,english)}</a></li>)}
     <li><a href="/sklep">{tr('Cały katalog','Full catalogue')}</a></li>
    </ul></nav>
    <nav aria-label={tr('Obsługa klienta','Customer service')}><h2>{tr('Obsługa klienta','Customer service')}</h2><ul>
     <li><a href="/informacje#zamowienia">{tr('Jak zamawiać','How to order')}</a></li>
     <li><a href="/informacje#dostawa">{tr('Dostawa i płatności','Shipping and payment')}</a></li>
     <li><a href="/informacje#zwroty">{tr('Zwroty i reklamacje','Returns and complaints')}</a></li>
     <li><a href="/account">{tr('Moje konto','My account')}</a></li>
     <li><a href="/koszyk">{tr('Koszyk','Cart')}</a></li>
    </ul></nav>
    <nav aria-label="RPM Custom"><h2>RPM Custom</h2><ul>
     <li><a href="/#rpm-custom-home">{tr('Produkcja i projekty custom','Custom fabrication')}</a></li>
     <li><a href="/power-guides">MotoLab</a></li>
     <li><a href="/designery">{tr('Kreatory CAD','CAD designers')}</a></li>
     <li><a href="/cr-calculator">{tr('Kalkulator CR','CR calculator')}</a></li>
     <li><a href="/garage">RPM Garage</a></li>
     <li><a href="/autopomoc">{tr('Pomoc drogowa','Road assistance')}</a></li>
    </ul></nav>
    <section className="rpm-footer-contact"><h2>{tr('Kontakt','Contact')}</h2><p>{tr('Masz pytanie o części lub projekt? Napisz do nas.','Questions about parts or your build? Contact us.')}</p>
     <a href="mailto:info@rpmcustom.pl"><Mail size={18} aria-hidden="true"/>info@rpmcustom.pl</a>
     <a href="/informacje#kontakt">{tr('Informacje kontaktowe','Contact information')}<ArrowUpRight size={14} aria-hidden="true"/></a>
    </section>
   </div>
   <div className="rpm-footer-bottom"><span>© {new Date().getFullYear()} RPM Custom. {tr('Wszelkie prawa zastrzeżone.','All rights reserved.')}</span><a href="/informacje">{tr('Informacje dla klientów','Customer information')}</a><span>PERFORMANCE · TIG · MOTORSPORT</span></div>
  </div>
 </footer>
}
