'use client';
import {useEffect,useState} from 'react';
import {productPath} from '../../lib/product-path';
import type {siliconeAlternatives} from '../../lib/silicone-dimensions';
type Choices=NonNullable<ReturnType<typeof siliconeAlternatives>>;
export default function SiliconeDimensions({sku,category,lang,disabled}:{sku:string;category:string[];lang:'pl'|'en';disabled:boolean}){
 const [data,setData]=useState<Choices|null>(null);
 const eligible=category[0]==='Układ dolotowy'&&category[1]==='Łączniki silikonowe'&&/^Kolanka (silikonowe|redukcyjne) \d+°$/.test(category[2]??'');
 useEffect(()=>{
  setData(null);if(!eligible)return;const c=new AbortController();
  fetch('/api/catalog/fmic/silicone-dimensions?'+new URLSearchParams({sku}),{signal:c.signal,cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(!c.signal.aborted)setData(d?.choices??null)}).catch(()=>{});
  return()=>c.abort();
 },[sku,eligible]);
 if(!data||data.selected.sku!==sku||data.angles.length<2&&data.diameters.length<2)return null;
 const english=lang==='en';
 return <section className="rpm-pdp-variants" aria-label={english?'Silicone dimensions':'Wymiary silikonu'}><h2>{english?'Choose dimensions':'Wybierz wymiary'}</h2>
 {([{label:english?'Bend angle':'Kąt kolanka',items:data.angles,unit:'°',axis:'angle'},{label:english?'Diameter':'Średnica',items:data.diameters,unit:' mm',axis:'diameter'}] as const).map(group=><label className="rpm-pdp-other-option" key={group.axis}><strong>{group.label}</strong><select value={sku} disabled={disabled||group.items.length<2} onChange={e=>{const v=group.items.find(x=>x.sku===e.target.value);if(v&&v.sku!==sku)window.location.assign(productPath(v.name,v.sku))}}>{group.items.map(v=><option key={v.sku} value={v.sku}>{v[group.axis]}{group.unit} · {Number(v.price).toLocaleString('pl-PL',{style:'currency',currency:'PLN'})}{!v.available?(english?' · Unavailable':' · Niedostępny'):''}</option>)}</select></label>)}
 <p className="fmic-pdp-note">{english?'Only existing combinations in the current colour. Selecting a dimension opens its exact product.':'Tylko istniejące kombinacje w wybranym kolorze. Zmiana wymiaru otwiera dokładny produkt i jego SKU.'}</p></section>;
}
