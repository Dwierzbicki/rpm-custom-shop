export type EnginePreset = "2jz-gte" | "2jz-ge" | "m50-m52" | "m54" | "universal";
export type BuildMethod = "tig" | "cnc";
export type PlenumShape = "round" | "oval" | "box";
export type ThrottleSide = "left" | "right";

export type IntakeParameters = {
  engine: EnginePreset;
  method: BuildMethod;
  cylinderCount: number;
  portPitch: number;
  runnerInnerDiameter: number;
  runnerWall: number;
  runnerReach: number;
  runnerRise: number;
  plenumVolume: number;
  plenumShape: PlenumShape;
  throttleDiameter: number;
  throttleSide: ThrottleSide;
  flangeThickness: number;
};

export const DEFAULT_INTAKE: IntakeParameters = {
  engine: "2jz-gte",
  method: "tig",
  cylinderCount: 6,
  portPitch: 92,
  runnerInnerDiameter: 43,
  runnerWall: 3,
  runnerReach: 145,
  runnerRise: 90,
  plenumVolume: 4.8,
  plenumShape: "round",
  throttleDiameter: 80,
  throttleSide: "left",
  flangeThickness: 12,
};

export const ENGINE_TEMPLATES: Record<EnginePreset, Pick<IntakeParameters, "cylinderCount" | "portPitch">> = {
  "2jz-gte": { cylinderCount: 6, portPitch: 92 },
  "2jz-ge": { cylinderCount: 6, portPitch: 92 },
  "m50-m52": { cylinderCount: 6, portPitch: 91 },
  m54: { cylinderCount: 6, portPitch: 91 },
  universal: { cylinderCount: 4, portPitch: 95 },
};

// The pitches are concept placeholders, NOT OEM specifications. GE/GTE and BMW head face patterns must never be treated as interchangeable.
export function intakePreset(name: EnginePreset): IntakeParameters {
  return { ...DEFAULT_INTAKE, ...ENGINE_TEMPLATES[name], engine: name };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const numberOr = (input: unknown, fallback: number) => typeof input === "number" && Number.isFinite(input) ? input : fallback;
const oneOf = <T extends string>(value: unknown, choices: readonly T[], fallback: T): T =>
  choices.includes(value as T) ? value as T : fallback;

export function normalizeIntake(input: Partial<IntakeParameters>): IntakeParameters {
  const base = { ...DEFAULT_INTAKE, ...input };
  const engine = oneOf(base.engine, ["2jz-gte", "2jz-ge", "m50-m52", "m54", "universal"] as const, "2jz-gte");
  const count = Math.round(clamp(numberOr(base.cylinderCount, 6), 3, 12));
  const inner = clamp(numberOr(base.runnerInnerDiameter, 43), 25, 75);
  const wall = clamp(numberOr(base.runnerWall, 3), 1.5, 8);
  return {
    engine,
    method: oneOf(base.method, ["tig", "cnc"] as const, "tig"),
    cylinderCount: engine === "universal" ? count : 6,
    portPitch: clamp(numberOr(base.portPitch, 92), inner + 2 * wall + 5, 150),
    runnerInnerDiameter: inner,
    runnerWall: wall,
    runnerReach: clamp(numberOr(base.runnerReach, 145), 70, 320),
    runnerRise: clamp(numberOr(base.runnerRise, 90), 40, 200),
    plenumVolume: clamp(numberOr(base.plenumVolume, 4.8), 1, 18),
    plenumShape: oneOf(base.plenumShape, ["round", "oval", "box"] as const, "round"),
    throttleDiameter: clamp(numberOr(base.throttleDiameter, 80), 40, 120),
    throttleSide: oneOf(base.throttleSide, ["left", "right"] as const, "left"),
    flangeThickness: clamp(numberOr(base.flangeThickness, 12), 6, 25),
  };
}

export type ManifoldDimensions = {
  runnerOutside: number;
  span: number;
  plenumLength: number;
  plenumRadius: number;
  plenumHeight: number;
  plenumDepth: number;
  totalLength: number;
  calculatedVolumeLiters: number;
};

export function calculateManifold(p: IntakeParameters): ManifoldDimensions {
  const runnerOutside = p.runnerInnerDiameter + p.runnerWall * 2;
  const span = (p.cylinderCount - 1) * p.portPitch;
  const plenumLength = span + 150;
  const mm3 = p.plenumVolume * 1_000_000;
  const area = mm3 / plenumLength;
  let plenumHeight: number;
  let plenumDepth: number;
  if (p.plenumShape === "box") {
    const side = Math.sqrt(area * 1.2);
    plenumHeight = side;
    plenumDepth = area / side;
  } else if (p.plenumShape === "oval") {
    plenumHeight = 2 * Math.sqrt(area * 1.32 / Math.PI);
    plenumDepth = 4 * area / (Math.PI * plenumHeight);
  } else {
    plenumHeight = 2 * Math.sqrt(area / Math.PI);
    plenumDepth = plenumHeight;
  }
  return {
    runnerOutside,
    span,
    plenumLength,
    plenumRadius: plenumHeight / 2,
    plenumHeight,
    plenumDepth,
    totalLength: plenumLength + 115,
    calculatedVolumeLiters: p.plenumVolume,
  };
}

export function intakeSummary(p: IntakeParameters) {
  const d = calculateManifold(p);
  return {
    kind: "RPM_CUSTOM_INTAKE_MANIFOLD_CONCEPT_V1",
    status: "CONCEPT_ONLY_NOT_PRODUCTION_VALIDATED",
    disclaimer: "Engine port locations and flanges are schematics. No CFD, FEA, CAM paths, STEP or manufacturing-ready geometry is included.",
    savedAt: new Date().toISOString(),
    parameters: p,
    approximateDimensions: d,
  };
}
