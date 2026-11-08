'use client';
import ProductCard from './components/storefront/ProductCard';
import CartLineList from './components/storefront/CartLineList';
import HomeSections from './components/storefront/HomeSections';
import CatalogView from './components/storefront/CatalogView';
import ProductDetailView from './components/storefront/ProductDetailView';
import CartView from './components/storefront/CartView';
import CheckoutView from './components/storefront/CheckoutView';
import PowerGuidesView from './components/storefront/PowerGuidesView';
import StorefrontHeader from './components/storefront/StorefrontHeader';
import type {OrderReceipt} from './components/storefront/CheckoutView';
import type {FormEvent} from 'react';
import {checkoutRequestKey,clearCheckoutRequestKey} from './lib/checkout-idempotency';
import {en} from './lib/translations';
import {FMIC_CATEGORY_DESCRIPTIONS,FMIC_CATEGORY_ICONS,POWER_ENGINES,POWER_RANGES,categories,phonePrefixes} from './lib/storefront-config';
import type {View} from './lib/storefront-config';
import {PaymentMethod,PaymentSettings,DEFAULT_PAYMENT_SETTINGS,availablePaymentMethods} from './lib/payment-settings';
import {parsePolishAddress} from './company-utils.mjs';
import {shippingQuote,ShippingMethod,ShippingSettings,DEFAULT_SHIPPING_SETTINGS} from './lib/shipping';
import {useCallback,useEffect,useMemo,useState} from 'react';
import InlineHomepageEditor from './inline-homepage-editor';
import {createPortal} from 'react-dom';
import {ShoppingCart,Search,Menu,X,UserRound,ChevronRight,Plus,Minus,Trash2,Warehouse,Settings2,Wrench,Check,ArrowRight,Package,ShieldAlert,ZoomIn,ChevronLeft,FileDown,Wind,Droplets,Fuel,Flame,Disc,GitBranch,Gauge,Cpu,Armchair,Sparkles,Boxes} from 'lucide-react';
import {products as demoProducts,money,Product,CartLine} from './data';
import {SHOP_DEPARTMENTS,ShopSubcategory} from './shop-departments';
import {FMIC_CATEGORY_TREE} from './fmic-categories';
import {DEFAULT_HOMEPAGE_DRAFT,readHomepageDraft,HomepageDraft} from './lib/homepage-editor';
import {categoryPath,resolveCategoryPath} from './category-routing';
import {GuidePart,guidePrice} from './lib/power-guides';
import {buildCatalogFilters,matchesCatalogAttributes} from './lib/catalog-filters';
export default function Shop(){
 const [homepageDraft,setHomepageDraft]=useState<HomepageDraft>(DEFAULT_HOMEPAGE_DRAFT);
 const [inlineEditRequested,setInlineEditRequested]=useState(false);
 const updateHomepageDraft=useCallback((next:HomepageDraft)=>setHomepageDraft(next),[]);
 useEffect(()=>{setInlineEditRequested(new URLSearchParams(window.location.search).get('rpmEdit')==='1')},[]);
 useEffect(()=>{
 if(new URLSearchParams(window.location.search).get('hpPreview')!=='1')return;
 setHomepageDraft(readHomepageDraft());
 const receive=(event:MessageEvent)=>{
  if(event.origin!==window.location.origin||event.source!==window.parent)return;
  const data=event.data;
  if(data?.type!=='rpm-editor:update'||!data.draft||typeof data.draft!=='object')return;
  const next={...DEFAULT_HOMEPAGE_DRAFT};
  for(const key of Object.keys(next) as (keyof HomepageDraft)[]){
   if(typeof data.draft[key]==='string')next[key]=data.draft[key].slice(0,1000);
  }
  setHomepageDraft(next);
 };
 const select=(event:MouseEvent)=>{
  if(window.parent===window)return;
  const node=(event.target as HTMLElement).closest<HTMLElement>('[data-rpm-edit]');
  if(!node)return;
  event.preventDefault();event.stopPropagation();
  document.querySelectorAll('.rpm-edit-selected').forEach(el=>el.classList.remove('rpm-edit-selected'));
  node.classList.add('rpm-edit-selected');
  window.parent.postMessage({type:'rpm-editor:select',key:node.dataset.rpmEdit},window.location.origin);
 };
 window.addEventListener('message',receive);
 document.addEventListener('click',select,true);
 return()=>{window.removeEventListener('message',receive);document.removeEventListener('click',select,true)};
},[]);
 const [products,setProducts]=useState<Product[]>(demoProducts);
 const [activeBuild,setActiveBuild]=useState(0);
 const [shopLanding,setShopLanding]=useState(false);
 const [expandedShopCategory,setExpandedShopCategory]=useState<string|null>(null);
 const [shopSubcategory,setShopSubcategory]=useState<ShopSubcategory|null>(null);
 const [guideEngine,setGuideEngine]=useState('');
 const [guideVersion,setGuideVersion]=useState('');
 const [guideRange,setGuideRange]=useState(-1);
 const [guideUsage,setGuideUsage]=useState('');
 const [guideTier,setGuideTier]=useState('');
 const [guideParts,setGuideParts]=useState<GuidePart[]>([]);
 const [guideOpenCategories,setGuideOpenCategories]=useState<string[]>([]);
 const [guideCartSelection,setGuideCartSelection]=useState<string[]>([]);
 const matchedGuideParts=guideParts.filter(p=>p.enabled&&p.engineVersion===guideVersion&&p.rangeIndex===guideRange&&p.usage===guideUsage&&p.tier===guideTier);
 const guideSelectionKey=['rpm-power-guide-selection-v1',guideVersion,guideRange,guideUsage,guideTier].join(':');
 useEffect(()=>{if(!guideParts.length||!guideVersion||guideRange<0||!guideUsage||!guideTier)return;const eligible=guideParts.filter(p=>p.enabled&&p.engineVersion===guideVersion&&p.rangeIndex===guideRange&&p.usage===guideUsage&&p.tier===guideTier&&p.productId!==null).map(p=>p.id);try{const raw=localStorage.getItem(guideSelectionKey);if(raw!==null){const saved:unknown=JSON.parse(raw);if(Array.isArray(saved)){setGuideCartSelection(eligible.filter(id=>saved.includes(id)));return}}}catch{}setGuideCartSelection(eligible)},[guideParts,guideVersion,guideRange,guideUsage,guideTier,guideSelectionKey]);
 const updateGuideSelection=(id:string,checked:boolean)=>{setGuideCartSelection(current=>{const next=checked?Array.from(new Set([...current,id])):current.filter(item=>item!==id);try{localStorage.setItem(guideSelectionKey,JSON.stringify(next))}catch{}return next})};
 const selectedGuideProducts=matchedGuideParts.filter(p=>guideCartSelection.includes(p.id)).map(p=>({part:p,product:products.find(item=>item.id===p.productId)})).filter((entry):entry is {part:GuidePart;product:Product}=>!!entry.product);
 const guideCartTotal=selectedGuideProducts.reduce((total,entry)=>total+entry.product.price,0);

 const [guideConfigOpen,setGuideConfigOpen]=useState(false);
 const [guideConfigValues,setGuideConfigValues]=useState<Record<string,string>>({});
 const [guideConfigError,setGuideConfigError]=useState('');
 useEffect(()=>{if(!guideConfigOpen)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setGuideConfigOpen(false)};window.addEventListener('keydown',onKey);return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',onKey)}},[guideConfigOpen]);
 const guideEligibleProducts=selectedGuideProducts.filter(({product})=>(product as Product&{stockStatus?:string}).stockStatus!=='unavailable');
 const guideNeedsConfig=(product:Product)=>!!product.configurable||!!product.optionGroups?.some(g=>g.required);
 const guideConfigItems=guideEligibleProducts.filter(({product})=>guideNeedsConfig(product));
 const guideConfigGroups=(product:Product)=>product.optionGroups??[];
 const guideConfigKey=(product:Product,groupId:string)=>product.id+':'+groupId;
 const guideConfigFlange=(product:Product)=>guideConfigGroups(product).find(g=>/flange|flansz/i.test(g.id+' '+g.name));
 const normalizedFlange=(value:string)=>{const match=value.toUpperCase().match(/(?:T3|T4|V[- ]?BAND|T25|T28)/);return match?match[0].replace(/[- ]/g,''):''};
 const confirmGuideCart=()=>{
  const lines:CartLine[]=[];
  for(const {product} of guideEligibleProducts){
   const groups=guideConfigGroups(product);
   const options:Record<string,string>={};
   let extra=0;
   for(const group of groups){
    const id=guideConfigValues[guideConfigKey(product,group.id)];
    const option=group.options.find(o=>o.id===id);
    if(group.required&&!option){setGuideConfigError('Uzupełnij wymagane opcje: '+product.name+' / '+group.name);return;}
    if(option){options[group.name]=option.label;extra+=option.price;}
   }
   if(product.configurable&&!groups.length){
    const flange=guideConfigValues[guideConfigKey(product,'legacy-flange')];
    const wastegate=guideConfigValues[guideConfigKey(product,'legacy-wastegate')];
    if(!flange||!wastegate){setGuideConfigError('Uzupełnij flanszę i wastegate: '+product.name);return;}
    options['Flansza']=flange;options['Wastegate']=wastegate;
    options['Silnik']=product.engine;
   }
   const key=product.id+'-'+JSON.stringify(options);
   lines.push({key,productId:product.id,qty:1,options:Object.keys(options).length?options:undefined,unitPrice:product.price+extra});
  }
  const flangeValues=guideEligibleProducts.map(({product})=>{const group=guideConfigFlange(product);const selected=group?.options.find(o=>o.id===guideConfigValues[guideConfigKey(product,group.id)]);return normalizedFlange(selected?.label??guideConfigValues[guideConfigKey(product,'legacy-flange')]??'')}).filter(Boolean);
  if(new Set(flangeValues).size>1){setGuideConfigError('Wybrane flansze nie są zgodne. Ustaw jednakowy typ mocowania dla turbo i kolektora.');return;}
  if(!lines.length){setGuideConfigError('Brak dostępnych produktów do dodania.');return;}
  setCart(old=>{let next=[...old];for(const line of lines){const existing=next.find(x=>x.key===line.key);next=existing?next.map(x=>x.key===line.key?{...x,qty:Math.min(50,x.qty+1)}:x):[...next,line]}return next});
  setGuideConfigOpen(false);setGuideConfigError('');
  navigate('cart');
  notify('Dodano skonfigurowany zestaw do koszyka.');
 };
 const addGuideProductsToCart=()=>{
  if(!guideEligibleProducts.length){notify('Brak dostępnych produktów do dodania.');return;}
  if(guideConfigItems.length){setGuideConfigValues({});setGuideConfigError('');setGuideConfigOpen(true);return;}
  setGuideConfigValues({});setGuideConfigError('');confirmGuideCart();
 };
 const [guideDiscount,setGuideDiscount]=useState(5);
 const [guideDataError,setGuideDataError]=useState(false);
 const exportGuidePdf=()=>{
  const chosen=guideParts.filter(p=>p.enabled&&p.engineVersion===guideVersion&&p.rangeIndex===guideRange&&p.usage===guideUsage&&p.tier===guideTier);
  if(!chosen.length)return;
  const popup=window.open('','rpmPowerGuidePreview','popup=yes,width=940,height=850,resizable=yes,scrollbars=yes');
  if(!popup){alert('Zezwól na otwieranie nowych okien, aby wygenerować PDF.');return;}
  const escapeHtml=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
  const engine=POWER_ENGINES.find(e=>e.id===guideEngine)?.versions.find(v=>v.id===guideVersion)?.name??guideVersion;
  const range=POWER_RANGES[guideRange];
  const categories=Array.from(new Set(chosen.map(p=>p.category)));
  const priced=chosen.map(p=>guidePrice(p,guideDiscount)).filter((v):v is number=>v!==null);
  const total=priced.reduce((sum,v)=>sum+v,0);
  const rows=categories.map(category=>'<section><h2>'+escapeHtml(category)+'</h2>'+chosen.filter(p=>p.category===category).map(p=>{
   const price=guidePrice(p,guideDiscount);const linked=products.find(x=>x.id===p.productId);
   return '<article><div class="part-title">'+escapeHtml(p.name)+'</div><div class="reason">'+escapeHtml(p.reason||'Opis techniczny w przygotowaniu.')+'</div><div class="prices"><span>Cena referencyjna FMIC: '+(p.fmicPrice===null?'Do wyceny':escapeHtml(money(p.fmicPrice)))+'</span><strong>Cena RPM Custom: '+(price===null?'Do wyceny':escapeHtml(money(price)))+'</strong></div>'+(linked?'<div class="linked">Produkt w sklepie RPM Custom: '+escapeHtml(linked.name)+' · '+escapeHtml(linked.sku)+' · '+escapeHtml(money(linked.price))+'</div>':'')+(p.fmicUrl?'<div class="link">FMIC: '+escapeHtml(p.fmicUrl)+'</div>':'')+'</article>';
  }).join('')+'</section>').join('');
  const date=new Intl.DateTimeFormat('pl-PL',{dateStyle:'long'}).format(new Date());
  const html='<!doctype html><html lang="pl"><head><meta charset="utf-8"/><title>RPM Custom - Power Guide - '+escapeHtml(engine)+'</title><style>@page{size:A4;margin:16mm 15mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#22232a;font-size:11px;line-height:1.5;margin:0;background:#e9e8ec}.pdf-page{width:210mm;max-width:calc(100% - 32px);min-height:297mm;margin:24px auto 40px;padding:16mm 15mm;background:#fff;box-shadow:0 12px 40px rgba(20,20,30,.18);overflow-wrap:anywhere}.pdf-page *{max-width:100%}.print-actions{max-width:210mm;margin:0 auto}header{position:relative;overflow:hidden;background:#1b1c25;color:#fff;padding:26px 27px 24px;margin-bottom:21px;border-radius:9px;-webkit-print-color-adjust:exact;print-color-adjust:exact}header:before{content:"";position:absolute;width:210px;height:210px;border:32px solid rgba(231,47,89,.18);border-radius:50%;right:-90px;top:-130px}header:after{content:"";position:absolute;left:27px;bottom:0;width:92px;height:5px;background:#e72f59}.brand{display:flex;align-items:center;gap:11px;font-weight:900;letter-spacing:2.3px;font-size:19px;color:#fff}.brand-icon{display:inline-grid;place-items:center;width:37px;height:37px;border:2px solid #e72f59;border-radius:8px;color:#ff5a82;font-size:24px;line-height:1}.subtitle{font-size:9px;letter-spacing:2px;color:#ff86a3;margin:8px 0 0}h1{font-size:26px;line-height:1.15;margin:17px 0 12px;letter-spacing:-.5px}.header-meta{display:flex;flex-wrap:wrap;gap:7px}.header-meta span{display:inline-block;border:1px solid #59505d;border-radius:5px;padding:4px 9px;color:#f3e8ed;font-size:9px}.intro{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:0 0 16px}.intro p{margin:0;color:#686875;max-width:410px}.intro .count{font-weight:800;color:#c5224d;white-space:nowrap}section{margin:19px 0 0}h2{font-size:14px;margin:0 0 8px;padding:0 0 8px;border-bottom:2px solid #e72f59;display:flex;justify-content:space-between;color:#20212b;break-after:avoid}article{padding:11px 13px;margin:7px 0;border:1px solid #e8e6ea;border-left:3px solid #e72f59;border-radius:5px;break-inside:avoid;background:#fff}.part-title{font-size:12px;font-weight:800;color:#22232a}.reason{color:#666672;margin:4px 0 8px;white-space:pre-wrap;font-size:10px}.prices{display:flex;flex-wrap:wrap;align-items:center;gap:5px 20px;padding-top:7px;border-top:1px solid #f0edf0;font-size:10px}.prices span{color:#75717a}.prices strong{color:#c5224d;font-size:11px}.linked{margin-top:7px;padding:6px 8px;background:#fff2f6;border-radius:4px;font-size:10px;color:#81324b;-webkit-print-color-adjust:exact;print-color-adjust:exact}.link{color:#777;font-size:9px;overflow-wrap:anywhere;margin-top:5px}.summary{padding:18px 19px;background:#1d1e28;color:#fff;border-radius:8px;margin:24px 0 15px;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}.summary .sum-label{font-size:10px;letter-spacing:1.2px;color:#f3b2c5;font-weight:800}.summary strong{display:block;font-size:25px;color:#fff;margin:4px 0}.summary .muted{color:#c9c4cb;font-size:10px}.notice{margin-top:15px;padding:12px 13px;border-radius:6px;background:#f7f6f8;font-size:9px;color:#66636c;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}footer{margin-top:18px;padding-top:11px;border-top:1px solid #dedde1;color:#777;font-size:9px;display:flex;justify-content:space-between;gap:12px} .print-actions{position:sticky;top:0;z-index:2;background:#20212a;color:#fff;padding:13px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-radius:7px}.print-actions button{background:#e72f59;color:#fff;border:0;padding:10px 18px;border-radius:6px;cursor:pointer;font-weight:800}@media(max-width:650px){.pdf-page{max-width:100%;margin:0;padding:18px;min-height:auto}.print-actions{border-radius:0;flex-wrap:wrap}}@media print{body{background:#fff}.print-actions{display:none!important}.pdf-page{width:auto;max-width:none;min-height:0;margin:0;padding:0;box-shadow:none;overflow:visible}header{border-radius:0}article{box-shadow:none}section{break-inside:auto}h2{break-after:avoid}}</style></head><body><div class="print-actions"><span>Gotowy raport RPM Custom · wybierz „Zapisz jako PDF” w oknie drukowania</span><button onclick="window.print()">Zapisz PDF / Drukuj</button></div><div class="pdf-page"><header><div class="brand"><span class="brand-icon">✦</span>RPM CUSTOM</div><div class="subtitle">POWER GUIDES / RAPORT KONFIGURACJI</div><h1>'+escapeHtml(engine)+'<br/>'+range.min+'–'+range.max+' KM</h1><div class="header-meta"><span>'+escapeHtml(guideUsage.toUpperCase())+'</span><span>'+escapeHtml(guideTier.toUpperCase())+'</span><span>'+escapeHtml(date)+'</span></div></header><div class="intro"><p>Indywidualne zestawienie rekomendowanych podzespołów dla wybranej konfiguracji.</p><span class="count">'+chosen.length+' POZYCJI / '+categories.length+' KATEGORII</span></div>'+rows+'<div class="summary"><div class="sum-label">PODSUMOWANIE ZESTAWU · '+priced.length+' Z '+chosen.length+' WYCENIONYCH</div><strong>'+escapeHtml(money(total))+'</strong>'+(priced.length!==chosen.length?'<div class="muted">Suma nie obejmuje '+(chosen.length-priced.length)+' pozycji wymagających indywidualnej wyceny.</div>':'<div class="muted">Suma cen rekomendowanych pozycji; nie obejmuje usług ani dostawy.</div>')+'</div><div class="notice"><strong>WAŻNE INFORMACJE</strong><br/>Ceny FMIC to wartości referencyjne zapisane w konfiguratorze. Ceny RPM Custom mogą uwzględniać rabat '+guideDiscount+'% lub indywidualną korektę. Ceny, dostępność i kompatybilność wymagają potwierdzenia. Zestaw nie gwarantuje osiągnięcia docelowej mocy — projekt wymaga weryfikacji technicznej i strojenia.</div><footer><span>RPM CUSTOM · PERFORMANCE PARTS</span><span>rpmcustom.pl · Dokument informacyjny, nie stanowi oferty handlowej.</span></footer></div></body></html>';
  popup.document.open();popup.document.write(html);popup.document.close();popup.focus();
 };

 useEffect(()=>{fetch('/api/power-guides',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('guides');return r.json()}).then(d=>{setGuideParts(d.parts);setGuideDiscount(d.discountPercent);setGuideDataError(false)}).catch(()=>setGuideDataError(true))},[]);

 const [inlineShopOpen,setInlineShopOpen]=useState(false);
 const [technicalFilters,setTechnicalFilters]=useState<Record<string,string>>({});
 const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
 useEffect(()=>{fetch('/api/catalog',{cache:'no-store'}).then(async response=>{if(response.ok){const data=await response.json();if(Array.isArray(data.products))setProducts(data.products)}}).catch(()=>{})},[]);
 const [chosenOptions,setChosenOptions]=useState<Record<string,string>>({});
 const [photoIndex,setPhotoIndex]=useState(0);
 const [lightbox,setLightbox]=useState(false);
 const [lang,setLang]=useState<'pl'|'en'>('pl');
 const t=(value:string)=>lang==='en'?(en[value]??value):value;
 const changeLang=(next:'pl'|'en')=>{setLang(next);localStorage.setItem('rpm-language',next);document.documentElement.lang=next;};
 useEffect(()=>{const saved=localStorage.getItem('rpm-language');if(saved==='en'||saved==='pl'){setLang(saved);document.documentElement.lang=saved}},[]);

 const [view,setView]=useState<View>('home'),[selected,setSelected]=useState<Product>(products[0]),[cart,setCart]=useState<CartLine[]>([]),[garage,setGarage]=useState<CartLine[]>([]),[query,setQuery]=useState(''),[category,setCategory]=useState('Wszystkie'),[engineFilter,setEngineFilter]=useState('Wszystkie'),[sort,setSort]=useState('featured'),[mobileMenu,setMobileMenu]=useState(false),[engine,setEngine]=useState(''),[flange,setFlange]=useState(''),[wg,setWg]=useState(''),[egt,setEgt]=useState(false),[qty,setQty]=useState(1),[toast,setToast]=useState(''),[checkoutDone,setCheckoutDone]=useState(false),[orderId,setOrderId]=useState(''),[orderError,setOrderError]=useState(''),[orderBusy,setOrderBusy]=useState(false);
 const [receipt,setReceipt]=useState<OrderReceipt|null>(null);
 const [checkoutType,setCheckoutType]=useState<'private'|'company'>('private');
 const [shippingMethod,setShippingMethod]=useState<ShippingMethod>('courier');
 const [shippingSettings,setShippingSettings]=useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
 const [shippingSettingsReady,setShippingSettingsReady]=useState(false);
 const [paymentSettings,setPaymentSettings]=useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
 const [paymentMethod,setPaymentMethod]=useState<PaymentMethod>('pay_on_pickup');
 useEffect(()=>{fetch('/api/settings',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('Settings unavailable');return r.json()}).then(d=>{setShippingSettings(d.shipping);setPaymentSettings(d.payments);setShippingMethod(m=>m==='courier'&&d.shipping.courierEnabled||m==='pickup'&&d.shipping.pickupEnabled?m:d.shipping.courierEnabled?'courier':'pickup');setShippingSettingsReady(true)}).catch(()=>setShippingSettingsReady(false))},[]);
 useEffect(()=>{const methods=availablePaymentMethods(paymentSettings,shippingMethod);if(!methods.includes(paymentMethod)&&methods.length)setPaymentMethod(methods[0])},[paymentSettings,shippingMethod,paymentMethod]);
 const [phonePrefix,setPhonePrefix]=useState('+48');
 const [phoneMenuOpen,setPhoneMenuOpen]=useState(false);
 const [companyName,setCompanyName]=useState('');
 const [companyNip,setCompanyNip]=useState('');
 const [companyAddress,setCompanyAddress]=useState('');
 const [deliveryAddress,setDeliveryAddress]=useState('');
 const [deliveryPostalCode,setDeliveryPostalCode]=useState('');
 const [deliveryCity,setDeliveryCity]=useState('');
 const [deliveryNotice,setDeliveryNotice]=useState('');
 const copyCompanyAddress=()=>{const result=parsePolishAddress(companyAddress);setDeliveryAddress(result.street);setDeliveryPostalCode(result.postalCode);setDeliveryCity(result.city);setDeliveryNotice(result.complete?'Adres dostawy uzupełniony. Sprawdź jego poprawność przed wysłaniem.':'Uzupełniono dostępne dane. Sprawdź i uzupełnij brakujące pola adresu.');};
 const [companyLookupBusy,setCompanyLookupBusy]=useState(false);
 const [companyLookupMessage,setCompanyLookupMessage]=useState('');
 const [companyLookupState,setCompanyLookupState]=useState<'success'|'error'|null>(null);
 const lookupCompany=async()=>{if(companyLookupBusy)return;setCompanyLookupBusy(true);setCompanyLookupMessage('');setCompanyLookupState(null);setCompanyAddress('');setDeliveryNotice('');try{const response=await fetch('/api/company?nip='+encodeURIComponent(companyNip.replace(/[^0-9]/g,'')),{cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Nie udało się pobrać danych firmy');setCompanyName(data.name||'');setCompanyAddress(data.address||'');setCompanyLookupMessage(data.source==='GUS + VAT'?t('Nazwa i adres z GUS/REGON, status VAT z wykazu VAT. Sprawdź poprawność danych.'):data.source==='GUS'?t('Dane firmy pobrane z GUS/REGON. Sprawdź ich poprawność.'):t('Dane firmy pobrane z wykazu VAT. Sprawdź ich poprawność.'));setCompanyLookupState('success');}catch(err){setCompanyLookupMessage(err instanceof Error?err.message:'Błąd pobierania danych. Wpisz je ręcznie.');setCompanyLookupState('error')}finally{setCompanyLookupBusy(false)}};
 const [storageReady,setStorageReady]=useState(false);
 useEffect(()=>{try{const raw=localStorage.getItem('rpm-power-guide-form-v1');if(!raw)return;const saved=JSON.parse(raw) as Record<string,unknown>;if(typeof saved.engine==='string'&&POWER_ENGINES.some(e=>e.id===saved.engine))setGuideEngine(saved.engine);if(typeof saved.version==='string'&&POWER_ENGINES.some(e=>e.versions.some(v=>v.id===saved.version)))setGuideVersion(saved.version);if(typeof saved.range==='number'&&Number.isInteger(saved.range)&&saved.range>=-1&&saved.range<POWER_RANGES.length)setGuideRange(saved.range);if(saved.usage==='street'||saved.usage==='drift'||saved.usage==='track')setGuideUsage(saved.usage);if(saved.tier==='budget'||saved.tier==='recommended'||saved.tier==='premium')setGuideTier(saved.tier);if(Array.isArray(saved.openCategories))setGuideOpenCategories(saved.openCategories.filter((v:unknown):v is string=>typeof v==='string'))}catch{}},[]);
 useEffect(()=>{if(!storageReady)return;try{localStorage.setItem('rpm-power-guide-form-v1',JSON.stringify({engine:guideEngine,version:guideVersion,range:guideRange,usage:guideUsage,tier:guideTier,openCategories:guideOpenCategories}))}catch{}},[storageReady,guideEngine,guideVersion,guideRange,guideUsage,guideTier,guideOpenCategories]);
 useEffect(()=>{try{const c=localStorage.getItem('rpm-cart');const g=localStorage.getItem('rpm-garage');if(c){const parsed=JSON.parse(c);if(Array.isArray(parsed))setCart(parsed)}if(g){const parsed=JSON.parse(g);if(Array.isArray(parsed))setGarage(parsed)}const savedView=sessionStorage.getItem('rpm-shop-view');if(savedView&&['home','catalog','product','cart','checkout','garage','guides'].includes(savedView))setView(savedView as View)}catch{}finally{setStorageReady(true)}},[]);
 useEffect(()=>{if(storageReady)localStorage.setItem('rpm-cart',JSON.stringify(cart))},[cart,storageReady]);
 useEffect(()=>{if(storageReady)localStorage.setItem('rpm-garage',JSON.stringify(garage))},[garage,storageReady]);
 useEffect(()=>{if(storageReady)sessionStorage.setItem('rpm-shop-view',view)},[view,storageReady]);
 const notify=(t:string)=>{setToast(t);window.setTimeout(()=>setToast(''),3200)};
 const resetGuide=()=>{setGuideEngine('');setGuideVersion('');setGuideRange(-1);setGuideUsage('');setGuideTier('');setGuideOpenCategories([]);setGuideCartSelection([]);setGuideConfigOpen(false);setGuideConfigValues({});setGuideConfigError('');try{localStorage.removeItem('rpm-power-guide-form-v1');for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key?.startsWith('rpm-power-guide-selection-v1:'))localStorage.removeItem(key)}}catch{}};
 const navigate=(v:View)=>{if(view==='guides'&&v!=='guides')resetGuide();setView(v);setMobileMenu(false);setFmicMenuOpen(false);if(typeof window!=='undefined'){const path=v==='home'?'/':v==='catalog'?'/sklep':v==='guides'?'/power-guides':v==='cart'?'/koszyk':v==='garage'?'/garage':null;if(path&&window.location.pathname!==path)window.history.pushState({},'',path)}window.scrollTo({top:0,behavior:'smooth'})};
 const openCatalogPath=(names:string[])=>{setShopSubcategory(null);setEngineFilter('Wszystkie');setSort('featured');setShopLanding(false);setCategory('Wszystkie');setQuery(names.length?names[names.length-1]:'');setView('catalog');setMobileMenu(false);setActiveFmicRoot(null);setActiveFmicSub(null);setFmicMenuOpen(false);const path=categoryPath(names);if(window.location.pathname!==path)window.history.pushState({},'',path);window.scrollTo({top:0,behavior:'smooth'})};
 useEffect(()=>{const sync=()=>{const names=resolveCategoryPath(window.location.pathname);if(names!==null){setCategory('Wszystkie');setQuery(names.at(-1)??'');setShopSubcategory(null);setView('catalog')}else if(window.location.pathname==='/power-guides')setView('guides');else if(window.location.pathname==='/koszyk')setView('cart');else if(window.location.pathname==='/garage')setView('garage');else if(window.location.pathname==='/')setView('home')};sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[]);
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('power-guides')==='1')setView('guides')},[]);
 useEffect(()=>{const id=Number(new URLSearchParams(window.location.search).get('product'));if(!Number.isSafeInteger(id)||id<=0)return;const found=products.find(p=>p.id===id);if(found){setSelected(found);setChosenOptions({});setPhotoIndex(0);setView('product');}},[products]);
 const openProduct=(p:Product)=>{setSelected(p);setChosenOptions({});setPhotoIndex(0);setLightbox(false);setEngine('');setFlange('');setWg('');setEgt(false);setQty(1);navigate('product')};
 const customGroups=(selected.optionGroups??[]).filter(g=>!(selected.optionGroups??[]).some(f=>f.id==='rpm-flange')||g.id!=='rpm-wastegate');
 const rpmFlange=chosenOptions['rpm-flange'];
 const automaticWg=rpmFlange?(rpmFlange.endsWith('-twin')?'2× WG':'1× WG'):'';
 const usesCustom=customGroups.length>0;
 const customReady=customGroups.every(g=>!g.required||!!chosenOptions[g.id]);
 const customExtra=customGroups.reduce((sum,g)=>sum+(g.options.find(o=>o.id===chosenOptions[g.id])?.price??0),0);
 const selectedPrice=selected.price+customExtra;
 const unitPrice=usesCustom?selectedPrice:selected.price;
 const totalPrice=Math.round(unitPrice*qty*100)/100;
 const canAdd=usesCustom?customReady:!selected.configurable||((selected.id!==1||!!engine)&&!!flange&&!!wg);
 const linesTotal=(lines:CartLine[])=>lines.reduce((sum,l)=>sum+(l.unitPrice??products.find(p=>p.id===l.productId)?.price??0)*l.qty,0);
 const count=cart.reduce((s,l)=>s+l.qty,0);
 const addLine=(target:'cart'|'garage')=>{if(!canAdd){notify('Wybierz wymagane opcje kolektora');return}const options:Record<string,string>|undefined=usesCustom?{...Object.fromEntries(customGroups.filter(g=>chosenOptions[g.id]).map(g=>[g.name,g.options.find(o=>o.id===chosenOptions[g.id])?.label??''])),...(automaticWg?{Wastegate:automaticWg}:{})}:selected.configurable?{Silnik:selected.id===1?engine:selected.engine,Flansza:flange,Wastegate:wg,EGT:egt?'Tak':'Nie'}:undefined;const key=selected.id+'-'+JSON.stringify(options||{});const line:CartLine={key,productId:selected.id,qty,options,unitPrice:usesCustom?selectedPrice:selected.price};const update=(old:CartLine[])=>{const existing=old.find(l=>l.key===key);return existing?old.map(l=>l.key===key?{...l,qty:l.qty+qty}:l):[...old,line]};if(target==='cart')setCart(update);else setGarage(update);notify(target==='cart'?'Dodano do koszyka DEMO':'Zapisano w RPM Garage Lite')};
 const [activeFmicRoot,setActiveFmicRoot]=useState<number|null>(null);
 const [compactCategories,setCompactCategories]=useState(true);
 useEffect(()=>{
  let frame=0;
  const measure=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    const nav=document.querySelector<HTMLElement>('.rpm-desktop-categories');
    if(!nav)return;
    const required=Array.from(nav.children).reduce((sum,child)=>sum+(child as HTMLElement).offsetWidth,0);
    const available=document.documentElement.clientWidth-24;
    setCompactCategories(required>available);
   });
  };
  measure();
  window.addEventListener('resize',measure);
  document.fonts?.ready.then(measure);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',measure)};
 },[]);
 useEffect(()=>{setMobileMenu(false);setActiveFmicRoot(null);setActiveFmicSub(null)},[compactCategories]);
 const [fmicMenuOpen,setFmicMenuOpen]=useState(false);
 const [activeFmicSub,setActiveFmicSub]=useState<number|null>(null);
 const openShopCategory=(name:string)=>{setInlineShopOpen(false);setShopSubcategory(null);setCategory(name);setEngineFilter('Wszystkie');setQuery('');setSort('featured');setShopLanding(false);navigate('catalog')};
 const openDepartmentSubcategory=(sub:ShopSubcategory)=>{if(!sub.catalogCategory)return;setShopSubcategory(sub);setCategory(sub.catalogCategory);setEngineFilter('Wszystkie');setQuery('');setSort('featured');setShopLanding(false);setInlineShopOpen(false);requestAnimationFrame(()=>document.getElementById('rpm-inline-catalog')?.scrollIntoView({behavior:'smooth',block:'start'}))};
 const categoryLabel=(name:string)=>lang==='en'?({'Wszystkie':'All products','Kolektory':'Turbo manifolds','Turbo':'Turbochargers','Intercoolery':'Intercoolers','Wastegate':'Wastegates','Osprzęt':'Fittings & hardware','Elektronika':'Electronics','Paliwo':'Fuel system'}[name]??name):name;
 const categoryIcon=(name:string)=>({'Kolektory':'⚙','Turbo':'◉','Intercoolery':'▤','Wastegate':'◇','Osprzęt':'⬡','Elektronika':'⌁','Paliwo':'◈'}[name]??'✦');
 const catalogCategories=useMemo(()=>['Wszystkie',...Array.from(new Set(products.map(p=>p.category).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pl'))],[products]);
 const activeCategoryProducts=useMemo(()=>products.filter(p=>(category==='Wszystkie'||p.category===category)&&(!shopSubcategory?.keywords?.length||shopSubcategory.keywords.some(k=>[p.name,p.description??'',p.sku].join(' ').toLocaleLowerCase('pl').includes(k.toLocaleLowerCase('pl'))))),[products,category,shopSubcategory]);
 const technicalFilterOptions=useMemo(()=>buildCatalogFilters(activeCategoryProducts,category),[activeCategoryProducts,category]);
 useEffect(()=>setTechnicalFilters({}),[category,shopSubcategory]);
 const catalogEngines=useMemo(()=>['Wszystkie',...Array.from(new Set(products.filter(p=>category==='Wszystkie'||p.category===category).map(p=>p.engine).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pl'))],[products,category]);
 useEffect(()=>{if(!catalogEngines.includes(engineFilter))setEngineFilter('Wszystkie')},[catalogEngines,engineFilter]);
 const filtered=useMemo(()=>{const needle=query.trim().toLocaleLowerCase('pl');let p=products.filter(p=>(category==='Wszystkie'||p.category===category)&&(!shopSubcategory?.keywords?.length||shopSubcategory.keywords.some(k=>[p.name,p.description??'',p.sku].join(' ').toLocaleLowerCase('pl').includes(k.toLocaleLowerCase('pl'))))&&(engineFilter==='Wszystkie'||p.engine===engineFilter)&&matchesCatalogAttributes(p,technicalFilters)&&`${p.name} ${p.brand} ${p.sku} ${p.engine} ${p.description??''}`.toLocaleLowerCase('pl').includes(needle));if(sort==='priceAsc')p=[...p].sort((a,b)=>a.price-b.price);if(sort==='priceDesc')p=[...p].sort((a,b)=>b.price-a.price);return p},[products,query,category,engineFilter,sort,shopSubcategory,technicalFilters]);
 const card=(p:Product)=><ProductCard key={p.id} product={p} onOpen={openProduct} translate={t}/>;
 const cartList=(lines:CartLine[],editable:boolean)=><CartLineList lines={lines} editable={editable} products={products} onOpen={openProduct} onQuantityChange={(key,delta)=>setCart(old=>old.map(x=>x.key===key?{...x,qty:Math.max(1,Math.min(50,x.qty+delta))}:x))} onRemove={(key)=>setCart(old=>old.filter(x=>x.key!==key))}/>;
 const handleCheckoutSubmit=async (e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(orderBusy||!shippingSettingsReady)return;setOrderBusy(true);setOrderError('');try{const data=new FormData(e.currentTarget);const customer={type:String(data.get('type')??'private'),name:String(data.get('name')??''),email:String(data.get('email')??''),phone:phonePrefix+' '+String(data.get('phone')??'').trim(),company:String(data.get('company')??''),nip:String(data.get('nip')??''),city:String(data.get('city')??''),postalCode:String(data.get('postalCode')??''),address:String(data.get('address')??''),notes:String(data.get('notes')??'')};const payload=JSON.stringify({customer,language:lang,shippingMethod,paymentMethod,lines:cart.map(l=>({productId:l.productId,qty:l.qty,options:l.options}))});const requestKey=await checkoutRequestKey(payload);const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestKey},body:payload});const result=await response.json();if(!response.ok)throw Error(result.error??t('Błąd zapisu zamówienia'));clearCheckoutRequestKey();setOrderId(String(result.orderId));setReceipt(result);setCheckoutDone(true);setCart([])}catch(err){setOrderError(err instanceof Error?err.message:t('Nie udało się wysłać zgłoszenia'))}finally{setOrderBusy(false)}};
 return <>{lightbox&&selected.images?.length&&<div className="rpm-lightbox" role="dialog" aria-modal="true" aria-label="Podgląd zdjęcia produktu" onClick={()=>setLightbox(false)}><button className="lightbox-close" onClick={()=>setLightbox(false)} aria-label="Zamknij"><X size={25}/></button><img src={selected.images[photoIndex]??selected.images[0]} alt={selected.name} onClick={e=>e.stopPropagation()}/>{selected.images.length>1&&<div className="lightbox-nav" onClick={e=>e.stopPropagation()}><button onClick={()=>setPhotoIndex(i=>(i-1+selected.images!.length)%selected.images!.length)} aria-label="Poprzednie"><ChevronLeft/></button><span>{photoIndex+1} / {selected.images.length}</span><button onClick={()=>setPhotoIndex(i=>(i+1)%selected.images!.length)} aria-label="Następne"><ChevronRight/></button></div>}</div>}<StorefrontHeader
 compactCategories={compactCategories} lang={lang} query={query} count={count}
 onQuery={setQuery} onHome={()=>navigate('home')}
 onSearchSubmit={()=>{setShopLanding(false);setCategory('Wszystkie');setShopSubcategory(null);setEngineFilter('Wszystkie');navigate('catalog')}}
 onLanguageChange={changeLang} onGarage={()=>navigate('garage')} onCart={()=>navigate('cart')}
 mobileMenu={mobileMenu} setMobileMenu={setMobileMenu}
 activeFmicRoot={activeFmicRoot} setActiveFmicRoot={setActiveFmicRoot}
 activeFmicSub={activeFmicSub} setActiveFmicSub={setActiveFmicSub}
 onOpenCatalogPath={openCatalogPath}
 onMotoLab={()=>{navigate('home');setTimeout(()=>document.getElementById('rpm-motolab')?.scrollIntoView({behavior:'smooth',block:'start'}),100)}}
/>

 {view==='home'&&inlineEditRequested&&<InlineHomepageEditor onChange={updateHomepageDraft}/>}
 {view==='home'&&<HomeSections
    homepageDraft={homepageDraft}
    lang={lang}
    products={products}
    onCategory={(name)=>{setCategory(name);navigate('catalog')}}
    onSelectGuideEngine={(engineId)=>{setGuideEngine(engineId);navigate('guides')}}
    onOpenGuides={()=>navigate('guides')}
    onOpenGarage={()=>navigate('garage')}
    onOpenProduct={openProduct}
    translate={t}
 />}
 {view==='guides'&&<PowerGuidesView
 products={products}
 guideEngine={guideEngine} setGuideEngine={setGuideEngine}
 guideVersion={guideVersion} setGuideVersion={setGuideVersion}
 guideRange={guideRange} setGuideRange={setGuideRange}
 guideUsage={guideUsage} setGuideUsage={setGuideUsage}
 guideTier={guideTier} setGuideTier={setGuideTier}
 guideParts={guideParts} matchedGuideParts={matchedGuideParts}
 guideOpenCategories={guideOpenCategories} setGuideOpenCategories={setGuideOpenCategories}
 guideDiscount={guideDiscount} guideCartSelection={guideCartSelection}
 updateGuideSelection={updateGuideSelection}
 selectedGuideProducts={selectedGuideProducts} guideCartTotal={guideCartTotal}
 guideEligibleProducts={guideEligibleProducts} addGuideProductsToCart={addGuideProductsToCart}
 guideConfigOpen={guideConfigOpen} storageReady={storageReady} setGuideConfigOpen={setGuideConfigOpen}
 guideConfigItems={guideConfigItems} guideConfigGroups={guideConfigGroups}
 guideConfigKey={guideConfigKey} guideConfigValues={guideConfigValues}
 setGuideConfigValues={setGuideConfigValues} guideConfigError={guideConfigError}
 setGuideConfigError={setGuideConfigError} confirmGuideCart={confirmGuideCart}
 guideDataError={guideDataError} exportGuidePdf={exportGuidePdf}
 onBackHome={()=>navigate('home')} onOpenProduct={openProduct}
/>}
 {view==='catalog'&&<CatalogView
 lang={lang} translate={t} shopSubcategory={shopSubcategory}
 mobileFiltersOpen={mobileFiltersOpen} query={query} category={category}
 engineFilter={engineFilter} technicalFilters={technicalFilters} sort={sort}
 catalogCategories={catalogCategories} catalogEngines={catalogEngines}
 technicalFilterOptions={technicalFilterOptions} filtered={filtered}
 onShowCategories={()=>{setMobileMenu(true);setActiveFmicRoot(0)}}
 onToggleMobileFilters={()=>setMobileFiltersOpen(v=>!v)}
 onQuery={setQuery}
 onCategory={(value)=>{setShopSubcategory(null);setCategory(value);setEngineFilter('Wszystkie')}}
 onEngine={setEngineFilter}
 onTechnicalFilter={(key,value)=>setTechnicalFilters(old=>({...old,[key]:value}))}
 onClearTechnicalFilters={()=>setTechnicalFilters({})}
 onResetFilters={()=>{setTechnicalFilters({});setShopSubcategory(null);setQuery('');setCategory('Wszystkie');setEngineFilter('Wszystkie');setSort('featured')}}
 onSort={setSort} onOpenProduct={openProduct}
 />}
 {view==='product'&&<ProductDetailView
 selected={selected} lang={lang} t={t}
 photoIndex={photoIndex} onPhotoIndex={setPhotoIndex} onZoom={()=>setLightbox(true)}
 onBack={()=>navigate('catalog')}
 usesCustom={usesCustom} customGroups={customGroups} chosenOptions={chosenOptions}
 automaticWg={automaticWg} customExtra={customExtra} selectedPrice={selectedPrice}
 unitPrice={unitPrice} totalPrice={totalPrice} qty={qty} canAdd={canAdd}
 engine={engine} flange={flange} wg={wg} egt={egt}
 onOption={(groupId,value)=>setChosenOptions(old=>({...old,[groupId]:value}))}
 onEngine={setEngine} onFlange={setFlange} onWg={setWg} onEgt={setEgt}
 onQuantity={setQty} onAddToCart={()=>addLine('cart')} onAddToGarage={()=>addLine('garage')}
/>}
 {view==='cart'&&<CartView
 cart={cart} products={products} count={count} total={linesTotal(cart)} t={t}
 onBrowseCatalog={()=>navigate('catalog')} onCheckout={()=>navigate('checkout')}
 onOpenProduct={openProduct}
 onQuantityChange={(key,delta)=>setCart(old=>old.map(x=>x.key===key?{...x,qty:Math.max(1,Math.min(50,x.qty+delta))}:x))}
 onRemove={key=>setCart(old=>old.filter(x=>x.key!==key))}
/>}
 {view==='checkout'&&<CheckoutView
  t={t} lang={lang}
  cart={cart} products={products} cartTotal={linesTotal(cart)}
  checkoutDone={checkoutDone} receipt={receipt}
  onBackToCart={()=>navigate('cart')}
  onBackToStore={()=>{setCheckoutDone(false);setReceipt(null);setCart([]);navigate('home')}}
  onSubmit={handleCheckoutSubmit}
  checkoutType={checkoutType} setCheckoutType={setCheckoutType}
  companyNip={companyNip} setCompanyNip={setCompanyNip}
  companyName={companyName} setCompanyName={setCompanyName}
  companyAddress={companyAddress} setCompanyAddress={setCompanyAddress}
  companyLookupMessage={companyLookupMessage} setCompanyLookupMessage={setCompanyLookupMessage}
  companyLookupState={companyLookupState} setCompanyLookupState={setCompanyLookupState}
  companyLookupBusy={companyLookupBusy} lookupCompany={lookupCompany}
  copyCompanyAddress={copyCompanyAddress}
  phonePrefix={phonePrefix} setPhonePrefix={setPhonePrefix}
  phoneMenuOpen={phoneMenuOpen} setPhoneMenuOpen={setPhoneMenuOpen}
  deliveryNotice={deliveryNotice} deliveryAddress={deliveryAddress} setDeliveryAddress={setDeliveryAddress}
  deliveryPostalCode={deliveryPostalCode} setDeliveryPostalCode={setDeliveryPostalCode}
  deliveryCity={deliveryCity} setDeliveryCity={setDeliveryCity}
  shippingMethod={shippingMethod} setShippingMethod={setShippingMethod}
  shippingSettings={shippingSettings} shippingSettingsReady={shippingSettingsReady}
  paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} paymentSettings={paymentSettings}
  orderBusy={orderBusy} orderError={orderError}
/>}
 {view==='garage'&&<main className="page narrow"><div className="page-heading"><span className="eyebrow">RPM CUSTOM / PROJECT SPACE</span><h1>RPM GARAGE <em>LITE</em></h1><p>{t("Zapisane części w tej przeglądarce. Lista prac, wyceny i konta użytkowników pojawią się w kolejnych wersjach.")}</p></div>{garage.length?<>{cartList(garage,false)}<div className="summary"><span>{t("Wartość zapisanych części DEMO")}</span><strong>{money(linesTotal(garage))}</strong><button className="outline" onClick={()=>{setGarage([]);notify('Wyczyszczono Garage Lite')}}>{t("Wyczyść Garage")}</button></div></>:<div className="empty"><Warehouse size={48}/><h2>{t("Twój garaż jest pusty")}</h2><p>{t("Otwórz kartę produktu i wybierz „Zapisz w RPM Garage Lite”.")}</p><button className="primary" onClick={()=>navigate('catalog')}>{t("Przejdź do sklepu")}</button></div>}</main>}
 <footer className="footer"><div><strong>RPM<span>CUSTOM</span></strong><p>PERFORMANCE PARTS & ENGINEERING</p></div><div><p>{t("DEMO v0.1 · Produkty, ceny, stany i specyfikacje są fikcyjne lub poglądowe.")}</p><p>{t("Bez prawdziwych zamówień, płatności i logowania.")}</p></div></footer>{toast&&<div className="rpm-toast-overlay" role="status" aria-live="polite"><div className="rpm-toast-card"><div className="rpm-toast-icon"><Check size={30}/></div><strong>{toast==='Dodano do koszyka DEMO'?'Produkt dodany do koszyka!':toast}</strong><span>{toast==='Dodano do koszyka DEMO'?'Możesz kontynuować zakupy lub przejść do koszyka.':'Operacja zakończona pomyślnie.'}</span>{toast==='Dodano do koszyka DEMO'&&<button type="button" className="primary" onClick={()=>{setToast('');navigate('cart')}}><ShoppingCart size={18}/> Przejdź do koszyka</button>}<button type="button" className="rpm-toast-close" onClick={()=>setToast('')} aria-label="Zamknij komunikat"><X size={20}/></button></div></div>}</>}
