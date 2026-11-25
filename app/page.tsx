'use client';
import ProductCard from './components/storefront/ProductCard';
import CartLineList from './components/storefront/CartLineList';
import HomeSections from './components/storefront/HomeSections';
import StorefrontHeader from './components/storefront/StorefrontHeader';
import {useCheckoutSubmission} from './components/storefront/hooks/useCheckoutSubmission';
import {useStorefrontLanguage} from './components/storefront/hooks/useStorefrontLanguage';
import {FMIC_CATEGORY_DESCRIPTIONS,FMIC_CATEGORY_ICONS,POWER_ENGINES,POWER_RANGES,categories,phonePrefixes} from './lib/storefront-config';
import type {View} from './lib/storefront-config';
import {useShopCollections} from './components/storefront/hooks/useShopCollections';
import {useProductConfiguration} from './components/storefront/hooks/useProductConfiguration';
import {useCheckoutDetails} from './components/storefront/hooks/useCheckoutDetails';
import {useEffect,useState} from 'react';
import dynamic from 'next/dynamic';
import {createPortal} from 'react-dom';
import {ShoppingCart,Search,Menu,X,UserRound,ChevronRight,Plus,Minus,Trash2,Warehouse,Settings2,Wrench,Check,ArrowRight,Package,ShieldAlert,ZoomIn,ChevronLeft,FileDown,Wind,Droplets,Fuel,Flame,Disc,GitBranch,Gauge,Cpu,Armchair,Sparkles,Boxes} from 'lucide-react';
import {products as demoProducts,money,Product,CartLine} from './data';
import {SHOP_DEPARTMENTS,ShopSubcategory} from './shop-departments';
import {FMIC_CATEGORY_TREE} from './fmic-categories';
import {useHomepagePreview} from './components/storefront/hooks/useHomepagePreview';
import {categoryPath} from './category-routing';
import {storefrontPath,storefrontLocation,pushStorefrontPath} from './lib/storefront-navigation';
import {useStorefrontMenu} from './components/storefront/hooks/useStorefrontMenu';
import {usePowerGuides} from './components/storefront/hooks/usePowerGuides';
import {useCatalogFiltering} from './components/storefront/hooks/useCatalogFiltering';

