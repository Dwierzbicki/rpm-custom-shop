'use client';
import {useEffect,useState,type Dispatch,type SetStateAction} from 'react';
import type {Product,CartLine} from '../../../data';
import type {GuidePart} from '../../../lib/power-guides';
import {POWER_ENGINES,powerRangesFor} from '../../../lib/storefront-config';
import {openPowerGuidePdf} from '../../../lib/power-guide-pdf';
import {automaticWastegate,allowedConfigurationGroups} from '../../../lib/product-configuration';
type Options={enabled?:boolean;products:Product[];storageReady:boolean;setCart:Dispatch<SetStateAction<CartLine[]>>;onCart:()=>void;notify:(text:string)=>void};
export function usePowerGuides({enabled=true,products,storageReady,setCart,onCart,notify}:Options){
 const [guideEngine,setGuideEngine]=useState('');
 const [guideVersion,setGuideVersion]=useState('');
 const [guideRange,setGuideRange]=useState(-1);
 const [guideUsage,setGuideUsage]=useState('');
 const [guideTier,setGuideTier]=useState('');
 const [guideParts,setGuideParts]=useState<GuidePart[]>([]);
 const [guideOpenCategories,setGuideOpenCategories]=useState<string[]>([]);
 const [guideCartSelection,setGuideCartSelection]=useState<string[]>([]);
 const matchedGuideParts=guideParts.filter(p=>p.enabled&&p.engineVersion===guideVersion&&p.rangeIndex===guideRange&&p.usage===guideUsage&&p.tier===guideTier);
 const guideSelectionKey=['rpm-power-guide-selection-v2',guideVersion,guideRange,guideUsage,guideTier].join(':');
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
 const guideConfigGroups=(product:Product)=>allowedConfigurationGroups(product.optionGroups??[],guideConfigValues[product.id+':rpm-flange']);
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
   const rpmFlange=groups.find(group=>group.id==='rpm-flange');
   if(rpmFlange){const chosen=rpmFlange.options.find(option=>option.id===guideConfigValues[guideConfigKey(product,rpmFlange.id)]);if(chosen)options.Wastegate=automaticWastegate(chosen.id,guideConfigValues[guideConfigKey(product,'rpm-wg-diameter')])}
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
  onCart();
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

 useEffect(()=>{if(!enabled)return;const controller=new AbortController();fetch('/api/power-guides',{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('guides');return r.json()}).then(d=>{if(controller.signal.aborted)return;setGuideParts(d.parts);setGuideDiscount(d.discountPercent);setGuideDataError(false)}).catch(()=>{if(!controller.signal.aborted)setGuideDataError(true)});return()=>controller.abort()},[enabled]);

 useEffect(()=>{try{const raw=localStorage.getItem('rpm-power-guide-form-v2');if(!raw)return;const saved=JSON.parse(raw) as Record<string,unknown>;if(typeof saved.engine==='string'&&POWER_ENGINES.some(e=>e.id===saved.engine))setGuideEngine(saved.engine);if(typeof saved.version==='string'&&POWER_ENGINES.some(e=>e.versions.some(v=>v.id===saved.version)))setGuideVersion(saved.version);if(typeof saved.range==='number'&&Number.isInteger(saved.range)&&saved.range>=-1&&typeof saved.version==='string'&&saved.range<powerRangesFor(saved.version).length)setGuideRange(saved.range);if(saved.usage==='street'||saved.usage==='drift'||saved.usage==='track')setGuideUsage(saved.usage);if(saved.tier==='budget'||saved.tier==='recommended'||saved.tier==='premium')setGuideTier(saved.tier);if(Array.isArray(saved.openCategories))setGuideOpenCategories(saved.openCategories.filter((v:unknown):v is string=>typeof v==='string'))}catch{}},[]);
 useEffect(()=>{if(!storageReady)return;try{localStorage.setItem('rpm-power-guide-form-v2',JSON.stringify({engine:guideEngine,version:guideVersion,range:guideRange,usage:guideUsage,tier:guideTier,openCategories:guideOpenCategories}))}catch{}},[storageReady,guideEngine,guideVersion,guideRange,guideUsage,guideTier,guideOpenCategories]);
 const resetGuide=()=>{setGuideEngine('');setGuideVersion('');setGuideRange(-1);setGuideUsage('');setGuideTier('');setGuideOpenCategories([]);setGuideCartSelection([]);setGuideConfigOpen(false);setGuideConfigValues({});setGuideConfigError('');try{localStorage.removeItem('rpm-power-guide-form-v2');for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key?.startsWith('rpm-power-guide-selection-v1:'))localStorage.removeItem(key)}}catch{}};
 return {guideEngine,setGuideEngine,guideVersion,setGuideVersion,guideRange,setGuideRange,guideUsage,setGuideUsage,guideTier,setGuideTier,guideParts,guideOpenCategories,setGuideOpenCategories,guideCartSelection,guideConfigOpen,setGuideConfigOpen,guideConfigValues,setGuideConfigValues,guideConfigError,setGuideConfigError,guideDiscount,guideDataError,matchedGuideParts,updateGuideSelection,selectedGuideProducts,guideCartTotal,guideEligibleProducts,guideConfigItems,guideConfigGroups,guideConfigKey,confirmGuideCart,addGuideProductsToCart,exportGuidePdf,resetGuide};
}
