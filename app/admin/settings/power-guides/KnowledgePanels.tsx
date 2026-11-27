'use client';
import {useState} from 'react';
import KnowledgeEditor from './KnowledgeEditor';
import ResearchCenter from './ResearchCenter';
import {POWER_ENGINES,powerRangesFor,approvedPowerRange} from '../../../lib/storefront-config';
import {rodOptionsFor} from '../../../lib/power-build-profile';
import {allCandidates,candidateBrand} from '../../../lib/motolab-build-plan';
import {productPath} from '../../../lib/product-path';
export function EngineDatabasePanel(){
 const [family,setFamily]=useState('all');
 const families=POWER_ENGINES.filter(g=>family==='all'||g.id===family);
 return <><KnowledgeEditor kind="engine"/><details className="rpm-settings-card rpm-power-fold"><summary>Aktualne reguły i zakresy Power Buildera</summary><p>Aktualne zakresy projektowe Power Buildera. Nie są limitami wytrzymałości seryjnych części. Dane geometryczne, wersje NV/TU i VVT-i oraz receptury hybryd wymagają zatwierdzenia przed dodaniem do reguł.</p>
 <label className="rpm-settings-field">Rodzina silnika<select value={family} onChange={e=>setFamily(e.target.value)}><option value="all">Wszystkie</option>{POWER_ENGINES.map(g=><option key={g.id} value={g.id}>{g.make} {g.id.toUpperCase()}</option>)}</select></label>
 <div className="rpm-power-admin-table-wrap"><table className="rpm-power-admin-table"><thead><tr><th>Silnik</th><th>Zakresy projektowe (KM)</th><th>Korbowody — opcje klienta</th><th>Zakres</th></tr></thead><tbody>{families.flatMap(g=>g.versions.map(v=><tr key={v.id}><td><strong>{g.make} {v.name}</strong></td><td>{powerRangesFor(v.id).map(r=>r.min+'–'+r.max).join(' / ')}</td><td>{rodOptionsFor(v.id).map(r=>({stock:'Seryjne',m50b25nv:'M50B25 NV',forged:'Kute',auto:'Do oceny'})[r]).join(' / ')}</td><td>{approvedPowerRange(v.id)?'Zakres przyjęty w konfiguratorze':'Wstępny'}</td></tr>))}</tbody></table></div>
 <p>Edytor powyżej zapisuje osobne rekordy wiedzy, bez zmiany tego podglądu aktywnych reguł.</p></details></>;
}
export function TechnicalResearchPanel(){return <ResearchCenter/>}
export function TechnicalPartsPanel(){
 const [query,setQuery]=useState(''),[onlyVerified,setOnlyVerified]=useState(false);
 const rows=Object.entries(allCandidates).filter(([key,c])=>(!onlyVerified||!!c.verification)&&[c.sku,c.expectedName,candidateBrand(key)??''].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 return <><KnowledgeEditor kind="technical"/><details className="rpm-settings-card rpm-power-fold"><summary>Dane istniejących kandydatów SKU</summary><p>Aktualne dane źródłowe kandydatów Power Buildera. Status weryfikacji dotyczy tylko wskazanego parametru, nie pełnej zgodności części.</p>
 <div className="admin-toolbar"><label className="rpm-settings-field">Szukaj SKU, modelu lub marki<input value={query} onChange={e=>setQuery(e.target.value)}/></label><label><input type="checkbox" checked={onlyVerified} onChange={e=>setOnlyVerified(e.target.checked)}/> Tylko z weryfikacją producenta</label></div>
 <p>{rows.length} / {Object.keys(allCandidates).length} kandydatów · podgląd danych zapisanych w kodzie, nie sprawdzenie bieżącej dostępności</p>
 <div className="rpm-power-admin-table-wrap"><table className="rpm-power-admin-table"><thead><tr><th>Produkt / SKU</th><th>Parametry i uwagi</th><th>Źródło / status</th></tr></thead><tbody>{rows.map(([key,c])=><tr key={key}><td><strong>{c.expectedName}</strong><small>{c.sku} · {candidateBrand(key)}</small><a href={productPath(c.expectedName,c.sku)} target="_blank" rel="noopener noreferrer">Otwórz produkt</a></td><td>{c.note[0]}</td><td>{c.verification?<><strong>Zweryfikowany zakres</strong><small>{c.verification.scope[0]}</small><small>{c.verification.checkedOn}</small></>:<small>Do potwierdzenia</small>}{(c.verification?.url??c.source)&&<a href={c.verification?.url??c.source} target="_blank" rel="noopener noreferrer">Dokumentacja</a>}</td></tr>)}</tbody></table></div>
 {!rows.length&&<p>Brak dopasowań.</p>}
 <p>Wykorzystanie zatwierdzonych danych w regułach jest w przygotowaniu.</p></details></>;
}
export function PowerBuilderPanel(){
 const stages=[['Parametry klienta','Działa','Silnik, zakres mocy, zastosowanie, paliwo, tłoki, korbowody, charakterystyka i budżet.'],['Wariant konfiguracji','Reguły wstępne','Proponowany po analizie preferencji; nie jest porównaniem pełnych buildów.'],['Katalog i ceny','Działa','Konkretne SKU, aktualna wycena katalogowa, zamiana i pomijanie części.'],['Kontrola techniczna','Częściowa','Reguły flanszy, kompletności turbo i zapotrzebowania paliwowego.'],['Dane z hamowni','Częściowa','CSV i transkrypcja; wykorzystanie do automatycznej rekomendacji w przygotowaniu.'],['AI i źródła internetowe','W przygotowaniu','Research API wymaga aktywacji; analiza zdjęć/PDF i optymalizacja zestawów w przygotowaniu.']];
 return <section className="rpm-settings-card"><h2>Power Builder AI</h2><p>Status mechanizmu rekomendacji. Zestawy pozostają wstępnymi propozycjami do weryfikacji.</p><div className="rpm-power-admin-table-wrap"><table className="rpm-power-admin-table"><thead><tr><th>Etap</th><th>Status</th><th>Zakres</th></tr></thead><tbody>{stages.map(([label,status,desc])=><tr key={label}><td><strong>{label}</strong></td><td>{status}</td><td>{desc}</td></tr>)}</tbody></table></div></section>;
}
