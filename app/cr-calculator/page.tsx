"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  PRESETS, calculateCompression, requiredPistonCc, volumeAtAngle,
  pistonTravel, type EngineParams, type EnginePresetId,
} from "./model";
import type { R6View, R6Mode } from "./r6-cutaway-scene";
import styles from "./cr-calculator.module.css";

const ReferenceScene = dynamic(() => import("./reference-engine-scene"), {
  ssr: false,
  loading: () => <div className={styles.loading}><span className={styles.loadingSpinner} />Wczytywanie modelu GLB…</div>,
});

const Scene = dynamic(() => import("./r6-cutaway-scene"), {
  ssr: false,
  loading: () => <div className={styles.loading}><span className={styles.loadingSpinner} />Inicjalizacja silnika 3D…</div>,
});

type NumericKey = keyof EngineParams;
type ConfigField = { key: NumericKey; title: string; min: number; max: number; step: number; unit: string; hint?: string };

const dimensions: ConfigField[] = [
  { key: "bore", title: "Średnica cylindra", min: 45, max: 130, step: 0.1, unit: "mm" },
  { key: "stroke", title: "Skok tłoka", min: 40, max: 130, step: 0.1, unit: "mm" },
  { key: "rodLength", title: "Długość korbowodu (oś–oś)", min: 90, max: 230, step: 0.1, unit: "mm" },
  { key: "cylinders", title: "Liczba cylindrów", min: 1, max: 12, step: 1, unit: "szt." },
];
const combustion: ConfigField[] = [
  { key: "chamber", title: "Komora spalania w głowicy", min: 15, max: 120, step: 0.1, unit: "cm³" },
  { key: "pistonCc", title: "Denko tłoka / kieszenie", min: -30, max: 40, step: 0.1, unit: "cm³", hint: "Plus = wklęsłe / kieszenie, minus = wypukła kopuła." },
  { key: "gasketBore", title: "Średnica uszczelki", min: 45, max: 135, step: 0.1, unit: "mm" },
  { key: "gasketThickness", title: "Grubość uszczelki po ściśnięciu", min: 0.3, max: 5, step: 0.05, unit: "mm" },
  { key: "deckClearance", title: "Tłok względem płaszczyzny bloku", min: -2, max: 4, step: 0.05, unit: "mm", hint: "Plus = tłok poniżej bloku; minus = tłok ponad blokiem." },
];
const format = (n: number, digits = 2) =>
  Number.isFinite(n) ? n.toLocaleString("pl-PL", { maximumFractionDigits: digits, minimumFractionDigits: digits }) : "—";

function Field({ field, value, onChange }: { field: ConfigField; value: number; onChange: (value: number) => void }) {
  return <div className={styles.field}>
    <div className={styles.fieldHeader}>
      <label htmlFor={"cr-" + field.key}>{field.title}</label>
      <div className={styles.numberWrap}>
        <input
          id={"cr-" + field.key} type="number"
          value={value} min={field.min} max={field.max} step={field.step}
          onChange={e => {
            const n = e.currentTarget.valueAsNumber;
            if (Number.isFinite(n)) onChange(Math.max(field.min, Math.min(field.max, n)));
          }}
        />
        <span>{field.unit}</span>
      </div>
    </div>
    <input className={styles.range} type="range" min={field.min} max={field.max} step={field.step} value={value}
      onChange={e => onChange(Number(e.currentTarget.value))} aria-label={field.title + " — suwak"} />
    {field.hint && <small className={styles.fieldHint}>{field.hint}</small>}
  </div>;
}

function Icon({ name }: { name: "play" | "pause" | "reset" | "download" }) {
  if (name === "play") return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" /></svg>;
  if (name === "pause") return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>;
  if (name === "download") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 11a8 8 0 1 1 2 6M4 4v7h7" /></svg>;
}

