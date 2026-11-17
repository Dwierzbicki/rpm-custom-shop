"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { IntakeParameters, EnginePreset, PlenumShape, BuildMethod, ThrottleSide, TigPlenumFinish, PortShape } from "./model";
import { DEFAULT_INTAKE, intakePreset, m50TigPreset, normalizeIntake, calculateManifold, intakeSummary } from "./model";
import styles from "./intake.module.css";

const Scene=dynamic(()=>import("./manifold-scene"),{ssr:false});

type NumericKey="cylinderCount"|"portPitch"|"runnerInnerDiameter"|"runnerWall"|"runnerReach"|"runnerRise"|"runnerBend"|"runnerOffset"|"plenumVolume"|"plenumTaper"|"throttleDiameter"|"throttleAngle"|"flangeThickness";

function NumberSlider({label,value,min,max,step,unit,onChange}:{label:string;value:number;min:number;max:number;step:number;unit:string;onChange:(n:number)=>void}) {
  return <div className={styles.field}>
    <div className={styles.fieldTop}>
      <label>{label}</label>
      <div className={styles.numberBox}>
        <input className={styles.number} type="number" value={value} min={min} max={max} step={step} onChange={e=>onChange(Number(e.currentTarget.value))} aria-label={label}/>
        <span className={styles.unit}>{unit}</span>
      </div>
    </div>
    <input type="range" className={styles.range} min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.currentTarget.value))} aria-label={label+" — suwak"}/>
  </div>;
}

function Choices<T extends string>({choices,value,onChange}:{choices:readonly {value:T;label:string}[];value:T;onChange:(value:T)=>void}) {
  return <div className={styles.pills}>
    {choices.map(choice=><button type="button" key={choice.value} className={value===choice.value?styles.pillActive:styles.pill} aria-pressed={value===choice.value} onClick={()=>onChange(choice.value)}>{choice.label}</button>)}
  </div>;
}

function HeaderLabel({no,title}:{no:string;title:string}) {
  return <h2 className={styles.heading}><span><span className={styles.count}>{no}</span>{title}</span></h2>;
}

