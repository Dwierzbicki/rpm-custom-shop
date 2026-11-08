'use client';

import type {Dispatch,SetStateAction} from 'react';
import {createPortal} from 'react-dom';
import {ArrowRight,Check,ChevronRight,FileDown,ShoppingCart,Wrench,X} from 'lucide-react';
import type {Product,ProductOptionGroup} from '../../data';
import {money} from '../../data';
import type {GuidePart} from '../../lib/power-guides';
import {guidePrice} from '../../lib/power-guides';
import {POWER_ENGINES,POWER_RANGES} from '../../lib/storefront-config';

type SelectedGuideProduct={part:GuidePart;product:Product};
type Props={
 products:Product[];
 guideEngine:string;
 setGuideEngine:Dispatch<SetStateAction<string>>;
 guideVersion:string;
 setGuideVersion:Dispatch<SetStateAction<string>>;
 guideRange:number;
 setGuideRange:Dispatch<SetStateAction<number>>;
 guideUsage:string;
 setGuideUsage:Dispatch<SetStateAction<string>>;
 guideTier:string;
 setGuideTier:Dispatch<SetStateAction<string>>;
 guideParts:GuidePart[];
 matchedGuideParts:GuidePart[];
 guideOpenCategories:string[];
 setGuideOpenCategories:Dispatch<SetStateAction<string[]>>;
 guideDiscount:number;
 guideCartSelection:string[];
 updateGuideSelection:(id:string,checked:boolean)=>void;
 selectedGuideProducts:SelectedGuideProduct[];
 guideCartTotal:number;
 guideEligibleProducts:SelectedGuideProduct[];
 addGuideProductsToCart:()=>void;
 guideConfigOpen:boolean;
 storageReady:boolean;
 setGuideConfigOpen:Dispatch<SetStateAction<boolean>>;
 guideConfigItems:SelectedGuideProduct[];
 guideConfigGroups:(product:Product)=>ProductOptionGroup[];
 guideConfigKey:(product:Product,groupId:string)=>string;
 guideConfigValues:Record<string,string>;
 setGuideConfigValues:Dispatch<SetStateAction<Record<string,string>>>;
 guideConfigError:string;
 setGuideConfigError:Dispatch<SetStateAction<string>>;
 confirmGuideCart:()=>void;
 guideDataError:boolean;
 exportGuidePdf:()=>void;
 onBackHome:()=>void;
 onOpenProduct:(product:Product)=>void;
};

/** Controlled MotoLab / Power Guides view.
 * The Shop controller owns guide selection, local storage, PDF generation
 * and cart validation; only rendering lives here.
 */
