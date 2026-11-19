"use client";

/**
 * These are independently hosted reference assets, not interchangeable with
 * the parametric crank / piston / cylinder geometry of the 720° simulator.
 *
 * Every asset is CC BY and retains its original creator attribution. Models
 * are embedded with Sketchfab's public viewer; no asset files are copied.
 */
export type RealEngineModelId = "2jz" | "bmw" | "scan";

export const REAL_ENGINE_MODELS: Record<RealEngineModelId, {
  label: string;
  title: string;
  creator: string;
  id: string;
  source: string;
  description: string;
  scanned: boolean;
}> = {
  "2jz": {
    label: "Toyota 2JZ-GTE",
    title: "Toyota 2JZ-GTE · model 3D",
    creator: "autoNgraphic",
    id: "7ebc9741434540c4831453066d7ae057",
    source: "https://sketchfab.com/3d-models/toyota-2jz-gte-engine-free-7ebc9741434540c4831453066d7ae057",
    description: "Szczegółowy model silnika 2JZ-GTE z osprzętem. To model wykonany przez grafika, a nie skan ani rozbieralny model mechanizmu.",
    scanned: false,
  },
  bmw: {
    label: "BMW R6 · M52",
    title: "BMW M52B25 turbo · model 3D",
    creator: "Lauri Grekula",
    id: "53d65ac13e474b4b97d93e7f64635c9f",
    source: "https://sketchfab.com/3d-models/6-cylinder-turbo-engine-53d65ac13e474b4b97d93e7f64635c9f",
    description: "Artystyczna bryła R6 wzorowana na BMW M52B25. Nie jest modelem M54; autor zaznacza uproszczenia, szczególnie układu turbo.",
    scanned: false,
  },
  scan: {
    label: "Prawdziwy skan",
    title: "Car Engine (Scan) · skan 3D",
    creator: "Ele.Gpro",
    id: "dd9a090f00ed4e60a529e9f54b949634",
    source: "https://sketchfab.com/3d-models/car-engine-scan-dd9a090f00ed4e60a529e9f54b949634",
    description: "Fotogrametryczny skan rzeczywistego zespołu silnikowego z osprzętem. To powierzchnia zewnętrzna — bez animowanych podzespołów wewnętrznych; typ silnika nie jest potwierdzony.",
    scanned: true,
  },
};

export default function RealEngineViewer({ model }: { model: RealEngineModelId }) {
  const item = REAL_ENGINE_MODELS[model];
  return <iframe
    key={model}
    title={item.title}
    className="cr-sketchfab-viewer"
    src={`https://sketchfab.com/models/${item.id}/embed?autostart=1&ui_theme=dark&ui_hint=0`}
    allow="autoplay; fullscreen; xr-spatial-tracking"
    allowFullScreen
    loading="eager"
    referrerPolicy="strict-origin-when-cross-origin"
    style={{ display: "block", width: "100%", height: "100%", border: 0, background: "#0b121d" }}
  />;
}
