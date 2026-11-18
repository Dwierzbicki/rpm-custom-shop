export type EngineParams = {
  bore: number;
  stroke: number;
  rodLength: number;
  chamber: number;
  gasketBore: number;
  gasketThickness: number;
  deckClearance: number;
  pistonCc: number;
  cylinders: number;
};

export type EnginePresetId = "m54" | "2jz-gte" | "2jz-ge" | "custom";

export const PRESETS: Record<EnginePresetId, { label: string; params: EngineParams }> = {
  m54: {
    label: "BMW M54B30",
    params: { bore: 84, stroke: 89.6, rodLength: 135, chamber: 45, gasketBore: 85, gasketThickness: 1.7, deckClearance: 0, pistonCc: 0, cylinders: 6 },
  },
  "2jz-gte": {
    label: "Toyota 2JZ-GTE",
    params: { bore: 86, stroke: 86, rodLength: 142, chamber: 47, gasketBore: 87, gasketThickness: 1.3, deckClearance: 0, pistonCc: 8, cylinders: 6 },
  },
  "2jz-ge": {
    label: "Toyota 2JZ-GE",
    params: { bore: 86, stroke: 86, rodLength: 142, chamber: 45, gasketBore: 87, gasketThickness: 1.3, deckClearance: 0, pistonCc: 2, cylinders: 6 },
  },
  custom: {
    label: "Własny silnik",
    params: { bore: 84, stroke: 89.6, rodLength: 135, chamber: 45, gasketBore: 85, gasketThickness: 1.7, deckClearance: 0, pistonCc: 0, cylinders: 4 },
  },
};

// All linear dimensions are millimetres, volumes are cm³. Positive pistonCc
// means a dish / valve pockets; negative pistonCc means a dome.
export function calculateCompression(p: EngineParams) {
  const cylinderArea = Math.PI * p.bore * p.bore / 4;
  const swept = cylinderArea * p.stroke / 1000;
  const gasket = Math.PI * p.gasketBore * p.gasketBore / 4 * p.gasketThickness / 1000;
  const deck = cylinderArea * p.deckClearance / 1000;
  const clearance = p.chamber + gasket + deck + p.pistonCc;
  const valid = Number.isFinite(clearance) && clearance > 0 && p.bore > 0 && p.stroke > 0 && p.rodLength > p.stroke / 2;
  return {
    swept,
    gasket,
    deck,
    clearance,
    displacement: swept * p.cylinders,
    ratio: valid ? (swept + clearance) / clearance : NaN,
    valid,
  };
}

export function pistonTravel(p: EngineParams, angleDeg: number) {
  const r = p.stroke / 2;
  const angle = angleDeg * Math.PI / 180;
  const projected = r * Math.sin(angle);
  const underRoot = p.rodLength * p.rodLength - projected * projected;
  return r * (1 - Math.cos(angle)) + p.rodLength - Math.sqrt(Math.max(0, underRoot));
}

export function volumeAtAngle(p: EngineParams, angleDeg: number) {
  return calculateCompression(p).clearance + (Math.PI * p.bore * p.bore / 4) * pistonTravel(p, angleDeg) / 1000;
}

export function requiredPistonCc(p: EngineParams, targetRatio: number) {
  if (!Number.isFinite(targetRatio) || targetRatio <= 1) return NaN;
  const c = calculateCompression(p);
  return c.swept / (targetRatio - 1) - p.chamber - c.gasket - c.deck;
}