// Load secondary storefront views only when the customer navigates to them.
const ViewLoading=()=> <main className="page" role="status" aria-live="polite">Ładowanie…</main>;
const CatalogView=dynamic(()=>import('./components/storefront/CatalogView'),{loading:ViewLoading});
const FmicPreview=dynamic(()=>import('./components/storefront/FmicPreview'),{loading:ViewLoading});
const ProductDetailView=dynamic(()=>import('./components/storefront/ProductDetailView'),{loading:ViewLoading});
const CartView=dynamic(()=>import('./components/storefront/CartView'),{loading:ViewLoading});
const CheckoutView=dynamic(()=>import('./components/storefront/CheckoutView'),{loading:ViewLoading});
const PowerGuidesView=dynamic(()=>import('./components/storefront/PowerGuidesView'),{loading:ViewLoading});
const InlineHomepageEditor=dynamic(()=>import('./inline-homepage-editor'));

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
 const [inlineShopOpen,setInlineShopOpen]=useState(false);
 const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
 useEffect(()=>{fetch('/api/catalog',{cache:'no-store'}).then(async response=>{if(response.ok){const data=await response.json();if(Array.isArray(data.products))setProducts(data.products)}}).catch(()=>{})},[]);
 const {lang,t,changeLang}=useStorefrontLanguage();
 const {selected,setSelected,chosenOptions,setChosenOptions,photoIndex,setPhotoIndex,lightbox,setLightbox,engine,setEngine,flange,setFlange,wg,setWg,egt,setEgt,qty,setQty,customGroups,automaticWg,usesCustom,customExtra,selectedPrice,unitPrice,totalPrice,canAdd,resetProduct,buildLine}=useProductConfiguration(products[0]);

 const [view,setView]=useState<View>('home'),[query,setQuery]=useState(''),[category,setCategory]=useState('Wszystkie'),[engineFilter,setEngineFilter]=useState('Wszystkie'),[sort,setSort]=useState('featured'),[toast,setToast]=useState('');
 const {mobileMenu,setMobileMenu,activeFmicRoot,setActiveFmicRoot,activeFmicSub,setActiveFmicSub,compactCategories,setFmicMenuOpen}=useStorefrontMenu(view);
 const {technicalFilters,setTechnicalFilters,catalogCategories,catalogEngines,technicalFilterOptions,filtered}=useCatalogFiltering({products,category,shopSubcategory,engineFilter,setEngineFilter,query,sort});
 const {checkoutType,setCheckoutType,shippingMethod,setShippingMethod,shippingSettings,shippingSettingsReady,paymentSettings,paymentMethod,setPaymentMethod,phonePrefix,setPhonePrefix,phoneMenuOpen,setPhoneMenuOpen,companyName,setCompanyName,companyNip,setCompanyNip,companyAddress,setCompanyAddress,deliveryAddress,setDeliveryAddress,deliveryPostalCode,setDeliveryPostalCode,deliveryCity,setDeliveryCity,deliveryNotice,companyLookupBusy,companyLookupMessage,setCompanyLookupMessage,companyLookupState,setCompanyLookupState,copyCompanyAddress,lookupCompany}=useCheckoutDetails(t);
 const {cart,setCart,garage,setGarage,storageReady,linesTotal,count,changeQuantity,removeLine,addSavedLine}=useShopCollections(products,view,setView);
 const notify=(t:string)=>{setToast(t);window.setTimeout(()=>setToast(''),3200)};
 const {guideEngine,setGuideEngine,guideVersion,setGuideVersion,guideRange,setGuideRange,guideUsage,setGuideUsage,guideTier,setGuideTier,guideParts,guideOpenCategories,setGuideOpenCategories,guideCartSelection,guideConfigOpen,setGuideConfigOpen,guideConfigValues,setGuideConfigValues,guideConfigError,setGuideConfigError,guideDiscount,guideDataError,matchedGuideParts,updateGuideSelection,selectedGuideProducts,guideCartTotal,guideEligibleProducts,guideConfigItems,guideConfigGroups,guideConfigKey,confirmGuideCart,addGuideProductsToCart,exportGuidePdf,resetGuide}=usePowerGuides({products,storageReady,setCart,onCart:()=>navigate('cart'),notify});
 const resetSearch=()=>{setQuery('');setGlobalFmicQuery('')};
  const navigate=(v:View)=>{if(v!=='product')resetSearch();if(view==='guides'&&v!=='guides')resetGuide();setView(v);setMobileMenu(false);setFmicMenuOpen(false);if(typeof window!=='undefined'){const path=storefrontPath(v);if(path){setFmicPath(path);pushStorefrontPath(path)}}window.scrollTo({top:0,behavior:'smooth'})};
 const openCatalogPath=(names:string[])=>{setGlobalFmicQuery('');setShopSubcategory(null);setEngineFilter('Wszystkie');setSort('featured');setShopLanding(false);setCategory('Wszystkie');setQuery(fmicPreview?'':(names.at(-1)??''));setView('catalog');setMobileMenu(false);setActiveFmicRoot(null);setActiveFmicSub(null);setFmicMenuOpen(false);const path=categoryPath(names);setFmicPath(path);pushStorefrontPath(path);window.scrollTo({top:0,behavior:'smooth'})};
 useEffect(()=>{const sync=()=>{const location=storefrontLocation(window.location.pathname,window.location.search);if(location.category===null){setQuery('');setGlobalFmicQuery('')}else{setCategory('Wszystkie');setQuery(location.query);setShopSubcategory(null)}if(location.view)setView(location.view)};sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[]);
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('power-guides')==='1')setView('guides')},[]);
 useEffect(()=>{const id=Number(new URLSearchParams(window.location.search).get('product'));if(!Number.isSafeInteger(id)||id<=0)return;const found=products.find(p=>p.id===id);if(found){setSelected(found);setChosenOptions({});setPhotoIndex(0);setView('product');}},[products]);
 const openProduct=(p:Product)=>{resetProduct(p);navigate('product')};
 const addLine=(target:'cart'|'garage')=>{const line=buildLine();if(!line){notify('Wybierz wymagane opcje kolektora');return}addSavedLine(target,line);notify(target==='cart'?'Dodano do koszyka DEMO':'Zapisano w RPM Garage Lite')};
 const openShopCategory=(name:string)=>{setInlineShopOpen(false);setShopSubcategory(null);setCategory(name);setEngineFilter('Wszystkie');setQuery('');setSort('featured');setShopLanding(false);navigate('catalog')};
 const openDepartmentSubcategory=(sub:ShopSubcategory)=>{if(!sub.catalogCategory)return;setShopSubcategory(sub);setCategory(sub.catalogCategory);setEngineFilter('Wszystkie');setQuery('');setSort('featured');setShopLanding(false);setInlineShopOpen(false);requestAnimationFrame(()=>document.getElementById('rpm-inline-catalog')?.scrollIntoView({behavior:'smooth',block:'start'}))};
 const categoryLabel=(name:string)=>lang==='en'?({'Wszystkie':'All products','Kolektory':'Turbo manifolds','Turbo':'Turbochargers','Intercoolery':'Intercoolers','Wastegate':'Wastegates','Osprzęt':'Fittings & hardware','Elektronika':'Electronics','Paliwo':'Fuel system'}[name]??name):name;
 const categoryIcon=(name:string)=>({'Kolektory':'⚙','Turbo':'◉','Intercoolery':'▤','Wastegate':'◇','Osprzęt':'⬡','Elektronika':'⌁','Paliwo':'◈'}[name]??'✦');
 const card=(p:Product)=><ProductCard key={p.id} product={p} onOpen={openProduct} translate={t}/>;
 const cartList=(lines:CartLine[],editable:boolean)=><CartLineList lines={lines} editable={editable} products={products} onOpen={openProduct} onQuantityChange={changeQuantity} onRemove={removeLine}/>;
 const {checkoutDone,receipt,orderBusy,orderError,handleCheckoutSubmit,resetCheckout}=useCheckoutSubmission({cart,lang,phonePrefix,shippingMethod,paymentMethod,shippingSettingsReady,clearCart:()=>setCart([]),t});
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
  onBackToStore={()=>{resetCheckout();navigate('home')}}
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
