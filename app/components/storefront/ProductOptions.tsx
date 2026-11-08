'use client';
import {Check,Settings2} from 'lucide-react';
import {money} from '../../data';
import type {Product,ProductOptionGroup} from '../../data';

export type ProductOptionsProps={
 selected:Product;
 usesCustom:boolean;
 customGroups:ProductOptionGroup[];
 chosenOptions:Record<string,string>;
 automaticWg:string;
 customExtra:number;
 selectedPrice:number;
 engine:string;
 flange:string;
 wg:string;
 egt:boolean;
 t:(label:string)=>string;
 onOption:(groupId:string,value:string)=>void;
 onEngine:(value:string)=>void;
 onFlange:(value:string)=>void;
 onWg:(value:string)=>void;
 onEgt:(value:boolean)=>void;
};

/** Keeps the current product's modern and legacy manifold config UIs intact. */
export default function ProductOptions({
 selected,usesCustom,customGroups,chosenOptions,automaticWg,customExtra,selectedPrice,
 engine,flange,wg,egt,t,onOption,onEngine,onFlange,onWg,onEgt
}:ProductOptionsProps){
 return (
  <>
   {usesCustom&&<div className="config product-options"><div className="config-title"><Settings2 size={19}/> Skonfiguruj produkt</div><p>Wybierz warianty. Dopłaty są doliczane do ceny podstawowej.</p>{customGroups.map(group=><div className="option-group" key={group.id}><span className="option-label">{group.name}{group.required?' *':''}</span><div className="option-choices">{!group.required&&<button type="button" className={!chosenOptions[group.id]?'option-choice selected':'option-choice'} onClick={()=>onOption(group.id,'')}>Bez dodatku</button>}{group.options.map(opt=><button type="button" key={opt.id} className={chosenOptions[group.id]===opt.id?'option-choice selected':'option-choice'} aria-pressed={chosenOptions[group.id]===opt.id} onClick={()=>onOption(group.id,opt.id)}>{opt.label}{opt.price>0?' (+'+money(opt.price)+')':''}</button>)}</div>{group.id==='rpm-flange'&&automaticWg&&<p className="fitment-note"><Check size={16}/> Wastegate: <strong>{automaticWg}</strong> — dobrany automatycznie</p>}</div>)}<div className="option-summary"><span>Cena podstawowa: {money(selected.price)}</span><span>Dopłaty: {money(customExtra)}</span><strong>Razem: {money(selectedPrice)}</strong></div><small className="muted">Kompatybilność i termin realizacji wymagają potwierdzenia RPM Custom.</small></div>}{!usesCustom&&selected.configurable&&<div className="config product-options"><div className="config-title"><Settings2 size={19}/>{t("Wybierz wariant produktu")}</div><p>{t("Wybierz opcje poniżej. Dopłaty i dostępność wymagają potwierdzenia.")}</p><div className="fitment-note"><Check size={16}/><span>{t("Flansza do głowicy")}: <strong>{selected.engine}</strong> — {t("przypisana do tego produktu")}</span></div>{selected.id===1&&<div className="option-group"><span className="option-label">{t("Wersja silnika")} *</span><div className="option-choices">{['M50','M52'].map(v=><button type="button" key={v} className={engine===v?'option-choice selected':'option-choice'} aria-pressed={engine===v} onClick={()=>onEngine(v)}>{v}</button>)}</div></div>}<div className="option-group"><span className="option-label">{t("Flansza turbosprężarki")} *</span><div className="option-choices">{['T3','T4','V-Band'].map(v=><button type="button" key={v} className={flange===v?'option-choice selected':'option-choice'} aria-pressed={flange===v} onClick={()=>onFlange(v)}>{v}</button>)}</div></div><div className="option-group"><span className="option-label">Wastegate *</span><div className="option-choices">{['Single WG','Twin WG'].map(v=><button type="button" key={v} className={wg===v?'option-choice selected':'option-choice'} aria-pressed={wg===v} onClick={()=>onWg(v)}>{v}</button>)}</div></div><div className="option-group"><span className="option-label">{t("Porty EGT")}</span><div className="option-choices"><button type="button" className={!egt?'option-choice selected':'option-choice'} aria-pressed={!egt} onClick={()=>onEgt(false)}>{t("Bez EGT")}</button><button type="button" className={egt?'option-choice selected':'option-choice'} aria-pressed={egt} onClick={()=>onEgt(true)}>{t("Z EGT")}</button></div></div><div className="option-summary"><span>{t("Wybrany wariant")}</span><strong>{selected.id===1?(engine||'—')+' / ':''}{flange||'—'} / {wg||'—'} / EGT: {egt?t("Tak"):t("Nie")}</strong></div><small className="muted">{t("Kompatybilność wybranych opcji i termin realizacji podlegają weryfikacji RPM Custom.")}</small></div>}
  </>
 );
}