export default function CrCalculatorPage() {
  const [sceneType, setSceneType] = useState<"reference" | "animated">("reference");
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");
  const [localGlb, setLocalGlb] = useState<string | null>(null);
  const [localGlbName, setLocalGlbName] = useState("");
  const localGlbRef = useRef<string | null>(null);
  const onModelStatus = useCallback((status: "loading" | "ready" | "error") => setModelStatus(status), []);
  useEffect(() => () => {
    if (localGlbRef.current) URL.revokeObjectURL(localGlbRef.current);
  }, []);
  const handleLocalModel = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".glb")) {
      setModelStatus("error");
      return;
    }
    if (file.size > 35 * 1024 * 1024) {
      setModelStatus("error");
      return;
    }
    if (localGlbRef.current) URL.revokeObjectURL(localGlbRef.current);
    const url = URL.createObjectURL(file);
    localGlbRef.current = url;
    setLocalGlb(url);
    setLocalGlbName(file.name);
  };
  const [preset, setPreset] = useState<EnginePresetId>("m54");
  const [params, setParams] = useState<EngineParams>({ ...PRESETS.m54.params });
  const [running, setRunning] = useState(true);
  const [rpm, setRpm] = useState(18);
  const [angle, setAngle] = useState(0);
  const [view, setView] = useState<R6View>("front");
  const [mode, setMode] = useState<R6Mode>("complete");
  const [selectedCylinder, setSelectedCylinder] = useState(1);
  const [focusCylinder, setFocusCylinder] = useState(false);
  const [xray, setXray] = useState(false);
  const [showGas, setShowGas] = useState(true);
  const [target, setTarget] = useState(9);
  const [note, setNote] = useState("");
  const calc = useMemo(() => calculateCompression(params), [params]);
  // 1–5–3–6–2–4, power TDC every 120 crankshaft degrees.
  const firingAngles = [0, 480, 240, 600, 120, 360] as const;
  const crankOffsets = [0, 240, 120, 120, 240, 0] as const;
  const selectedPhase = ((angle - firingAngles[selectedCylinder - 1]) % 720 + 720) % 720;
  const selectedCrankAngle = angle + crankOffsets[selectedCylinder - 1];
  const volume = useMemo(() => volumeAtAngle(params, selectedCrankAngle), [params, selectedCrankAngle]);
  const travel = useMemo(() => pistonTravel(params, selectedCrankAngle), [params, selectedCrankAngle]);
  const targetPistonCc = useMemo(() => requiredPistonCc(params, target), [params, target]);

  const change = (key: NumericKey, value: number) => {
    setPreset("custom");
    setParams(p => ({ ...p, [key]: value }));
    setNote("");
  };
  const selectPreset = (id: EnginePresetId) => {
    setPreset(id);
    setParams({ ...PRESETS[id].params });
    setAngle(0);
    setRunning(false);
    setNote("");
  };
  const applyTarget = () => {
    if (!Number.isFinite(targetPistonCc) || targetPistonCc < -30 || targetPistonCc > 40) {
      setNote("Wymagana objętość denka jest poza zakresem kalkulatora (−30 do +40 cm³).");
      return;
    }
    change("pistonCc", Math.round(targetPistonCc * 100) / 100);
    setNote("Zastosowano obliczoną objętość denka tłoka. Wynik jest geometryczny.");
  };
  const save = () => {
    const data = { app: "RPM Custom CR Calculator 3D", version: 1, parameters: params, result: { ratio: calc.ratio, swept: calc.swept, clearance: calc.clearance } };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "RPM_Custom_CR_Configuration.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNote("Zapisano projekt JSON.");
  };
  const angleUpdate = (a: number) => setAngle(a);
  const phase = selectedPhase < 180 ? "PRACA" : selectedPhase < 360 ? "WYDECH" : selectedPhase < 540 ? "SSANIE" : "SPRĘŻANIE";
  const views: { id: R6View; text: string }[] = [
    { id: "perspective", text: "Izometria" },
    { id: "front", text: "Przekrój" },
    { id: "side", text: "Bok" },
    { id: "top", text: "Góra" },
  ];

  return <main className={styles.page}>
    <header className={styles.topbar}>
      <a href="/" className={styles.logo} aria-label="RPM Custom — strona główna">RPM <span>CUSTOM</span><small>MOTOLAB / ENGINEERING</small></a>
      <nav className={styles.nav} aria-label="Nawigacja">
        <a href="/designery">Kreatory CAD</a>
        <a href="/intake-designer">Kolektory 3D</a>
        <a href="/">Sklep ↗</a>
      </nav>
    </header>

    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.kicker}><span className={styles.liveDot} /> MOTOLAB / ENGINE SIMULATION / 001</div>
        <div className={styles.heroTitle}>
          <div>
            <h1>CR <em>Calculator</em> <span>3D.</span></h1>
            <p>Sprawdź rzeczywisty model bryły silnika R6 w formacie GLB lub przejdź do animowanego przekroju 720°. Podgląd referencyjny i kalkulator stopnia sprężania to dwa niezależne narzędzia.</p>
          </div>
          <div className={styles.heroStamp}>ENGINE<br />LAB<span>01 / 03</span></div>
        </div>
      </section>

      <div className={styles.dashboard}>
        <section className={styles.stageColumn} aria-label="Model 3D i animacja R6">
          <div className={styles.sceneTabs} role="group" aria-label="Wybierz rodzaj modelu">
            <button type="button" aria-pressed={sceneType === "reference"} className={sceneType === "reference" ? styles.sceneTabActive : ""}
              onClick={() => setSceneType("reference")}>Model R6 · GLB</button>
            <button type="button" aria-pressed={sceneType === "animated"} className={sceneType === "animated" ? styles.sceneTabActive : ""}
              onClick={() => setSceneType("animated")}>Animowany przekrój · 720°</button>
          </div>
          <div className={styles.stage}>
            <div className={styles.stageTop}>
              <span className={styles.stageTag}><span className={styles.pulse} /> {sceneType === "reference" ? "REFERENCYJNY MODEL 3D · R6" : "LIVE / R6 CUTAWAY 3D"}</span>
              <span className={styles.stageTopRight}>{sceneType === "reference" ? "CC0 · GLB · MODEL STATYCZNY" : "SZEŚĆ CYLINDRÓW · 24 ZAWORY"}</span>
            </div>
            <div className={styles.canvasWrap}>
              {sceneType === "reference"
                ? <ReferenceScene src={localGlb ?? "/api/cr-reference-model"} view={view} onStatus={onModelStatus} />
                : <Scene params={params} running={running} rpm={rpm} angle={angle} onAngle={angleUpdate}
                    view={view} mode={mode} selectedCylinder={selectedCylinder} focusCylinder={focusCylinder}
                    xray={xray} showGas={showGas} />}
            </div>
            {sceneType === "animated" ? <div className={styles.stageHUD}>
              <div className={styles.hudMetric}><small>CYLINDER {selectedCylinder} · SUW</small><strong>{phase}</strong></div>
              <div className={styles.hudMetric}><small>PRZEMIESZCZENIE TŁOKA</small><strong>{format(travel, 1)} <span>mm</span></strong></div>
              <div className={styles.hudMetric}><small>OBJĘTOŚĆ W CYLINDRZE</small><strong>{calc.valid ? format(volume, 1) : "—"} <span>cm³</span></strong></div>
            </div> : <div className={styles.assetHud}>
              <strong>{modelStatus === "ready" ? "MODEL 3D GOTOWY" : modelStatus === "error" ? "NIE UDAŁO SIĘ WCZYTAĆ" : "WCZYTYWANIE GEOMETRII…"}</strong>
              <span>{localGlbName || "Innerscene · Inline-6 Diesel · CC0"}</span>
            </div>}
          </div>
          <div className={styles.cameraBar}>
            <div className={styles.cameraViews} role="group" aria-label="Widok kamery">
              {views.map(item => <button key={item.id} className={view === item.id ? styles.cameraActive : ""} type="button" aria-pressed={view === item.id} onClick={() => setView(item.id)}>{sceneType === "reference" && item.id === "front" ? "Przód" : item.text}</button>)}
            </div>
            <div className={styles.cameraHelp}>Przeciągnij, aby obrócić · Dwa palce, aby przybliżyć</div>
          </div>
          {sceneType === "reference" && <div className={styles.assetInfo}>
            <strong>Rzeczywisty plik GLB — model referencyjny</strong>
            <p>To statyczny model z biblioteki CC0, a nie skan CT, przecięty model CAD ani animowany zespół. Służy do oceny bryły silnika. Nie zmienia kształtu pod wpływem suwaków CR.</p>
            {modelStatus === "error" && <p className={styles.assetError}>Nie udało się pobrać lub odczytać modelu z serwera. Możesz pobrać plik u źródła i wczytać go bezpośrednio z urządzenia.</p>}
            <div className={styles.assetActions}>
              <label className={styles.assetUpload}>Wczytaj własny plik .GLB
                <input type="file" accept=".glb,model/gltf-binary" onChange={e => handleLocalModel(e.currentTarget.files?.[0])} />
              </label>
              <a href="https://www.innerscene.com/tools/library/3d-parts/inline-6-truck-diesel-engine-with-turbocharger-b5416332" target="_blank" rel="noopener noreferrer">Źródło modelu CC0 ↗</a>
              {localGlb && <button type="button" onClick={() => {
                setLocalGlb(null);
                setLocalGlbName("");
                if (localGlbRef.current) URL.revokeObjectURL(localGlbRef.current);
                localGlbRef.current = null;
              }}>Przywróć model bazowy</button>}
            </div>
          </div>}
          {sceneType === "animated" && <div className={styles.r6Toolbar}>
            <div className={styles.r6ModeRow} role="group" aria-label="Widok przekroju silnika">
              {([
                { id: "complete", text: "Cały silnik" },
                { id: "bottom", text: "Dół silnika" },
                { id: "head", text: "Głowica" },
              ] as const).map(item =>
                <button key={item.id} type="button" aria-pressed={mode === item.id}
                  className={mode === item.id ? styles.r6Selected : ""}
                  onClick={() => { setMode(item.id); if (item.id === "head") setFocusCylinder(false); }}>
                  {item.text}
                </button>)}
            </div>
            <div className={styles.r6CylinderRow}>
              <span>CYLINDER</span>
              {Array.from({ length: 6 }, (_, i) => <button type="button" key={i + 1}
                aria-label={"Wybierz cylinder " + (i + 1)} aria-pressed={selectedCylinder === i + 1}
                className={selectedCylinder === i + 1 ? styles.r6Selected : ""}
                onClick={() => setSelectedCylinder(i + 1)}>{i + 1}</button>)}
              <button type="button" aria-pressed={focusCylinder} onClick={() => { setFocusCylinder(f => !f); if (mode === "head") setMode("complete"); }}
                className={focusCylinder ? styles.r6Selected : ""}>ZOOM</button>
            </div>
            <span className={styles.r6Firing}>KOLEJNOŚĆ ZAPŁONU: 1–5–3–6–2–4</span>
          </div>}
          {sceneType === "animated" && <div className={styles.player}>
            <button type="button" className={styles.playButton} onClick={() => setRunning(v => !v)} aria-label={running ? "Zatrzymaj animację" : "Uruchom animację"}>
              <Icon name={running ? "pause" : "play"} /> {running ? "PAUZA" : "START"}
            </button>
            <button type="button" className={styles.iconButton} onClick={() => { setRunning(false); setAngle(0); }} title="Ustaw GMP" aria-label="Ustaw GMP"><Icon name="reset" /></button>
            <div className={styles.speedControl}>
              <div><span>TEMPO ANIMACJI</span><strong>{rpm} obr./min</strong></div>
              <input type="range" min="2" max="60" step="1" value={rpm} onChange={e => setRpm(Number(e.currentTarget.value))} aria-label="Prędkość obrotowa animacji" />
            </div>
            <div className={styles.toggles}>
              <button type="button" aria-pressed={showGas} className={showGas ? styles.toggleActive : ""} onClick={() => setShowGas(v => !v)}>Komora</button>
              <button type="button" aria-pressed={xray} className={xray ? styles.toggleActive : ""} onClick={() => setXray(v => !v)}>X-RAY</button>
            </div>
          </div>}
          {sceneType === "animated" && <div className={styles.manual}>
            <div className={styles.manualLabel}><span>RĘCZNY OBRÓT WAŁU · PEŁNY CYKL 4-SUWOWY</span><strong>{format(angle, 0)}°</strong></div>
            <input type="range" min="0" max="720" step="1" value={angle} onChange={e => { setRunning(false); setAngle(Number(e.currentTarget.value)); }} aria-label="Ręczny kąt wału korbowego" />
            <div className={styles.angleStops}><span>0° GMP</span><span>180° DMP</span><span>360° GMP</span><span>540° DMP</span><span>720° GMP</span></div>
          </div>}
        </section>

        <aside className={styles.controls}>
          <section className={styles.resultCard}>
            <div className={styles.resultEyebrow}>GEOMETRYCZNY STOPIEŃ SPRĘŻANIA</div>
            <div className={styles.resultValue}>{calc.valid ? format(calc.ratio) : "—"}<span>:1</span></div>
            <div className={styles.resultCaption}>COMPRESSION RATIO <span>CR</span></div>
            <div className={styles.resultLine} />
            <div className={styles.resultStats}>
              <div><small>OBJĘTOŚĆ SKOKOWA</small><strong>{format(calc.displacement / 1000, 3)} l</strong></div>
              <div><small>JEDEN CYLINDER</small><strong>{format(calc.swept, 1)} cm³</strong></div>
              <div><small>OBJĘTOŚĆ W GMP</small><strong>{calc.valid ? format(calc.clearance, 2) : "—"} cm³</strong></div>
              <div><small>OBJĘTOŚĆ USZCZELKI</small><strong>{format(calc.gasket, 2)} cm³</strong></div>
            </div>
            {!calc.valid && <div className={styles.warning}>Nieprawidłowa geometria. Sprawdź długość korbowodu i całkowitą objętość komory.</div>}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelTitle}><span className={styles.number}>01</span><h2>Wybierz silnik</h2></div>
            <div className={styles.presetGrid}>
              {(Object.keys(PRESETS) as EnginePresetId[]).map(id => <button key={id} type="button" className={preset === id ? styles.presetActive : styles.preset} onClick={() => selectPreset(id)} aria-pressed={preset === id}>{PRESETS[id].label}</button>)}
            </div>
            <p className={styles.helper}>Model 3D przedstawia zawsze układ R6. Pole „Liczba cylindrów” wpływa na pojemność obliczeniową całego silnika. Presety są przykładowe — przed budową zmierz elementy.</p>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelTitle}><span className={styles.number}>02</span><h2>Blok i mechanizm</h2></div>
            {dimensions.map(field => <Field key={field.key} field={field} value={params[field.key]} onChange={v => change(field.key, v)} />)}
          </section>
          <section className={styles.panel}>
            <div className={styles.panelTitle}><span className={styles.number}>03</span><h2>Komora spalania</h2></div>
            {combustion.map(field => <Field key={field.key} field={field} value={params[field.key]} onChange={v => change(field.key, v)} />)}
          </section>
          <section className={styles.targetCard}>
            <div className={styles.panelTitle}><span className={styles.number}>04</span><h2>Oblicz docelowe CR</h2></div>
            <p>Podaj wymagany stopień sprężania. Obliczymy potrzebną objętość denka tłoka, przy pozostałych parametrach bez zmian.</p>
            <div className={styles.targetForm}>
              <label>DOCELOWY CR
                <input type="number" min="2" max="25" step="0.1" value={target}
                  onChange={e => { const n = e.currentTarget.valueAsNumber; if (Number.isFinite(n)) setTarget(Math.max(2, Math.min(25, n))); }} />
              </label>
              <div className={styles.targetResult}><small>WYMAGANE DENKO TŁOKA</small><strong>{format(targetPistonCc)} <span>cm³</span></strong></div>
            </div>
            <button type="button" className={styles.applyButton} onClick={applyTarget}>Zastosuj do projektu ↗</button>
            <p className={styles.helper}>Ujemny wynik oznacza kopułę. Rzeczywisty CR wymaga pomiaru głowicy, tłoka, uszczelki i wysokości tłoka w GMP.</p>
          </section>
          <button type="button" className={styles.saveButton} onClick={save}><Icon name="download" /> Pobierz konfigurację JSON</button>
          {note && <div className={styles.notice} role="status">{note}</div>}
        </aside>
      </div>

      <footer className={styles.foot}>
        <div><strong>RPM CUSTOM // ENGINEERING TOOLS</strong><p>CR = (pojemność skokowa jednego cylindra + objętość nad tłokiem w GMP) / objętość nad tłokiem w GMP.</p></div>
        <p>Model referencyjny: Innerscene, Inline-6 truck diesel engine with turbocharger, CC0. Importowana bryła nie jest animowana i nie reprezentuje M54/2JZ. Animowany model R6 pozostaje uproszczoną wizualizacją; stopień sprężania jest geometryczny.</p>
      </footer>
    </div>
  </main>;
}
