import type {CatalogItem} from './catalog-db';
import {manifoldPreset} from './manifold-options';

export const manifoldDraftMarker='manual_catalog_import:rpm_manifolds:2026-11-26';

export function manifoldDrafts():{key:string;input:Omit<CatalogItem,'id'|'sku'>}[]{
 const common={
  brand:'RPM Custom',category:'Kolektory',targetCategory:['Układ wydechowy','Kolektory wydechowe'],
  price:0,configurable:true,stockStatus:'order' as const,leadTime:'Około 3 tygodni — do potwierdzenia',
  visible:false,images:[],motolab:null
 };
 return [
  {key:'bmw-m50-m52-m54',input:{...common,name:'Kolektor turbo BMW M50 / M52 / M54 — RPM Custom',engine:'BMW M50 / M52 / M54',
   description:'Kolektor wydechowy turbo RPM Custom wykonywany na zamówienie do indywidualnego projektu BMW. Wybierz silnik M50, M52 lub M54, docelowe nadwozie E36, E46, E8x lub E9x, flanszę turbosprężarki i opcję króćców EGT. Liczba przyłączy wastegate wynika z wyboru flanszy: single scroll — jedno, twin scroll — dwa. Przed realizacją potwierdzamy dokładną wersję silnika, położenie turbosprężarki, miejsce na osprzęt i zgodność z nadwoziem. Wybór nadwozia nie oznacza fabrycznej zgodności wszystkich kombinacji. Termin realizacji do potwierdzenia.',
   optionGroups:manifoldPreset('bmw'),attributes:{'Rodzina silnika':'BMW M50 / M52 / M54','Nadwozie docelowe':'E36 / E46 / E8x / E9x','Wykonanie':'Na zamówienie'}}},
  {key:'toyota-2jz-ge',input:{...common,name:'Kolektor turbo Toyota 2JZ GE — RPM Custom',engine:'Toyota 2JZ GE',
   description:'Kolektor wydechowy turbo RPM Custom wykonywany na zamówienie do projektu z silnikiem Toyota 2JZ GE. Dostępna konfiguracja flanszy T3/T4 single scroll lub twin scroll, V-Band oraz opcja króćców EGT. Liczba przyłączy wastegate jest dobierana automatycznie do flanszy. Przed realizacją potwierdzamy wersję głowicy, turbosprężarkę, nadwozie i przestrzeń montażową. Oferta dotyczy kolektora do 2JZ GE; zgodność z 2JZ GTE nie jest deklarowana. Termin realizacji do potwierdzenia.',
   optionGroups:manifoldPreset('2jz-ge'),attributes:{'Rodzina silnika':'Toyota 2JZ GE','Wykonanie':'Na zamówienie'}}}
 ];
}
