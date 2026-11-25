'use client';
import ProductCard from './components/storefront/ProductCard';
import CartLineList from './components/storefront/CartLineList';
import HomeSections from './components/storefront/HomeSections';
import CatalogView from './components/storefront/CatalogView';
import FmicPreview from './components/storefront/FmicPreview';
import ProductDetailView from './components/storefront/ProductDetailView';
import CartView from './components/storefront/CartView';
import CheckoutView from './components/storefront/CheckoutView';
import PowerGuidesView from './components/storefront/PowerGuidesView';
import StorefrontHeader from './components/storefront/StorefrontHeader';
import type {OrderReceipt} from './components/storefront/CheckoutView';
import type {FormEvent} from 'react';
import {checkoutRequestKey,clearCheckoutRequestKey} from './lib/checkout-idempotency';
import {useStorefrontLanguage} from './components/storefront/hooks/useStorefrontLanguage';
import {FMIC_CATEGORY_DESCRIPTIONS,FMIC_CATEGORY_ICONS,POWER_ENGINES,POWER_RANGES,categories,phonePrefixes} from './lib/storefront-config';
import type {View} from './lib/storefront-config';
import {useShopCollections} from './components/storefront/hooks/useShopCollections';
import {useProductConfiguration} from './components/storefront/hooks/useProductConfiguration';
import {useCheckoutDetails} from './components/storefront/hooks/useCheckoutDetails';
import {useEffect,useMemo,useState} from 'react';
import InlineHomepageEditor from './inline-homepage-editor';
import {createPortal} from 'react-dom';
import {ShoppingCart,Search,Menu,X,UserRound,ChevronRight,Plus,Minus,Trash2,Warehouse,Settings2,Wrench,Check,ArrowRight,Package,ShieldAlert,ZoomIn,ChevronLeft,FileDown,Wind,Droplets,Fuel,Flame,Disc,GitBranch,Gauge,Cpu,Armchair,Sparkles,Boxes} from 'lucide-react';
import {products as demoProducts,money,Product,CartLine} from './data';
import {SHOP_DEPARTMENTS,ShopSubcategory} from './shop-departments';
import {FMIC_CATEGORY_TREE} from './fmic-categories';
import {useHomepagePreview} from './components/storefront/hooks/useHomepagePreview';
import {categoryPath,resolveCategoryPath} from './category-routing';
import {GuidePart,guidePrice} from './lib/power-guides';
import {openPowerGuidePdf} from './lib/power-guide-pdf';
import {buildCatalogFilters,matchesCatalogAttributes} from './lib/catalog-filters';
export default function Shop(){
 const [globalFmicQuery,setGlobalFmicQuery]=useState('');
 const fmicPreview=true;const [fmicPath,setFmicPath]=useState('');
 useEffect(()=>{setFmicPath(window.location.pathname);setGlobalFmicQuery(new URLSearchParams(window.location.search).get('q')??'');const sync=()=>{setFmicPath(window.location.pathname);setGlobalFmicQuery(new URLSearchParams(window.location.search).get('q')??'')};window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[]);
 const {homepageDraft,inlineEditRequested,updateHomepageDraft}=useHomepagePreview();
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
 const exportGuidePdf=()=>openPowerGuidePdf({guideParts,guideVersion,guideRange,guideUsage,guideTier,guideEngine,guideDiscount,products});

 useEffect(()=>{fetch('/api/power-guides',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('guides');return r.json()}).then(d=>{setGuideParts(d.parts);setGuideDiscount(d.discountPercent);setGuideDataError(false)}).catch(()=>setGuideDataError(true))},[]);

 const [inlineShopOpen,setInlineShopOpen]=useState(false);
 const [technicalFilters,setTechnicalFilters]=useState<Record<string,string>>({});
 const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
 useEffect(()=>{fetch('/api/catalog',{cache:'no-store'}).then(async response=>{if(response.ok){const data=await response.json();if(Array.isArray(data.products))setProducts(data.products)}}).catch(()=>{})},[]);
 const {lang,t,changeLang}=useStorefrontLanguage();
 const {selected,setSelected,chosenOptions,setChosenOptions,photoIndex,setPhotoIndex,lightbox,setLightbox,engine,setEngine,flange,setFlange,wg,setWg,egt,setEgt,qty,setQty,customGroups,automaticWg,usesCustom,customExtra,selectedPrice,unitPrice,totalPrice,canAdd,resetProduct,buildLine}=useProductConfiguration(products[0]);

 const [view,setView]=useState<View>('home'),[query,setQuery]=useState(''),[category,setCategory]=useState('Wszystkie'),[engineFilter,setEngineFilter]=useState('Wszystkie'),[sort,setSort]=useState('featured'),[mobileMenu,setMobileMenu]=useState(false),[toast,setToast]=useState(''),[checkoutDone,setCheckoutDone]=useState(false),[orderId,setOrderId]=useState(''),[orderError,setOrderError]=useState(''),[orderBusy,setOrderBusy]=useState(false);
 const [receipt,setReceipt]=useState<OrderReceipt|null>(null);
 const {checkoutType,setCheckoutType,shippingMethod,setShippingMethod,shippingSettings,shippingSettingsReady,paymentSettings,paymentMethod,setPaymentMethod,phonePrefix,setPhonePrefix,phoneMenuOpen,setPhoneMenuOpen,companyName,setCompanyName,companyNip,setCompanyNip,companyAddress,setCompanyAddress,deliveryAddress,setDeliveryAddress,deliveryPostalCode,setDeliveryPostalCode,deliveryCity,setDeliveryCity,deliveryNotice,companyLookupBusy,companyLookupMessage,setCompanyLookupMessage,companyLookupState,setCompanyLookupState,copyCompanyAddress,lookupCompany}=useCheckoutDetails(t);
 const {cart,setCart,garage,setGarage,storageReady,linesTotal,count,changeQuantity,removeLine,addSavedLine}=useShopCollections(products,view,setView);
 useEffect(()=>{try{const raw=localStorage.getItem('rpm-power-guide-form-v1');if(!raw)return;const saved=JSON.parse(raw) as Record<string,unknown>;if(typeof saved.engine==='string'&&POWER_ENGINES.some(e=>e.id===saved.engine))setGuideEngine(saved.engine);if(typeof saved.version==='string'&&POWER_ENGINES.some(e=>e.versions.some(v=>v.id===saved.version)))setGuideVersion(saved.version);if(typeof saved.range==='number'&&Number.isInteger(saved.range)&&saved.range>=-1&&saved.range<POWER_RANGES.length)setGuideRange(saved.range);if(saved.usage==='street'||saved.usage==='drift'||saved.usage==='track')setGuideUsage(saved.usage);if(saved.tier==='budget'||saved.tier==='recommended'||saved.tier==='premium')setGuideTier(saved.tier);if(Array.isArray(saved.openCategories))setGuideOpenCategories(saved.openCategories.filter((v:unknown):v is string=>typeof v==='string'))}catch{}},[]);
 useEffect(()=>{if(!storageReady)return;try{localStorage.setItem('rpm-power-guide-form-v1',JSON.stringify({engine:guideEngine,version:guideVersion,range:guideRange,usage:guideUsage,tier:guideTier,openCategories:guideOpenCategories}))}catch{}},[storageReady,guideEngine,guideVersion,guideRange,guideUsage,guideTier,guideOpenCategories]);
 const notify=(t:string)=>{setToast(t);window.setTimeout(()=>setToast(''),3200)};
 const resetGuide=()=>{setGuideEngine('');setGuideVersion('');setGuideRange(-1);setGuideUsage('');setGuideTier('');setGuideOpenCategories([]);setGuideCartSelection([]);setGuideConfigOpen(false);setGuideConfigValues({});setGuideConfigError('');try{localStorage.removeItem('rpm-power-guide-form-v1');for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key?.startsWith('rpm-power-guide-selection-v1:'))localStorage.removeItem(key)}}catch{}};
 const resetSearch=()=>{setQuery('');setGlobalFmicQuery('')};
  const navigate=(v:View)=>{if(v!=='product')resetSearch();if(view==='guides'&&v!=='guides')resetGuide();setView(v);setMobileMenu(false);setFmicMenuOpen(false);if(typeof window!=='undefined'){const path=v==='home'?'/':v==='catalog'?'/sklep':v==='guides'?'/power-guides':v==='cart'?'/koszyk':v==='garage'?'/garage':null;if(path){setFmicPath(path);if(window.location.pathname!==path||window.location.search)window.history.pushState({},'',path)}}window.scrollTo({top:0,behavior:'smooth'})};
 const openCatalogPath=(names:string[])=>{setGlobalFmicQuery('');setShopSubcategory(null);setEngineFilter('Wszystkie');setSort('featured');setShopLanding(false);setCategory('Wszystkie');setQuery(fmicPreview?'':(names.at(-1)??''));setView('catalog');setMobileMenu(false);setActiveFmicRoot(null);setActiveFmicSub(null);setFmicMenuOpen(false);const path=categoryPath(names);setFmicPath(path);if(window.location.pathname!==path||window.location.search)window.history.pushState({},'',path);window.scrollTo({top:0,behavior:'smooth'})};
 useEffect(()=>{const sync=()=>{const names=resolveCategoryPath(window.location.pathname);if(names===null){setQuery('');setGlobalFmicQuery('')}if(names!==null){setCategory('Wszystkie');const params=new URLSearchParams(window.location.search);setQuery(params.get('q')??'');setShopSubcategory(null);setView('catalog')}else if(window.location.pathname==='/power-guides')setView('guides');else if(window.location.pathname==='/koszyk')setView('cart');else if(window.location.pathname==='/garage')setView('garage');else if(window.location.pathname==='/')setView('home')};sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[]);
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('power-guides')==='1')setView('guides')},[]);
 useEffect(()=>{const id=Number(new URLSearchParams(window.location.search).get('product'));if(!Number.isSafeInteger(id)||id<=0)return;const found=products.find(p=>p.id===id);if(found){setSelected(found);setChosenOptions({});setPhotoIndex(0);setView('product');}},[products]);
 const openProduct=(p:Product)=>{resetProduct(p);navigate('product')};
 const addLine=(target:'cart'|'garage')=>{const line=buildLine();if(!line){notify('Wybierz wymagane opcje kolektora');return}addSavedLine(target,line);notify(target==='cart'?'Dodano do koszyka DEMO':'Zapisano w RPM Garage Lite')};
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
 },[view]);
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
 const cartList=(lines:CartLine[],editable:boolean)=><CartLineList lines={lines} editable={editable} products={products} onOpen={openProduct} onQuantityChange={changeQuantity} onRemove={removeLine}/>;
 const handleCheckoutSubmit=async (e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(orderBusy||!shippingSettingsReady)return;setOrderBusy(true);setOrderError('');try{const data=new FormData(e.currentTarget);const customer={type:String(data.get('type')??'private'),name:String(data.get('name')??''),email:String(data.get('email')??''),phone:phonePrefix+' '+String(data.get('phone')??'').trim(),company:String(data.get('company')??''),nip:String(data.get('nip')??''),city:String(data.get('city')??''),postalCode:String(data.get('postalCode')??''),address:String(data.get('address')??''),notes:String(data.get('notes')??'')};const payload=JSON.stringify({customer,language:lang,shippingMethod,paymentMethod,lines:cart.map(l=>({productId:l.productId,qty:l.qty,options:l.options}))});const requestKey=await checkoutRequestKey(payload);const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestKey},body:payload});const result=await response.json();if(!response.ok)throw Error(result.error??t('Błąd zapisu zamówienia'));clearCheckoutRequestKey();setOrderId(String(result.orderId));setReceipt(result);setCheckoutDone(true);setCart([])}catch(err){setOrderError(err instanceof Error?err.message:t('Nie udało się wysłać zgłoszenia'))}finally{setOrderBusy(false)}};
 return <>{lightbox&&selected.images?.length&&<div className="rpm-lightbox" role="dialog" aria-modal="true" aria-label="Podgląd zdjęcia produktu" onClick={()=>setLightbox(false)}><button className="lightbox-close" onClick={()=>setLightbox(false)} aria-label="Zamknij"><X size={25}/></button><img src={selected.images[photoIndex]??selected.images[0]} alt={selected.name} onClick={e=>e.stopPropagation()}/>{selected.images.length>1&&<div className="lightbox-nav" onClick={e=>e.stopPropagation()}><button onClick={()=>setPhotoIndex(i=>(i-1+selected.images!.length)%selected.images!.length)} aria-label="Poprzednie"><ChevronLeft/></button><span>{photoIndex+1} / {selected.images.length}</span><button onClick={()=>setPhotoIndex(i=>(i+1)%selected.images!.length)} aria-label="Następne"><ChevronRight/></button></div>}</div>}<StorefrontHeader
 compactCategories={compactCategories} lang={lang} query={query} count={count}
 fmicPreview={fmicPreview} ownSuggestions={products.map(p=>({id:String(p.id),name:p.name,sku:p.sku,price:p.price,image:p.images?.[0],keywords:[p.brand,p.engine,p.description].join(' ')}))} onOwnSuggestion={id=>{const p=products.find(p=>String(p.id)===id);if(p)openProduct(p)}}
 onQuery={setQuery} onClearSearch={()=>{resetSearch();if(view==='catalog'){const url=new URL(window.location.href);url.searchParams.delete('q');url.searchParams.delete('sku');window.history.pushState({},'',url.pathname+url.search)}}} onHome={()=>navigate('home')}
 onSearchSubmit={()=>{setShopLanding(false);setCategory('Wszystkie');setShopSubcategory(null);setEngineFilter('Wszystkie');setTechnicalFilters({});const term=query.trim();if(fmicPreview){setGlobalFmicQuery(term);setFmicPath('/sklep');setView('catalog');setMobileMenu(false);setFmicMenuOpen(false);window.history.pushState({},'','/sklep?'+new URLSearchParams({q:term}));window.scrollTo({top:0});}else{navigate('catalog')}}}
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
 {view==='catalog'&&fmicPreview&&<main className="page rpm-shop-page"><FmicPreview key={globalFmicQuery} pathname={fmicPath} lang={lang} sort={sort} globalQuery={globalFmicQuery} onCategorySelect={(path,term)=>{setFmicPath(path);setQuery(term);setGlobalFmicQuery(term);window.history.pushState({},'',path+'?'+new URLSearchParams({fmicPreview:'1',q:term}));}}/></main>}
 {view==='catalog'&&!fmicPreview&&<CatalogView
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
 onQuantityChange={changeQuantity}
 onRemove={removeLine}
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
 <footer className="footer"><div><strong>RPM<span>CUSTOM</span></strong><p>PERFORMANCE PARTS & ENGINEERING</p><a href="/autopomoc" style={{color:'inherit'}}>{lang==='en'?'Road assistance':'Pomoc drogowa'}</a></div><div><p>{t("DEMO v0.1 · Produkty, ceny, stany i specyfikacje są fikcyjne lub poglądowe.")}</p><p>{t("Bez prawdziwych zamówień, płatności i logowania.")}</p></div></footer>{toast&&<div className="rpm-toast-overlay" role="status" aria-live="polite"><div className="rpm-toast-card"><div className="rpm-toast-icon"><Check size={30}/></div><strong>{toast==='Dodano do koszyka DEMO'?'Produkt dodany do koszyka!':toast}</strong><span>{toast==='Dodano do koszyka DEMO'?'Możesz kontynuować zakupy lub przejść do koszyka.':'Operacja zakończona pomyślnie.'}</span>{toast==='Dodano do koszyka DEMO'&&<button type="button" className="primary" onClick={()=>{setToast('');navigate('cart')}}><ShoppingCart size={18}/> Przejdź do koszyka</button>}<button type="button" className="rpm-toast-close" onClick={()=>setToast('')} aria-label="Zamknij komunikat"><X size={20}/></button></div></div>}</>}