export default function IntakeDesignerPage(){
  const [p,setP]=useState<IntakeParameters>(DEFAULT_INTAKE);
  const [notice,setNotice]=useState("");
  const fileInput=useRef<HTMLInputElement>(null);
  const dims=useMemo(()=>calculateManifold(p),[p]);
  const number=(key:NumericKey)=>(value:number)=>setP(previous=>normalizeIntake({...previous,[key]:value}));
  const text=<K extends "method"|"plenumShape"|"throttleSide"|"tigPlenumFinish"|"portShape">(key:K)=>(value:IntakeParameters[K])=>setP(previous=>normalizeIntake({...previous,[key]:value}));
  const selectEngine=(engine:EnginePreset)=>setP(previous=>normalizeIntake({...intakePreset(engine),method:previous.method,plenumShape:previous.plenumShape,throttleSide:previous.throttleSide}));
  const save=()=>{
    const blob=new Blob([JSON.stringify(intakeSummary(p),null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const element=document.createElement("a");
    element.href=url;
    element.download="RPM_CUSTOM_Intake_Concept.json";
    element.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setNotice("Zapisano konfigurację koncepcyjną JSON.");
  };
  const load=async(file?:File)=>{
    if(!file)return;
    try {
      if(file.size>500_000)throw Error("Plik jest zbyt duży.");
      const parsed:unknown=JSON.parse(await file.text());
      if(!parsed || typeof parsed!=="object")throw Error("Niepoprawny projekt.");
      const data=parsed as {parameters?:Partial<IntakeParameters>};
      const params=data.parameters??parsed;
      if(!params || typeof params!=="object")throw Error("Brak parametrów projektu.");
      const read=params as Partial<IntakeParameters>;
      if(typeof read.runnerInnerDiameter!=="number" || typeof read.plenumVolume!=="number" || typeof read.cylinderCount!=="number"){
        throw Error("To nie jest plik projektu kolektora RPM Custom.");
      }
      setP(normalizeIntake(read));
      setNotice("Wczytano projekt kolektora.");
    }catch(err){setNotice(err instanceof Error?err.message:"Nie można wczytać projektu.");}
  };
  return <main className={styles.page}>
    <header className={styles.header}>
      <a className={styles.brand} href="/">RPM <span>CUSTOM</span></a>
      <div className={styles.headerRight}>
        <a className={styles.navLink} href="/designery">← Kreatory CAD</a>
        <a className={styles.navLink} href="/itb-designer">ITB Designer</a>
        <a className={styles.navLink} href="/">Sklep</a>
      </div>
    </header>
    <section className={styles.masthead}>
      <div className={styles.overline}>RPM CUSTOM · MOTOLAB · CAD CONCEPT V1</div>
      <h1 className={styles.title}>Intake Manifold Designer</h1>
      <p className={styles.subtitle}>Parametryczny projekt kolektorów ssących: jedna geometria, dwa sposoby wykonania — spawanie TIG lub billet CNC. Zmieniaj wymiary i obserwuj model 3D na żywo.</p>
    </section>
    <div className={styles.dashboard}>
      <aside className={styles.left+" "+styles.panel}>
        <section className={styles.section}>
          <HeaderLabel no="01" title="Wybierz silnik"/>
          <Choices value={p.engine} onChange={selectEngine} choices={[{value:"2jz-gte",label:"2JZ-GTE"},{value:"2jz-ge",label:"2JZ-GE"},{value:"m50-m52",label:"BMW M50/M52"},{value:"m54",label:"BMW M54"},{value:"universal",label:"Uniwersalny"}] as const}/>
          <button type="button" className={styles.action} style={{width:"100%",marginTop:12,background:"#f97316"}} onClick={()=>{setP(m50TigPreset());setNotice("Wczytano preset koncepcyjny BMW M50 TIG.");}}>⚙ Załaduj preset BMW M50 TIG · Wedge</button>
          <p className={styles.helper}>Preset M50 TIG bazuje na wyglądzie kolektora z przesłanych zdjęć. Porty, śruby i ich rozstaw nie są zweryfikowanymi wymiarami OEM.</p>
          {p.engine==="universal"&&<NumberSlider label="Liczba cylindrów" value={p.cylinderCount} min={3} max={12} step={1} unit="szt." onChange={number("cylinderCount")}/>}
          <div style={{marginTop:12}}><NumberSlider label="Rozstaw osi runnerów" value={p.portPitch} min={p.runnerInnerDiameter+p.runnerWall*2+5} max={150} step={1} unit="mm" onChange={number("portPitch")}/></div>
        </section>
        <section className={styles.section}>
          <HeaderLabel no="02" title="Runnery dolotowe"/>
          <NumberSlider label="Średnica wewnętrzna" value={p.runnerInnerDiameter} min={25} max={75} step={1} unit="mm" onChange={number("runnerInnerDiameter")}/>
          <NumberSlider label="Grubość ścianki" value={p.runnerWall} min={1.5} max={8} step={.5} unit="mm" onChange={number("runnerWall")}/>
          <NumberSlider label="Wysięg runnerów" value={p.runnerReach} min={70} max={320} step={5} unit="mm" onChange={number("runnerReach")}/>
          <NumberSlider label="Wysokość osi plenum" value={p.runnerRise} min={40} max={200} step={5} unit="mm" onChange={number("runnerRise")}/>
          <NumberSlider label="Stopień wygięcia runnerów" value={p.runnerBend} min={0} max={100} step={1} unit="%" onChange={number("runnerBend")}/>
          <NumberSlider label="Przesunięcie wlotów przy plenum" value={p.runnerOffset} min={-35} max={35} step={1} unit="mm" onChange={number("runnerOffset")}/>
          <p className={styles.helper}>Wysięg i wysokość definiują przebieg kanału. Długość rzeczywistej osi zakrzywionego kanału jest od nich różna.</p>
        </section>
        <section className={styles.section}>
          <HeaderLabel no="03" title="Flansza głowicy"/>
          <NumberSlider label="Grubość flanszy" value={p.flangeThickness} min={6} max={25} step={1} unit="mm" onChange={number("flangeThickness")}/>
          <p className={styles.helper} style={{marginBottom:8}}>Wizualny kształt portu dolotowego</p>
          <Choices<PortShape> value={p.portShape} onChange={text("portShape")} choices={[{value:"round",label:"Okrągły"},{value:"oval",label:"Owalny"},{value:"rounded-rect",label:"Zaokrąglony prostokąt"}]}/>
          
          <div className={styles.warning}>Kształt portów i otwory śrub są tylko wizualizacją. Nie wycinaj flanszy na podstawie tego modelu. Wersja produkcyjna wymaga potwierdzonego DXF/STEP albo pomiaru głowicy.</div>
          <div style={{marginTop:12,display:"grid",gap:6,fontSize:11}}>
            <strong style={{color:"#fbbf83"}}>Źródła danych do flansz (zewnętrzne)</strong>
            {(p.engine==="2jz-gte"||p.engine==="2jz-ge")&&<a href={p.engine==="2jz-gte"?"https://3dengine.shop/shop/2jz-gte-intake-runners-3d-scan/":"https://3dengine.shop/shop/2jz-ge-vvti-cylinder-head-3d-scan/"} target="_blank" rel="noopener noreferrer" style={{color:"#93c5fd"}}>Otwórz skan 3D {p.engine==="2jz-gte"?"2JZ-GTE runners":"2JZ-GE VVTi head"} ↗</a>}
            {p.engine==="m50-m52"&&<a href="https://www.etsy.com/listing/1854507188/bmw-m50m52-engine-intake-flange-dxfdwg" target="_blank" rel="noopener noreferrer" style={{color:"#93c5fd"}}>Zobacz DXF/DWG flanszy BMW M50/M52 ↗</a>}
            {p.engine==="m54"&&<a href="https://www.bdsystems.com.au/products/bmw-m54-intake-manifold" target="_blank" rel="noopener noreferrer" style={{color:"#93c5fd"}}>Referencja — skan kolektora BMW M54 ↗</a>}
            <small style={{color:"#8293a8",lineHeight:1.5}}>Pliki źródłowe mogą być płatne i objęte licencją. Na razie nie są częścią kreatora ani produkcyjnego modelu.</small>
          </div>
        </section>
      </aside>

      <section className={styles.stage} aria-label="Przypięty podgląd 3D kolektora">
        <Scene params={p} dims={dims}/>
        <div className={styles.stickyFoot}>Obrót: przeciągnij model · Zoom: kółko / gest szczypania · Warianty widoku poniżej sceny</div>
      </section>

      <aside className={styles.right+" "+styles.panel}>
        <section className={styles.section}>
          <HeaderLabel no="04" title="Technologia produkcji"/>
          <Choices<BuildMethod> value={p.method} onChange={text("method")} choices={[{value:"tig",label:"TIG · spawany"},{value:"cnc",label:"CNC · billet"}]}/>
          <p className={styles.helper}>{p.method==="tig"?"Widok złożenia z sześciu rur, flanszy, spawanego plenum i przepustnicy.":"Widok koncepcyjnego korpusu billet — przyszły model będzie wymagał podziału na obrabialne części."}</p>
          {p.method==="tig"&&<div style={{marginTop:12}}><label style={{fontSize:12,color:"#cbd5e1",display:"block",marginBottom:8}}>Wygląd plenum TIG</label><Choices<TigPlenumFinish> value={p.tigPlenumFinish} onChange={text("tigPlenumFinish")} choices={[{value:"graphite",label:"Grafit + polerowane runnery"},{value:"aluminum",label:"Surowe aluminium"}]}/></div>}
        </section>
        <section className={styles.section}>
          <HeaderLabel no="05" title="Plenum"/>
          <Choices<PlenumShape> value={p.plenumShape} onChange={text("plenumShape")} choices={[{value:"round",label:"Okrągłe"},{value:"oval",label:"Owalne"},{value:"box",label:"Prostokątne"},{value:"wedge",label:"Klinowe · Wedge"}]}/>
          <div style={{marginTop:14}}><NumberSlider label="Docelowa pojemność" value={p.plenumVolume} min={1} max={18} step={.1} unit="l" onChange={number("plenumVolume")}/></div>
          {p.plenumShape!=="box"&&<NumberSlider label="Zwężenie plenum ku przepustnicy" value={p.plenumTaper} min={0} max={45} step={1} unit="%" onChange={number("plenumTaper")}/>}
          <p className={styles.helper}>Zwężenie określa różnicę średnic końców plenum; kierunek zależy od położenia przepustnicy. Pojemność to przybliżenie geometryczne, bez dokładnego odjęcia objętości kanałów.</p>
        </section>
        <section className={styles.section}>
          <HeaderLabel no="06" title="Przepustnica"/>
          <NumberSlider label="Średnica przepustnicy" value={p.throttleDiameter} min={40} max={120} step={2} unit="mm" onChange={number("throttleDiameter")}/>
          <Choices<ThrottleSide> value={p.throttleSide} onChange={text("throttleSide")} choices={[{value:"left",label:"Po lewej"},{value:"right",label:"Po prawej"}]}/>
          <div style={{marginTop:12}}><NumberSlider label="Kąt przepustnicy" value={p.throttleAngle} min={-25} max={25} step={1} unit="°" onChange={number("throttleAngle")}/></div>
          <p className={styles.helper}>Wizualizowana flansza przepustnicy zawiera orientacyjne otwory montażowe.</p>
        </section>
        <section className={styles.section}>
          <HeaderLabel no="07" title="Detale montażowe · koncepcja"/>
          <div className={styles.pills}>
            <button type="button" aria-pressed={p.injectorBosses} className={p.injectorBosses?styles.pillActive:styles.pill} onClick={()=>setP(prev=>normalizeIntake({...prev,injectorBosses:!prev.injectorBosses}))}>Wtryski + listwa {p.injectorBosses?"✓":"+"}</button>
            <button type="button" aria-pressed={p.vacuumPorts} className={p.vacuumPorts?styles.pillActive:styles.pill} onClick={()=>setP(prev=>normalizeIntake({...prev,vacuumPorts:!prev.vacuumPorts}))}>Króćce podciśnienia {p.vacuumPorts?"✓":"+"}</button>
          </div>
          <p className={styles.helper}>Pozycje bossów, listwy i króćców są poglądowe. Nie stanowią dokumentacji montażowej ani sprawdzenia kolizji.</p>
        </section>
        <section className={styles.section}>
          <HeaderLabel no="08" title="Podsumowanie projektu"/>
          <div className={styles.metricGrid}>
            <div className={styles.metric}><div className={styles.metricValue}>{p.cylinderCount}</div><div className={styles.metricLabel}>Runnerów</div></div>
            <div className={styles.metric}><div className={styles.metricValue}>{p.plenumVolume.toFixed(1)} l</div><div className={styles.metricLabel}>Docelowe plenum</div></div>
            <div className={styles.metric}><div className={styles.metricValue}>Ø {dims.runnerOutside.toFixed(1)}</div><div className={styles.metricLabel}>Zewn. średnica rur [mm]</div></div>
            <div className={styles.metric}><div className={styles.metricValue}>{Math.round(dims.plenumLength)} mm</div><div className={styles.metricLabel}>Długość plenum</div></div>
          </div>
          <p className={styles.helper}>{p.method==="tig"?"Plan TIG: flansza → gięte kanały → plenum → przepustnica → spawanie i kontrola szczelności.":"Plan CNC: podział korpusu → kontrola dostępności narzędzia → obróbka kanałów → powierzchnie łączenia → montaż."}</p>
        </section>
        <section className={styles.section}>
          <HeaderLabel no="09" title="Zapis projektu"/>
          <div className={styles.actionRow}>
            <button type="button" className={styles.action} onClick={save}>↓ Zapisz JSON</button>
            <button type="button" className={styles.actionSecondary} onClick={()=>fileInput.current?.click()}>↑ Wczytaj JSON</button>
          </div>
          <input ref={fileInput} type="file" accept=".json,application/json" style={{display:"none"}} aria-label="Wczytaj projekt JSON" onChange={e=>{void load(e.target.files?.[0]);e.target.value="";}}/>
          <button type="button" style={{marginTop:8,width:"100%"}} className={styles.actionSecondary} onClick={()=>{setP(DEFAULT_INTAKE);setNotice("Przywrócono parametry początkowe.");}}>Przywróć parametry</button>
          {notice&&<p role="status" className={styles.helper} style={{color:"#fdba74"}}>{notice}</p>}
          <div className={styles.warning} style={{marginTop:12}}>Etap MVP: model 3D i zapis konfiguracji. Nie generujemy jeszcze STEP, DXF, ścieżek CAM ani gotowej dokumentacji do produkcji. Geometria jest wyłącznie koncepcyjna.</div>
        </section>
      </aside>
    </div>
    <footer className={styles.footer}>© RPM Custom · Projekt koncepcyjny. Wymiary należy zweryfikować przed wykonaniem części.</footer>
  </main>;
}