export default function PowerGuidesView({
 products,guideEngine,setGuideEngine,guideVersion,setGuideVersion,
 guideRange,setGuideRange,guideUsage,setGuideUsage,guideTier,setGuideTier,
 guideParts,matchedGuideParts,guideOpenCategories,setGuideOpenCategories,
 guideDiscount,guideCartSelection,updateGuideSelection,
 selectedGuideProducts,guideCartTotal,guideEligibleProducts,addGuideProductsToCart,
 guideConfigOpen,storageReady,setGuideConfigOpen,guideConfigItems,guideConfigGroups,
 guideConfigKey,guideConfigValues,setGuideConfigValues,guideConfigError,setGuideConfigError,
 confirmGuideCart,guideDataError,exportGuidePdf,onBackHome,onOpenProduct
}:Props){
 return (
  <main className="page rpm-guide-page"><button className="back" onClick={onBackHome}>← Strona główna</button><span className="eyebrow">RPM CUSTOM / POWER BUILDER</span><h1>BUILD YOUR <em>POWER.</em></h1><p>Wybierz silnik, docelową moc i przeznaczenie. To wersja startowa poradnika — dobór części wymaga weryfikacji pod konkretny projekt.</p><div className="rpm-guide-controls"><div><strong>WYBIERZ SILNIK</strong><div className="rpm-guide-engine-choices">{POWER_ENGINES.map((e,i)=><button type="button" key={e.id} className={'rpm-guide-engine-choice'+(guideEngine===e.id?' active':'')} aria-pressed={guideEngine===e.id} onClick={()=>{setGuideEngine(e.id);setGuideVersion('');setGuideRange(-1);setGuideUsage('');setGuideTier('')}}><span className="rpm-guide-engine-choice-art" aria-hidden="true">{['M50','M52','M54','2JZ'][i]}</span><small>{e.make}</small><b>{e.name}</b><span>{e.subtitle}</span></button>)}</div></div>{guideEngine&&<div className="rpm-guide-step"><strong>1 / WYBIERZ WERSJĘ SILNIKA</strong><p className="rpm-guide-helper">Wybierz konkretną jednostkę — wersja GE i GTE mają różne konstrukcje oraz wymagania przy doborze osprzętu.</p><div className="rpm-guide-versions">{POWER_ENGINES.find(e=>e.id===guideEngine)?.versions.map(v=><button key={v.id} type="button" className={guideVersion===v.id?'active':''} aria-pressed={guideVersion===v.id} onClick={()=>{setGuideVersion(v.id);setGuideRange(-1);setGuideUsage('');setGuideTier('')}}><b>{v.name}</b><small>{v.detail}</small></button>)}</div></div>}{guideVersion&&<div className="rpm-guide-step"><strong>2 / ZAKRES MOCY</strong><div className="rpm-guide-choices">{POWER_RANGES.map((r,i)=><button key={r.min} className={guideRange===i?'active':''} onClick={()=>{setGuideRange(i);setGuideUsage('');setGuideTier('')}}>{r.min}–{r.max} KM</button>)}</div></div>}{guideRange>=0&&<div className="rpm-guide-step"><strong>3 / PRZEZNACZENIE</strong><div className="rpm-guide-choices">{['street','drift','track'].map(x=><button key={x} className={guideUsage===x?'active':''} onClick={()=>{setGuideUsage(x);setGuideTier('')}}>{x.toUpperCase()}</button>)}</div></div>}{guideUsage&&<div className="rpm-guide-step"><strong>4 / WARIANT ZESTAWU</strong><p className="rpm-guide-helper">Wybierz priorytet konfiguracji. Wszystkie warianty muszą spełniać wymagania techniczne i bezpieczeństwa.</p><div className="rpm-guide-tier-choices">{[{id:'budget',title:'BUDGET',tag:'ROZSĄDNY START',desc:'Najbardziej ekonomiczny poprawnie dobrany zestaw. Priorytetem jest osiągnięcie celu bez zbędnych dodatków, ale bez oszczędzania na kluczowych podzespołach.'},{id:'recommended',title:'RECOMMENDED',tag:'POLECA RPM CUSTOM',desc:'Zbalansowany wybór do codziennej i sportowej eksploatacji. Dobra reakcja, trwałość i rozsądna rezerwa wydajności.'},{id:'premium',title:'PREMIUM',tag:'MAKSYMALNA REZERWA',desc:'Wyższa klasa komponentów, większa rezerwa termiczna i wydajnościowa oraz przygotowanie do dalszego rozwoju projektu.'}].map(v=><button type="button" key={v.id} aria-pressed={guideTier===v.id} className={'rpm-guide-tier-choice'+(guideTier===v.id?' active':'')} onClick={()=>setGuideTier(v.id)}><small>{v.tag}</small><b>{v.title}</b><span>{v.desc}</span></button>)}</div></div>}</div>{guideTier&&<section className="rpm-guide-result rpm-guide-step"><span className="eyebrow">TWÓJ POWER GUIDE</span><h2>{POWER_ENGINES.find(e=>e.id===guideEngine)?.versions.find(v=>v.id===guideVersion)?.name} / {POWER_RANGES[guideRange]?.min}–{POWER_RANGES[guideRange]?.max} KM</h2><p>{guideUsage.toUpperCase()} / {guideTier.toUpperCase()}</p><div className="rpm-guide-export-bar"><span>Gotowy zestaw? Zapisz pełną listę części i orientacyjne ceny.</span><button type="button" onClick={exportGuidePdf} disabled={!guideParts.some(p=>p.enabled&&p.engineVersion===guideVersion&&p.rangeIndex===guideRange&&p.usage===guideUsage&&p.tier===guideTier)}><FileDown size={19}/> Pobierz raport PDF</button></div><section className="rpm-guide-cart-builder"><div className="rpm-guide-cart-builder-head"><div><span className="eyebrow">RPM CUSTOM / BUILD YOUR CART</span><h3>Zbuduj koszyk z polecanych części</h3><p>Zaznacz produkty ze sklepu RPM Custom. Ceny w koszyku pochodzą z katalogu sklepu, nie z wyceny FMIC.</p></div></div><div className="rpm-guide-accordion">{Array.from(new Set(matchedGuideParts.map(p=>p.category))).map((category,index)=>{const items=matchedGuideParts.filter(p=>p.category===category);const active=guideOpenCategories.includes(category);return <section key={category} className={'rpm-guide-accordion-section'+(active?' open':'')}><button type="button" className="rpm-guide-accordion-heading" aria-expanded={active} onClick={()=>setGuideOpenCategories(current=>current.includes(category)?current.filter(x=>x!==category):[...current,category])}><span className="rpm-guide-accordion-index">{String(index+1).padStart(2,'0')}</span><span className="rpm-guide-accordion-title">{category}</span><span className="rpm-guide-accordion-count">{items.length} {items.length===1?'produkt':'produkty'}</span><ChevronRight size={20} className="rpm-guide-accordion-chevron"/></button>{active&&<div className="rpm-guide-parts">{items.map(p=>{const price=guidePrice(p,guideDiscount);const linked=products.find(x=>x.id===p.productId);return <article key={p.id} className="rpm-guide-modern-card"><div className="rpm-guide-modern-top"><div className="rpm-guide-modern-image">{linked?.images?.[0]?<img src={linked.images[0]} alt={linked.name} loading="lazy"/>:<Wrench size={29} strokeWidth={1.5}/>}</div><div className="rpm-guide-modern-info"><small className="rpm-guide-modern-category">{p.category}</small><strong>{linked?.name??p.name}</strong>{linked&&<span className="rpm-guide-modern-sku">{linked.brand} · {linked.sku}</span>}{p.reason&&p.reason!=='Opis techniczny w przygotowaniu.'&&<p>{p.reason}</p>}</div></div><div className="rpm-guide-modern-bottom"><div className="rpm-guide-modern-price"><small>{linked?'Cena w sklepie RPM Custom':'Cena orientacyjna'}</small><strong>{linked?money(linked.price):price===null?'Do wyceny':money(price)}</strong>{p.fmicPrice!==null&&<span>Referencja FMIC: {money(p.fmicPrice)}</span>}</div><label className="rpm-guide-accordion-select"><input type="checkbox" disabled={!linked||(linked as Product&{stockStatus?:string}).stockStatus==='unavailable'} checked={!!linked&&(linked as Product&{stockStatus?:string}).stockStatus!=='unavailable'&&guideCartSelection.includes(p.id)} onChange={e=>updateGuideSelection(p.id,e.target.checked)}/><span className="rpm-guide-select-icon"><Check size={13} strokeWidth={3}/></span><span className="rpm-guide-select-text">{!linked?'Brak w sklepie':(linked as Product&{stockStatus?:string}).stockStatus==='unavailable'?'Niedostępny':guideCartSelection.includes(p.id)?'W zestawie':'Wybierz'}</span></label></div><div className="rpm-guide-modern-links">{linked&&<button type="button" onClick={()=>onOpenProduct(linked)}>Szczegóły i warianty <ArrowRight size={15}/></button>}{p.fmicUrl&&<a href={p.fmicUrl} target="_blank" rel="noopener noreferrer">Zobacz referencję FMIC ↗</a>}</div></article>})}</div>}</section>})}</div><div className="rpm-guide-cart-summary"><span>Cena wybranego zestawu <small>({selectedGuideProducts.length} produktów)</small></span><strong>{money(guideCartTotal)}</strong></div><div className="rpm-guide-cart-builder-footer"><small>Produkty wymagające konfiguracji uzupełnisz w kolejnym kroku. Do koszyka trafiają tylko dostępne produkty powiązane z katalogiem.</small><button type="button" disabled={!guideEligibleProducts.length} onClick={addGuideProductsToCart}><ShoppingCart size={17}/> Dodaj wybrane do koszyka</button></div></section>{guideConfigOpen&&storageReady&&createPortal(<div className="rpm-guide-config-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setGuideConfigOpen(false)}}><section className="rpm-guide-config-dialog" role="dialog" aria-modal="true" aria-labelledby="rpm-guide-config-title"><div className="rpm-guide-config-head"><div><span className="eyebrow">RPM CUSTOM / DOPASOWANIE ZESTAWU</span><h2 id="rpm-guide-config-title">Skonfiguruj części przed dodaniem</h2><p>Wybierz wymagane warianty. Sprawdzimy zgodność wybranych typów flansz.</p></div><button type="button" aria-label="Zamknij" onClick={()=>setGuideConfigOpen(false)}><X size={20}/></button></div><div className="rpm-guide-config-content">{guideConfigItems.map(({product})=><div className="rpm-guide-config-product" key={product.id}><strong>{product.name}</strong><small>{product.sku} · {money(product.price)}</small>{guideConfigGroups(product).map(group=><label key={group.id}>{group.name}{group.required?' *':''}<select value={guideConfigValues[guideConfigKey(product,group.id)]??''} onChange={e=>{setGuideConfigValues(v=>({...v,[guideConfigKey(product,group.id)]:e.target.value}));setGuideConfigError('')}}><option value="">Wybierz wariant</option>{group.options.map(option=><option key={option.id} value={option.id}>{option.label}{option.price?' (+'+money(option.price)+')':''}</option>)}</select></label>)}{product.configurable&&!guideConfigGroups(product).length&&<><label>Flansza turbo *<select value={guideConfigValues[guideConfigKey(product,'legacy-flange')]??''} onChange={e=>{setGuideConfigValues(v=>({...v,[guideConfigKey(product,'legacy-flange')]:e.target.value}));setGuideConfigError('')}}><option value="">Wybierz flanszę</option>{['T3','T4','V-Band'].map(v=><option key={v} value={v}>{v}</option>)}</select></label><label>Wastegate *<select value={guideConfigValues[guideConfigKey(product,'legacy-wastegate')]??''} onChange={e=>{setGuideConfigValues(v=>({...v,[guideConfigKey(product,'legacy-wastegate')]:e.target.value}));setGuideConfigError('')}}><option value="">Wybierz wariant</option><option value="Single">Single</option><option value="Twin">Twin</option></select></label></>}</div>)}</div><div className="rpm-guide-config-bottom"><p>Uwaga: automatycznie porównujemy tylko rozpoznane typy flansz. Pełną kompatybilność i dostępność potwierdza RPM Custom.</p>{guideConfigError&&<p className="rpm-guide-config-error" role="alert">{guideConfigError}</p>}<div><button type="button" className="rpm-guide-config-cancel" onClick={()=>setGuideConfigOpen(false)}>Wróć</button><button type="button" className="rpm-guide-config-submit" onClick={confirmGuideCart}><ShoppingCart size={17}/> Potwierdź i przejdź do koszyka</button></div></div></section></div>,document.body)}{guideDataError?<p className="rpm-guide-disclaimer">Nie udało się pobrać aktualnych rekomendacji. Spróbuj ponownie później.</p>:!guideParts.some(p=>p.engineVersion===guideVersion&&p.rangeIndex===guideRange&&p.usage===guideUsage&&p.tier===guideTier)?<p className="rpm-guide-disclaimer">Rekomendacje części dla tej konfiguracji są w przygotowaniu. Wkrótce pojawią się tutaj zweryfikowane modele, ceny FMIC i oferta RPM Custom.</p>:<p className="rpm-guide-disclaimer">Ceny i dostępność wymagają potwierdzenia. Rekomendacje nie gwarantują osiągnięcia deklarowanej mocy; wymagają weryfikacji projektu i strojenia.</p>}</section>}</main>
 );
}
